import React from "react";
import DownloadAttemptCardExcel from "./DownloadAttemptCardExcel";

function AttemptCard({ athlete, hideExcelDownload }) {
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
            <td style={{ border: "1px solid #888" }}>LoNo.</td>
            <td style={{ border: "1px solid #888" }}>{athlete.lotn || ""}</td>
            <td style={{ border: "1px solid #888" }}>Name</td>
            <td style={{ border: "1px solid #888" }}>{athlete.name || ""}</td>
            <td style={{ border: "1px solid #888" }}>TeamClub</td>
            <td style={{ border: "1px solid #888" }}>{athlete.team || ""}</td>
            <td style={{ border: "1px solid #888" }}>DateofBirth</td>
            <td style={{ border: "1px solid #888" }}>{athlete.dob || ""}</td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #888" }}>CatGrp</td>
            <td style={{ border: "1px solid #888" }}>{athlete.category || ""}</td>
            <td style={{ border: "1px solid #888" }}>BodyWeight</td>
            <td style={{ border: "1px solid #888" }}>{athlete.bodyWeight || ""}</td>
            <td style={{ border: "1px solid #888" }}>RackHeight</td>
            <td style={{ border: "1px solid #888" }}>{athlete.rack || ""}</td>
            <td style={{ border: "1px solid #888" }}>AgeGroup</td>
            <td style={{ border: "1px solid #888" }}>{athlete.ageGroup || ""}</td>
          </tr>
        </tbody>
      </table>
      {!hideExcelDownload && (
        <div style={{ margin: "12px 0", textAlign: "right" }}>
          <DownloadAttemptCardExcel athlete={athlete} />
        </div>
      )}
    </div>
  );
}

export default AttemptCard;