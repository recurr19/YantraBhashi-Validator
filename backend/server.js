const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ---------- Helper Functions ----------
const reserved = new Set([
  'PADAM','ANKHE','VARTTAI','ELAITHE','ALAITHE','MALLI-MALLI','CHATIMPU','CHEPPU'
]);
const reIdentifier = /^[A-Za-z][A-Za-z0-9_]*$/;
const intLiteral = /^-?\d+$/;
const stringLiteral = /^"(?:[^"\\]|\\.)*"$/;

function pushError(arr, lineno, msg, suggestion = null) {
  arr.push({ lineno, type: 'error', msg, suggestion });
}
function pushWarn(arr, lineno, msg, suggestion = null) {
  arr.push({ lineno, type: 'warning', msg, suggestion });
}

// Preprocess: remove comments (not inside strings) and split lines
function preprocess(text) {
  return text.replace(/\r\n/g, '\n')
    .split('\n')
    .map((line, idx) => {
      let rawLine = line;
      let trimmedLine = '';
      let inString = false;

      for (let i = 0; i < rawLine.length; i++) {
        const char = rawLine[i];
        if (char === '"') inString = !inString;
        if (char === '#' && !inString) break; // stop at # outside string
        trimmedLine += char;
      }

      return {
        lineno: idx + 1,
        raw: rawLine,
        trimmed: trimmedLine.trim()
      };
    });
}

// Validate expressions: integers, identifiers, operators, parentheses, strings
function validateExpression(expr, lineno, errors, warnings, symbols, allowString=false) {
  const tokens = expr
    .replace(/\(/g, ' ( ')
    .replace(/\)/g, ' ) ')
    .replace(/\+/g, ' + ')
    .replace(/-/g, ' - ')
    .replace(/\*/g, ' * ')
    .replace(/\//g, ' / ')
    .replace(/%/g, ' % ')
    .split(/\s+/)
    .filter(Boolean);

  const ops = new Set(['+','-','*','/','%']);
  let paren = 0;
  for (const t of tokens) {
    if (t === '(') { paren++; continue; }
    if (t === ')') { paren--; if (paren < 0) { pushError(errors, lineno, `Unmatched ')' in expression '${expr}'`); return false; } continue; }
    if (ops.has(t)) continue;
    if (intLiteral.test(t)) continue;
    if (allowString && stringLiteral.test(t)) continue;
    if (reIdentifier.test(t)) {
      if (!(t in symbols)) {
        pushError(errors, lineno, `Undeclared variable '${t}' in expression '${expr}'`, `Declare '${t}' before use: PADAM ${t}:ANKHE;`);
        return false;
      }
      if (!allowString && symbols[t].type !== 'ANKHE') {
        pushError(errors, lineno, `Type mismatch: variable '${t}' not ANKHE`, `Use ANKHE for integer expressions.`);
        return false;
      }
      if (allowString && !['ANKHE','VARTTAI'].includes(symbols[t].type)) {
        pushError(errors, lineno, `Variable '${t}' type not supported for this expression`);
        return false;
      }
      continue;
    }
    pushError(errors, lineno, `Invalid token '${t}' in expression '${expr}'`);
    return false;
  }
  if (paren !== 0) {
    pushError(errors, lineno, `Mismatched parentheses in expression '${expr}'`);
    return false;
  }
  return true;
}

// ---------- Validator ----------
function validateYantrabhasha(code) {
  const lines = preprocess(code);
  const errors = [];
  const warnings = [];
  const symbols = {};
  const blockStack = [];

  const isBlankOrComment = (t) => t === '';

  for (const lineObj of lines) {
    const { lineno, trimmed } = lineObj;
    if (isBlankOrComment(trimmed)) continue;

    // ---------------- Block headers ----------------
    if (/^ELAITHE\b/.test(trimmed)) {
      const m = trimmed.match(/^ELAITHE\s*\((.*)\)\s*\[\s*$/);
      if (!m) pushError(errors, lineno, `Malformed ELAITHE header`, `Example: ELAITHE (x < 10) [`);
      else {
        const cond = m[1].trim();
        const relops = ['==','!=','<=','>=','<','>'];
        let opFound = null;
        for (const op of relops) if (cond.includes(op)) { opFound = op; break; }
        if (!opFound) pushError(errors, lineno, `Condition must use relational operator`, `Use: ELAITHE (a == 5) [`);
        else {
          const parts = cond.split(opFound).map(s=>s.trim());
          if (parts.length !==2) pushError(errors, lineno, `Malformed condition around '${opFound}'`);
          else {
            const left = parts[0];
            const right = parts[1];
            const leftType = (symbols[left] && symbols[left].type) || (stringLiteral.test(left) ? 'VARTTAI' : null);
            const rightType = (symbols[right] && symbols[right].type) || (stringLiteral.test(right) ? 'VARTTAI' : null);
            if (leftType === 'VARTTAI' || rightType === 'VARTTAI') {
              validateExpression(left, lineno, errors, warnings, symbols, true);
              validateExpression(right, lineno, errors, warnings, symbols, true);
            } else {
              validateExpression(left, lineno, errors, warnings, symbols);
              validateExpression(right, lineno, errors, warnings, symbols);
            }
          }
        }
      }
      blockStack.push({ type: 'ELAITHE', lineno });
      continue;
    }

    if (/^ALAITHE\b/.test(trimmed)) {
      const m = trimmed.match(/^ALAITHE\s*\[\s*$/);
      if (!m) pushError(errors, lineno, `Malformed ALAITHE header`, `Use: ALAITHE [`);
      blockStack.push({ type: 'ALAITHE', lineno });
      continue;
    }

    if (/^MALLI-MALLI\b/.test(trimmed)) {
      const m = trimmed.match(/^MALLI-MALLI\s*\((.*)\)\s*\[\s*$/);
      if (!m) { pushError(errors, lineno, `Malformed MALLI-MALLI header`); blockStack.push({type:'MALLI', lineno}); continue; }
      const parts = m[1].split(';').map(s => s.trim()).filter(Boolean);
      if (parts.length !== 3) pushError(errors, lineno, `Loop header must have init;condition;update`);
      else {
        // Init
        const init = parts[0];
        if (/^PADAM\b/.test(init)) {
          const dm = init.match(/^PADAM\s+([A-Za-z][A-Za-z0-9_]*)\s*:\s*ANKHE\s*=\s*(-?\d+)\s*$/);
          if (!dm) pushError(errors, lineno, `Malformed loop init. Expected: PADAM i:ANKHE = 0`);
          else { symbols[dm[1]] = { type:'ANKHE', declaredLine: lineno, initialized:true }; }
        } else {
          const am = init.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
          if (!am) pushError(errors, lineno, `Loop init must be PADAM declaration or assignment`);
          else if (!(am[1] in symbols)) pushError(errors, lineno, `Loop init uses undeclared variable '${am[1]}'`);
          else validateExpression(am[2], lineno, errors, warnings, symbols);
        }

        // Condition
        const cond = parts[1]; let opFound = null;
        const relops = ['==','!=','<=','>=','<','>'];
        for(const op of relops) if (cond.includes(op)) { opFound = op; break; }
        if (!opFound) pushError(errors, lineno, `Loop condition must use relational operator`);
        else {
          const [L,R] = cond.split(opFound).map(s=>s.trim());
          validateExpression(L, lineno, errors, warnings, symbols);
          validateExpression(R, lineno, errors, warnings, symbols);
        }

        // Update
        const upd = parts[2];
        const updMatch = upd.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*([A-Za-z][A-Za-z0-9_]*)\s*([\+\-])\s*(\d+)\s*$/);
        if (!updMatch) pushError(errors, lineno, `Loop update must be like 'i = i + 1'`);
        else if (updMatch[1] !== updMatch[2]) pushError(errors, lineno, `Loop update variables do not match`);
        else if (!(updMatch[1] in symbols)) pushWarn(warnings, lineno, `Loop update variable undeclared`);
      }
      blockStack.push({ type: 'MALLI', lineno });
      continue;
    }

    // Closing bracket
    if (/^\]$/.test(trimmed)) {
      if (blockStack.length===0) pushError(errors, lineno, `Unmatched closing bracket ']'`);
      else blockStack.pop();
      continue;
    }

    // ---------------- Statements ----------------
    if (/^PADAM\b/.test(trimmed)) {
      const dm = trimmed.match(/^PADAM\s+([A-Za-z][A-Za-z0-9_]*)\s*:\s*(ANKHE|VARTTAI)\s*(=\s*(.+))?\s*;$/);
      if (!dm) { pushError(errors, lineno, `Malformed PADAM declaration`, `Example: PADAM x:ANKHE = 0;`); continue; }
      const [_, name, type, __, val] = dm;
      if (reserved.has(name)) pushError(errors, lineno, `Identifier '${name}' is reserved`);
      symbols[name] = { type, declaredLine: lineno, initialized: val!=undefined };
      if (val!==undefined) validateExpression(val, lineno, errors, warnings, symbols, type==='VARTTAI');
      continue;
    }

    if (/^CHATIMPU\s*\((.+)\)\s*;$/i.test(trimmed)) {
      const arg = trimmed.match(/^CHATIMPU\s*\((.+)\)\s*;$/i)[1].trim();
      if (intLiteral.test(arg) || stringLiteral.test(arg)) continue;
      if (reIdentifier.test(arg)) {
        if (!(arg in symbols)) pushError(errors, lineno, `CHATIMPU uses undeclared variable '${arg}'`);
        else continue; // ANKHE or VARTTAI allowed
      }
      continue;
    }
    if (/^CHEPPU\s*\((.+)\)\s*;$/i.test(trimmed)) {
      const arg = trimmed.match(/^CHEPPU\s*\((.+)\)\s*;$/i)[1].trim();
      if (!(arg in symbols)) pushError(errors, lineno, `CHEPPU uses undeclared variable '${arg}'`);
      continue;
    }

    // Assignment
    const am = trimmed.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+);$/);
    if (am) {
      const [_, left, right] = am;
      if (!(left in symbols)) pushError(errors, lineno, `Assignment to undeclared variable '${left}'`);
      else validateExpression(right, lineno, errors, warnings, symbols, symbols[left].type==='VARTTAI');
      continue;
    }

    // Catch-All Semicolon Check
    if (
      !trimmed.endsWith(';') &&
      !/^ELAITHE\b/.test(trimmed) &&
      !/^ALAITHE\b/.test(trimmed) &&
      !/^MALLI-MALLI\b/.test(trimmed) &&
      !/^\]\s*(ELAITHE|ALAITHE|MALLI-MALLI)?/.test(trimmed) &&
      trimmed !== ']'
    ) {
      pushError(errors, lineno, `Statement must end with semicolon`);
    }
  }

  if (blockStack.length>0) {
    blockStack.forEach(b=>pushError(errors, b.lineno, `Block '${b.type}' not closed with ']'`));
  }

  return { errors, warnings };
}

// ---------- Routes ----------
app.post('/validate', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  const results = validateYantrabhasha(code);
  res.json(results);
});

// ---------- Start Server ----------
app.listen(5001, () => {
  console.log('Server running on port 5001');
});
