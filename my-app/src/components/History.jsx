import { useState, useEffect } from "react";

export default function History() {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5001/results")
      .then((res) => res.json())
      .then((data) => setHistory(data.slice(0, 10))) // latest 10 only
      .catch((err) => console.error(err));
  }, []);

  return (
    <div
      style={{
        marginTop: "20px",
        maxWidth: "800px",
        margin: "20px auto",
        textAlign: "center",
      }}
    >
      <h2 style={{ marginBottom: "15px" }}>History</h2>
      {history.length === 0 && <p>No history yet.</p>}

      {/* Vertical slider with bigger cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxHeight: "250px", // shows ~4-5 cards
          overflowY: "auto",
          gap: "15px",
        }}
      >
        {history.map((item) => (
          <div
            key={item._id}
            onClick={() => setSelected(item)}
            style={{
              padding: "15px",
              borderRadius: "12px",
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
              textAlign: "left",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              fontSize: "16px",
              fontWeight: "500",
            }}
          >
            {item.code.substring(0, 60)}
            {item.code.length > 60 ? "..." : ""}
          </div>
        ))}
      </div>

      {/* Popup for selected code */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              maxWidth: "650px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h3>Code</h3>
            <pre
              style={{
                background: "#f0f0f0",
                padding: "15px",
                borderRadius: "8px",
                fontSize: "15px",
              }}
            >
              {selected.code}
            </pre>

            <h3>Errors</h3>
            {selected.validationErrors.length === 0 ? (
              <p>✅ No errors</p>
            ) : (
              <ul>
                {selected.validationErrors.map((e, idx) => (
                  <li key={idx}>
                    ❌ Line {e.lineno}: {e.msg}
                    {e.suggestion && <div style={{ color: "#555" }}>Suggestion: {e.suggestion}</div>}
                  </li>
                ))}
              </ul>
            )}

            <h3>Warnings</h3>
            {selected.validationWarnings.length === 0 ? (
              <p>⚠️ No warnings</p>
            ) : (
              <ul>
                {selected.validationWarnings.map((w, idx) => (
                  <li key={idx}>
                    ⚠️ Line {w.lineno}: {w.msg}
                    {w.suggestion && <div style={{ color: "#555" }}>Suggestion: {w.suggestion}</div>}
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={() => setSelected(null)}
              style={{
                marginTop: "15px",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: "#4CAF50",
                color: "white",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
