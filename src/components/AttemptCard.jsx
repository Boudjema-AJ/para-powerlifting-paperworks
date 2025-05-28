import React from "react";
import DownloadAttemptCardPDF from "./DownloadAttemptCardPDF";

function AttemptCard({ athlete }) {
  return (
    <div className="attempt-card" style={{
      border: "1px solid #888", margin: "24px auto", width: 700, padding: 0, background: "#fff"
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th colSpan={8} style={{ textAlign: "center", fontSize: 20, border: "1px solid #888", background: "#eee" }}>
              Attempt Card
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #888" }}>Lot No.</td>
            <td style={{ border: "1px solid #888" }}>{athlete.lotn || ""}</td>
            <td style={{ border: "1px solid #888" }}>Name</td>
            <td style={{ border: "1px solid #888" }}>{athlete.name || ""}</td>
            <td style={{ border: "1px solid #888" }}>Team/Club</td>
            <td style={{ border: "1px solid #888" }}>{athlete.team || ""}</td>
            <td style={{ border: "1px solid #888" }}>Date of Birth</td>
            <td style={{ border: "1px solid #888" }}>{athlete.dob || ""}</td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #888" }}>Cat  Grp</td>
            <td style={{ border: "1px solid #888" }}>{athlete.category || ""}</td>
            <td style={{ border: "1px solid #888" }}>Body Weight</td>
            <td style={{ border: "1px solid #888" }}>{athlete.bodyWeight || ""}</td>
            <td style={{ border: "1px solid #888" }}>Rack Height</td>
            <td style={{ border: "1px solid #888" }}>{athlete.rack || ""}</td>
            <td style={{ border: "1px solid #888" }}>Age Group</td>
            <td style={{ border: "1px solid #888" }}>{athlete.ageGroup || ""}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ margin: "20px 0", textAlign: "center" }}>
        <DownloadAttemptCardPDF athlete={athlete} />
      </div>
    </div>
  );
}

export default AttemptCard;