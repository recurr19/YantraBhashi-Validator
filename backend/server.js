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

app.listen(5001, () => {
  console.log('Server running on port 5001');
});

