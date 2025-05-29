import React, { useState } from "react";
import ListPdfFields from "./ListPdfFields";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import Modal from "react-modal";

Modal.setAppElement('#root');

function AttemptCards({ athletes }) {
  const sessions = Array.from(
    new Set(athletes.map((a) => a.session).filter(Boolean))
  );
  const [selectedSession, setSelectedSession] = useState(null);

  const athletesInSession = selectedSession
    ? athletes.filter((a) => a.session === selectedSession)
    : [];

  // Fill data into a worksheet
  const fillCardData = (ws, athlete) => {
    ws.getCell("B4").value = athlete.lotn || "";
    ws.getCell("D4").value = athlete.name || "";
    ws.getCell("F4").value = athlete.team || "";
    ws.getCell("H4").value = athlete.dob || "";
    ws.getCell("B5").value = athlete.category || "";
    ws.getCell("D5").value = athlete.bodyWeight || "";
    ws.getCell("F5").value = athlete.rack || "";
    ws.getCell("H5").value = athlete.ageGroup || "";
  };

  // Download ZIP of single card Excels
  const downloadAllCardsAsZip = async () => {
    if (!athletesInSession.length) return;
    try {
      const response = await fetch('/template/attempt_card_template.xlsx');
      if (!response.ok) throw new Error("Template not found");
      const arrayBuffer = await response.arrayBuffer();

      const zip = new JSZip();

      // Sequentially generate each file
      for (let i = 0; i < athletesInSession.length; ++i) {
        const athlete = athletesInSession[i];
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        const ws = workbook.worksheets[0];
        fillCardData(ws, athlete);

        let athleteName = (athlete.name || `athlete_${i+1}`).toLowerCase().replace(/[^a-z0-9]/g, "_");
        let fileName = `attempt_card_${athleteName || (i+1)}.xlsx`;
        const buf = await workbook.xlsx.writeBuffer();
        zip.file(fileName, buf);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = `attempt_cards_session_${selectedSession}.zip`;
      link.click();
    } catch (err) {
      alert("Error generating ZIP: " + err.message);
      console.error(err);
    }
  };

  return (
    <div>
      <div className="controls-bar">
        <ListPdfFields />
        <span style={{ marginLeft: 12 }}>Select Session:</span>
        {sessions.map(session => (
          <button
            key={session}
            className={selectedSession === session ? "active" : ""}
            onClick={() => setSelectedSession(session)}
            style={{
              marginLeft: 8,
              background: selectedSession === session ? "#1976d2" : "#eee",
              color: selectedSession === session ? "#fff" : "#222",
              border: "none",
              borderRadius: 4,
              padding: "6px 16px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Session {session}
          </button>
        ))}
        {selectedSession && (
          <button
            style={{
              marginLeft: 16,
              background: "#43a047",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "6px 16px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
            onClick={downloadAllCardsAsZip}
          >
            Download All Attempt Cards (ZIP)
          </button>
        )}
      </div>
      {selectedSession && (
        <h2 style={{ marginTop: 24 }}>
          Attempt Cards for Session {selectedSession} ({athletesInSession.length} athletes)
        </h2>
      )}
    </div>
  );
}

export default AttemptCards;