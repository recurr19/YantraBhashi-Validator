const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

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
        if (char === '#' && !inString) break; 
        trimmedLine += char;
      }

      return {
        lineno: idx + 1,
        raw: rawLine,
        trimmed: trimmedLine.trim()
      };
    });
}

function validateExpression(expr, lineno, errors, warnings, symbols, allowString = false) {
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

  const ops = new Set(['+', '-', '*', '/', '%']);
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
      if (allowString && !['ANKHE', 'VARTTAI'].includes(symbols[t].type)) {
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


app.listen(5001, () => {
  console.log('Server running on port 5001');
});


