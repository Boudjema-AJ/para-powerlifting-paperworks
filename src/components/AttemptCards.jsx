import React, { useState, useRef } from "react";
import AttemptCard from "./AttemptCard";
import ListPdfFields from "./ListPdfFields";
import Modal from "react-modal";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

Modal.setAppElement('#root');

function AttemptCards({ athletes }) {
  const sessions = Array.from(
    new Set(athletes.map((a) => a.session).filter(Boolean))
  );
  const [selectedSession, setSelectedSession] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const cardRefs = useRef([]);

  const athletesInSession = selectedSession
    ? athletes.filter((a) => a.session === selectedSession)
    : [];

  const openSessionModal = (session) => {
    setSelectedSession(session);
    setModalOpen(true);
    // Reset refs for the new session
    cardRefs.current = [];
  };

  // PDF download handler for all cards in the modal
  const downloadCardsAsPDF = async () => {
    if (!athletesInSession.length) return;
    const pdf = new jsPDF("p", "mm", "a4");
    for (let i = 0; i < athletesInSession.length; i++) {
      const cardDiv = cardRefs.current[i];
      if (!cardDiv) continue;
      const canvas = await html2canvas(cardDiv, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    }
    pdf.save(`attempt_cards_session_${selectedSession}.pdf`);
  };

  return (
    <div className="attempt-cards-page">
      {/* Controls Bar */}
      <div className="controls-bar">
        <ListPdfFields />
        <span style={{ marginLeft: 12 }}>Select Session:</span>
        {sessions.map((session) => (
          <button
            key={session}
            className={selectedSession === session ? "active" : ""}
            onClick={() => openSessionModal(session)}
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
      </div>

      {/* Section Title */}
      {selectedSession && (
        <h2 style={{ marginTop: 24 }}>
          Attempt Cards for Session {selectedSession} ({athletesInSession.length} athletes)
        </h2>
      )}

      {/* Attempt Cards List */}
      {selectedSession && athletesInSession.length > 0 && athletesInSession.map((athlete) => (
        <div className="attempt-card" key={athlete.id}>
          <AttemptCard athlete={athlete} />
        </div>
      ))}

      {/* Modal for all cards in session */}
      <Modal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        contentLabel="Session Attempt Cards"
        style={{ content: { width: '90%', maxWidth: '1100px', margin: 'auto', height: '90%', overflow: 'auto' } }}
      >
        <div>
          <h2>
            Attempt Cards for Session {selectedSession} ({athletesInSession.length} athletes)
          </h2>
          <div id="session-cards-modal-content" style={{ background: "#fff", padding: 20 }}>
            {athletesInSession.map((athlete, idx) => (
              <div
                className="attempt-card"
                key={athlete.id}
                style={{ margin: "20px auto", breakAfter: "page" }}
                ref={el => cardRefs.current[idx] = el}
              >
                <AttemptCard athlete={athlete} hideExcelDownload />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 30, display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button onClick={downloadCardsAsPDF}>Download All as PDF</button>
            <button onClick={() => window.print()}>Print</button>
            <button onClick={() => setModalOpen(false)}>Close</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AttemptCards;