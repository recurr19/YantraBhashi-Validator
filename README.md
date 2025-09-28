# Team 15

```bash
https://github.com/recurr19/YantraBhashi-Validator
```

## Members
- Pranjit Gautam (2025201062)
- Srushti Pekamwar (2025201066)
- Param Modi (2025201087)
- Anurag Kaushal (2025202013)
- K LAKSHMI SAI AASRITHA (2025204019)

---
# Yantrabhasha Validator

## 1. How Parsing Works

Parsing in our Yantrabhasha validator is a structured process that ensures the code is syntactically and semantically correct before execution. It is divided into three distinct phases:

### 1.1 Preprocessing
- All line endings are normalized to `
` for consistency across different operating systems.  
- Code is split into separate lines with line numbers tracked.  
- Comments starting with `#` are removed, but only when they occur **outside string literals**. This ensures that comments inside string values are preserved.  
- Each line is trimmed of whitespace.  

**Output of this stage**: A structured list of objects, each containing:
```json
{ lineno, raw, trimmed }
```
Where `lineno` is the line number, `raw` is the original line, and `trimmed` is the cleaned version used for validation.

---

### 1.2 Tokenization
The `tokenize` function converts expressions into atomic units called *tokens*.  
- Tokens can be:
  - Identifiers (`variableName`)
  - Integer literals (`123`, `-45`)
  - String literals (`"hello"`)
  - Operators (`+`, `-`, `*`, `/`, `%`)
  - Parentheses (`(`, `)`)
- Strings are treated as single tokens, even if they contain spaces or escaped characters.

Example:
```yantrabhasha
a + (b * 5) - "hello"
```
Tokenizes into:
```
["a", "+", "(", "b", "*", "5", ")", "-", ""hello""]
```

---

### 1.3 Validation
Validation is the core phase where rules of Yantrabhasha are enforced. It covers:

- **Syntax validation**
  - Statement structure (`PADAM x:ANKHE = 5;`)
  - Proper use of semicolons
  - Correct block headers (`ELAITHE (...) [`, `MALLI-MALLI (...;...;...) [`)
- **Semantic validation**
  - Variables must be declared before use
  - Types must match (e.g., integers cannot be assigned to strings)
- **Structural validation**
  - Blocks must open with `[` and close with `]`
  - Parentheses must balance in expressions

Symbol tables and block stacks are maintained during this phase to track declared variables and nesting of control structures.

---

## 2. Logic of Parsing (Developer Reference)

The parser is implemented as a line-by-line validator.

### 2.1 Block Handling
- **ELAITHE (if)**  
  - Header must follow `ELAITHE (condition) [`  
  - The condition must use a relational operator (`==, !=, <, >, <=, >=`)  
  - Both sides of condition validated with `validateExpression`  

- **ALAITHE (else)**  
  - Must be declared as `ALAITHE [`  

- **MALLI-MALLI (loop)**  
  - Header format: `MALLI-MALLI(init; condition; update) [`  
  - Init: Must be a declaration (`PADAM i:ANKHE = 0`) or assignment (`i=0`)  
  - Condition: Must use relational operators  
  - Update: Must be of form `i = i + 1` or `i = i - 1`  
  - Loop stack ensures correct nesting  

- **Closing Blocks**  
  - `]` must match an open block, otherwise error is thrown.  

---

### 2.2 PADAM Declaration
Format:
```yantrabhasha
PADAM name:TYPE = value;
```
- `name`: identifier, must not be reserved keyword  
- `TYPE`: `ANKHE` (integer) or `VARTTAI` (string)  
- `value`: optional initializer  
  - `ANKHE`: must be integer literal (`10`, `-5`)  
  - `VARTTAI`: must be string literal (`"hello"`)  
- Semicolon required at the end.  

Example valid declaration:
```yantrabhasha
PADAM count:ANKHE = 5;
PADAM message:VARTTAI = "Hello";
```

---

### 2.3 Assignments
Format:
```yantrabhasha
variable = expression;
```
- Left-hand variable must already be declared  
- Expression validated token-by-token  
- Type compatibility enforced:  
  - ANKHE variables only accept integers or integer expressions  
  - VARTTAI variables only accept string literals or VARTTAI identifiers  

---

### 2.4 Expressions
- Valid tokens: integer literals, string literals, identifiers, operators, parentheses  
- Parentheses must balance  
- Identifiers checked against symbol table  
- Operators must be between valid operands  

Examples:
```yantrabhasha
a + b * (c - 2)
"hello" + "world"
```

---

### 2.5 Output Statements
- **CHATIMPU (print literal/variable)**  
  Format: `CHATIMPU(value);`  
  - `value` must be integer, string, or declared variable  

- **CHEPPU (print variable only)**  
  Format: `CHEPPU(variable);`  
  - Argument must be a declared variable  

Examples:
```yantrabhasha
CHATIMPU("Hello World");
CHATIMPU(42);
CHEPPU(message);
```

---

## 3. Types of Errors Detected

### 3.1 Syntax Errors
- Missing semicolon  
- Malformed `PADAM` declaration  
- Malformed `ELAITHE` or `MALLI-MALLI` headers  
- Unmatched closing bracket `]`  
- Mismatched parentheses in expressions  

### 3.2 Semantic Errors
- Using undeclared variables  
- Assigning string to ANKHE or integer to VARTTAI  
- Loop updates with mismatched variables  
- Type mismatch in expressions  

### 3.3 Structural Errors
- Opening blocks not closed  
- Orphan closing bracket without matching opening  

### 3.4 Warnings
- Loop update variable not declared before use  

---

## 4. Program Flow

1. **POST /validate** receives Yantrabhasha code.  
2. **Preprocessing** removes comments, splits lines, trims spaces.  
3. **Parsing** processes line by line:  
   - Detect block headers  
   - Process declarations  
   - Validate assignments  
   - Handle print statements  
   - Manage closing brackets  
4. **Expression validation** ensures tokens, parentheses, and types are valid.  
5. **Collect errors/warnings** into structured JSON.  
6. **Save results** in MongoDB for analytics.  
7. **Return response** to client.  

---

## 5. Syntax Rules (Quick Reference)

- Declarations: `PADAM name:TYPE = value;`  
- If: `ELAITHE (a < 5) [`  
- Else: `ALAITHE [`  
- Loop: `MALLI-MALLI (init; condition; update) [`  
- Print literal/variable: `CHATIMPU(x);` or `CHATIMPU("hello");`  
- Print variable only: `CHEPPU(x);`  
- Blocks closed with `]`  

---

## 6. Conclusion

This validator enforces strict syntax and semantics for Yantrabhasha. It uses a preprocessing → tokenization → validation pipeline, maintains a symbol table and block stack, and detects both syntax and semantic issues.  
All results are stored in MongoDB for analytics, including error/warning counts, types, and trends.  
This ensures both developers and instructors have full visibility into language correctness.  

---

## 7. Sample Testcases

### 7.1 Syntax Errors
```yantrabhasha
PADAM a.ANKHE = 10;
```
❌ Line 1: Malformed PADAM declaration  
💡 Suggestion: Example: `PADAM x:ANKHE = 0;`

```yantrabhasha
PADAM x:ANKHE 0;
```
❌ Line 1: Malformed PADAM declaration  
💡 Suggestion: Example: `PADAM x:ANKHE = 0;`

```yantrabhasha
PADAM x:VARTTAI = Hello;
```
❌ Line 1: VARTTAI variable initializer must be a string literal  
💡 Suggestion: Example: `PADAM x:VARTTAI = "Hello";`

```yantrabhasha
PADAM x.ANKHE;
PADAM y:VARTTAI;
PADAM sum.ANKHE;
sum = x+y;
```
❌ Line 1: Malformed PADAM declaration  
❌ Line 3: Malformed PADAM declaration  
❌ Line 5: Assignment to undeclared variable 'sum'  
💡 Suggestion: Example: `PADAM x:ANKHE = 0;`

```yantrabhasha
ELAITHE x > 5]
```
❌ Line 1: Malformed ELAITHE header  
💡 Suggestion: Example: `ELAITHE (x < 10) [`  
❌ Line 1: Block 'ELAITHE' not closed with `]`

```yantrabhasha
PADAM x:ANKHE;
ELAITHE (x > 5) [
```
❌ Line 2: Block 'ELAITHE' not closed with `]`

```yantrabhasha
MALLI-MALLI (PADAM i:ANKHE = 0; i<10; i=i+1
```
❌ Line 1: Malformed MALLI-MALLI header  
❌ Line 1: Block 'MALLI' not closed with `]`

```yantrabhasha
PADAM x.ANKHE;
x = 5
```
❌ Line 1: Malformed PADAM declaration  
💡 Suggestion: Example: `PADAM x:ANKHE = 0;`  
❌ Line 2: Statement must end with semicolon

---

### 7.2 Semantic Errors
```yantrabhasha
PADAM a:ANKHE = 5;
a = b;
```
❌ Line 2: Undeclared variable 'b' in expression 'b'  
💡 Suggestion: Declare 'b' before use: `PADAM b:ANKHE;`

```yantrabhasha
PADAM a:ANKHE = "Hello";
```
❌ Line 1: Initializer for 'a' must be an integer literal  
💡 Suggestion: Example: `PADAM a:ANKHE = 5;`

```yantrabhasha
PADAM b:VARTTAI = 5;
```
❌ Line 1: VARTTAI variable initializer must be a string literal  
💡 Suggestion: Example: `PADAM b:VARTTAI = "Hello";`

```yantrabhasha
PADAM i:ANKHE = 1;
i = i + "1";
```
❌ Line 2: Invalid token `"1"` in expression `i + "1"`

```yantrabhasha
MALLI-MALLI (PADAM i:VARTTAI = "0"; i<10; i=i+1) [
]
```
❌ Line 2: Malformed loop init. Expected: `PADAM i:ANKHE = 0`  
❌ Line 2: Undeclared variable 'i' in expression 'i'  
⚠️ Line 2: Loop update variable undeclared

```yantrabhasha
CHEPPU("text");
```
❌ Line 1: CHEPPU uses undeclared variable `"text"`

```yantrabhasha
PADAM y:VARTTAI;
PADAM x:ANKHE;
x = y + z;
```
❌ Line 4: Type mismatch: variable 'y' not ANKHE  
💡 Suggestion: Use ANKHE for integer expressions.

```yantrabhasha
MALLI-MALLI (PADAM i:ANKHE=0;i<10;i=i+j)[
]
```
❌ Line 1: Loop update must be like `i = i + 1`

```yantrabhasha
PADAM PADAM:ANKHE = 10;
```
❌ Line 1: Identifier 'PADAM' is reserved
