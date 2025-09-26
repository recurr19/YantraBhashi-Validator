import { useState, useRef } from "react";

function App() {
  const [code, setCode] = useState("");
  const [results, setResults] = useState("");
  const [dividerPos, setDividerPos] = useState(50);
  const containerRef = useRef();

  const validateCode = async () => {
    setResults("Validating...");
    try {
      const response = await fetch("http://localhost:5001/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();

      let output = "";
      if (data.errors.length === 0 && data.warnings.length === 0) {
        output = "✅ No errors or warnings!";
      } else {
        data.errors.forEach(
          (e) =>
            (output += `❌ Line ${e.lineno}: ${e.msg}\n${
              e.suggestion ? "   Suggestion: " + e.suggestion + "\n" : ""
            }`)
        );
        data.warnings.forEach(
          (w) =>
            (output += `⚠️ Line ${w.lineno}: ${w.msg}\n${
              w.suggestion ? "   Suggestion: " + w.suggestion + "\n" : ""
            }`)
        );
      }
      setResults(output);
    } catch (err) {
      setResults("Error connecting to backend: " + err.message);
    }
  };

  const startDrag = (e) => {
    const doDrag = (moveEvent) => {
      const containerWidth = containerRef.current.offsetWidth;
      const newDividerPos =
        ((moveEvent.clientX - containerRef.current.offsetLeft) /
          containerWidth) *
        100;
      if (newDividerPos > 10 && newDividerPos < 90) {
        setDividerPos(newDividerPos);
      }
    };

    const stopDrag = () => {
      window.removeEventListener("mousemove", doDrag);
      window.removeEventListener("mouseup", stopDrag);
    };

    window.addEventListener("mousemove", doDrag);
    window.addEventListener("mouseup", stopDrag);
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", margin: "20px" }}>
      <h1>Yantrabhasha Validator</h1>

      {/* Container with resizable panels */}
      <div
        ref={containerRef}
        style={{
          display: "flex",
          gap: "20px",
          height: "500px",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #ccc",
        }}
      >
        {/* Left Panel: Code Input */}
        <div
          style={{
            flexBasis: `${dividerPos}%`,
            display: "flex",
            flexDirection: "column",
            padding: "10px",
            background: "#fdfdfd",
          }}
        >
          <h2>Code Input</h2>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Write your Yantrabhasha code here..."
            style={{
              flex: 1,
              width: "100%",
              borderRadius: "8px",
              border: "1px solid #ccc",
              padding: "10px",
              fontFamily: "monospace",
              fontSize: "14px",
              resize: "none",
            }}
          />
        </div>

        {/* Divider */}
        <div
          onMouseDown={startDrag}
          style={{
            width: "6px",
            cursor: "col-resize",
            backgroundColor: "#ddd",
            borderRadius: "3px",
          }}
        />

        {/* Right Panel: Results */}
        <div
          style={{
            flexBasis: `${100 - dividerPos}%`,
            padding: "10px",
            background: "#f9f9f9",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2>Results</h2>
          <pre
            style={{
              background: "#f0f0f0",
              padding: "10px",
              borderRadius: "8px",
              flex: 1,
              whiteSpace: "pre-wrap",
              overflowY: "auto",
            }}
          >
            {results}
          </pre>
        </div>
      </div>

      <br />
      <button
        onClick={validateCode}
        style={{
          padding: "10px 20px",
          marginTop: "20px",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#4CAF50",
          color: "white",
          cursor: "pointer",
        }}
      >
        Validate
      </button>
    </div>
  );
}

export default App;


