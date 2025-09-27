import { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Analytics from "./components/Analytics";
import History from "./components/History";

function App() {
  const [code, setCode] = useState("");
  const [results, setResults] = useState("");
  const [dividerPos, setDividerPos] = useState(50);
  const containerRef = useRef();

  // ---------- Instructor check ----------
  const [showInstructorPopup, setShowInstructorPopup] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [analyticsKey, setAnalyticsKey] = useState("");
  const INSTRUCTOR_KEY = "YOUR_UNIQUE_INSTRUCTOR_KEY"; // replace with real key

  useEffect(() => {
    const instructorStatus = localStorage.getItem("isInstructor");
    if (!instructorStatus) setShowInstructorPopup(true);
    else setIsInstructor(true);
  }, []);

  const handleInstructorSubmit = () => {
    if (analyticsKey === INSTRUCTOR_KEY) {
      setIsInstructor(true);
      localStorage.setItem("isInstructor", "true");
      setShowInstructorPopup(false);
    } else {
      alert("Wrong key! Access denied.");
    }
  };

  // ---------- Existing validate function ----------
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

  // ---------- Divider drag ----------
  const startDrag = (e) => {
    const doDrag = (moveEvent) => {
      const containerWidth = containerRef.current.offsetWidth;
      const newDividerPos =
        ((moveEvent.clientX - containerRef.current.offsetLeft) / containerWidth) *
        100;
      if (newDividerPos > 10 && newDividerPos < 90) setDividerPos(newDividerPos);
    };
    const stopDrag = () => {
      window.removeEventListener("mousemove", doDrag);
      window.removeEventListener("mouseup", stopDrag);
    };
    window.addEventListener("mousemove", doDrag);
    window.addEventListener("mouseup", stopDrag);
  };

  return (
    <Routes>
      <Route path="/" element={
        <div style={{ fontFamily: "Arial, sans-serif", margin: "20px", textAlign: "center" }}>
          {/* ---------- Instructor Popup ---------- */}
          {showInstructorPopup && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: "30px",
                borderRadius: "12px",
                minWidth: "300px",
                textAlign: "center",
              }}
            >
              <h2>Are you an instructor?</h2>
              <input
                type="text"
                placeholder="Enter your key"
                value={analyticsKey}
                onChange={(e) => setAnalyticsKey(e.target.value)}
                style={{ padding: "8px", width: "80%", marginTop: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
              <br />
              <button
                onClick={() => {
                  if (analyticsKey === INSTRUCTOR_KEY) {
                    setIsInstructor(true);
                    localStorage.setItem("isInstructor", "true");
                  } else {
                    alert("Invalid key!");
                  }
                  setShowInstructorPopup(false);
                }}
                style={{
                  marginTop: "15px",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Submit
              </button>

              {/* Line separator and Continue as User */}
              <div
                style={{
                  marginTop: "15px",
                  fontSize: "14px",
                  color: "#555",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
                onClick={() => {
                  setIsInstructor(false);
                  setShowInstructorPopup(false);
                }}
              >
                or Continue as User
              </div>
            </div>
          </div>
        )}

          {/* ---------- Existing layout ---------- */}
          <h1>Yantrabhasha Validator</h1>

          <div
            ref={containerRef}
            style={{
              display: "flex",
              gap: "20px",
              height: "400px",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #ccc",
              margin: "20px auto",
              maxWidth: "1000px",
            }}
          >
            {/* Code input */}
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
              <div style={{ display: "flex", height: "100%", fontFamily: "monospace" }}>
                <div
                  style={{
                    background: "#eee",
                    padding: "10px",
                    textAlign: "right",
                    userSelect: "none",
                    color: "#888",
                  }}
                >
                  {code.split("\n").map((_, idx) => (
                    <div key={idx}>{idx + 1}</div>
                  ))}
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Write your Yantrabhasha code here..."
                  style={{
                    flex: 1,
                    width: "100%",
                    border: "none",
                    borderRadius: "0",
                    padding: "10px",
                    fontFamily: "monospace",
                    fontSize: "14px",
                    resize: "none",
                    outline: "none",
                  }}
                />
              </div>
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

            {/* Results */}
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

          {/* Validate Button */}
          <button
            onClick={validateCode}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#4CAF50",
              color: "white",
              cursor: "pointer",
            }}
          >
            Validate
          </button>

          {/* History */}
          <History />

          {/* Analytics Tab */}
          {isInstructor==true && (
            <div
              style={{
                position: "fixed",
                top: "20px",
                right: "20px",
                cursor: "pointer",
                padding: "10px 15px",
                background: "#4CAF50",
                color: "white",
                borderRadius: "8px",
                fontWeight: "bold",
              }}
              onClick={() => window.open("/analytics", "_blank")}
            >
              Analytics
            </div>
          )}
        </div>
    } />
      <Route path="/analytics" element={<Analytics />} />
    </Routes>
  );
}

export default App;
