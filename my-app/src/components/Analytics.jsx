import React, { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("http://localhost:5001/analytics");
        if (!response.ok) throw new Error("Failed to fetch analytics data");
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <p>Loading analytics...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ marginBottom: "20px" }}>Analytics Dashboard</h1>

      {/* --- Summary Cards --- */}
      <div style={gridContainer}>
        <Card title="Total Submissions" value={data.totalSubmissions} />
        <Card title="Total Errors" value={data.totalErrors} />
        <Card title="Total Warnings" value={data.totalWarnings} />
        <Card title="Avg Errors/Sub" value={data.averageErrorsPerSubmission} />
        <Card title="Avg Warnings/Sub" value={data.averageWarningsPerSubmission} />
      </div>

      {/* --- Keyword Errors Bar Chart --- */}
      <section style={sectionStyle}>
        <h2>Keyword Errors</h2>
        <Bar
          data={{
            labels: Object.keys(data.keywordErrors),
            datasets: [
              {
                label: "Keyword Errors",
                data: Object.values(data.keywordErrors),
                backgroundColor: "rgba(54, 162, 235, 0.6)",
              },
            ],
          }}
          options={{ responsive: true }}
        />
      </section>

      {/* --- Syntax & Semantic Errors Tables --- */}
      <section style={sectionStyle}>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <ErrorTable title="Syntax Errors" errors={data.syntaxErrors} />
          <ErrorTable title="Semantic Errors" errors={data.semanticErrors} />
        </div>
      </section>

      {/* --- Errors & Warnings Over Time --- */}
      <section style={sectionStyle}>
        <h2>Errors Over Time</h2>
        <Line
          data={{
            labels: data.errorsOverTime.map((d) => d.date),
            datasets: [
              {
                label: "Errors",
                data: data.errorsOverTime.map((d) => d.count),
                borderColor: "red",
                backgroundColor: "rgba(255,0,0,0.2)",
                tension: 0.3,
              },
            ],
          }}
        />
      </section>

      <section style={sectionStyle}>
        <h2>Warnings Over Time</h2>
        <Line
          data={{
            labels: data.warningsOverTime.map((d) => d.date),
            datasets: [
              {
                label: "Warnings",
                data: data.warningsOverTime.map((d) => d.count),
                borderColor: "orange",
                backgroundColor: "rgba(255,165,0,0.2)",
                tension: 0.3,
              },
            ],
          }}
        />
      </section>
    </div>
  );
};

// --- Card Component ---
const Card = ({ title, value }) => (
  <div style={cardStyle}>
    <h3 style={{ marginBottom: "10px", fontSize: "16px" }}>{title}</h3>
    <p style={{ fontSize: "20px", fontWeight: "bold" }}>{value}</p>
  </div>
);

// --- Error Table Component ---
const ErrorTable = ({ title, errors }) => (
  <div style={{ flex: 1, minWidth: "250px" }}>
    <h3>{title}</h3>
    <table style={tableStyle}>
      <thead>
        <tr>
          <th>Error Message</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(errors).map(([msg, count]) => (
          <tr key={msg}>
            <td>{msg}</td>
            <td>{count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- Styles ---
const gridContainer = {
  display: "flex",
  gap: "20px",
  flexWrap: "wrap",
  marginBottom: "30px",
};

const cardStyle = {
  padding: "15px",
  background: "#f0f0f0",
  borderRadius: "8px",
  minWidth: "150px",
  textAlign: "center",
  fontWeight: "bold",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
};

const sectionStyle = {
  marginBottom: "40px",
};

const tableStyle = {
  borderCollapse: "collapse",
  width: "100%",
  background: "#fff",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  overflow: "hidden",
};

export default Analytics;
