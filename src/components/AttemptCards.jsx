import React, { useState } from "react";
import AttemptCard from "./AttemptCard";
import ListPdfFields from "./ListPdfFields";
import DownloadAttemptCardPDF from "./DownloadAttemptCardPDF";

function AttemptCards({ athletes }) {
  const sessions = Array.from(
    new Set(athletes.map((a) => a.session).filter(Boolean))
  );
  const [selectedSession, setSelectedSession] = useState(null);

  const athletesInSession = selectedSession
    ? athletes.filter((a) => a.session === selectedSession)
    : [];

  return (
    <div>
      <h2>Attempt Cards</h2>
      <ListPdfFields />
      <div style={{ marginBottom: 20 }}>
        <b>Select Session:</b>
        {sessions.map((session) => (
          <button
            key={session}
            onClick={() => setSelectedSession(session)}
            style={{
              marginLeft: 10,
              background: selectedSession === session ? "#1976d2" : "#eee",
              color: selectedSession === session ? "#fff" : "#222",
              border: "none",
              borderRadius: 4,
              padding: "6px 16px",
              cursor: "pointer",
            }}
          >
            Session {session}
          </button>
        ))}
        {selectedSession && <DownloadAttemptCardPDF athletes={athletesInSession} />}
      </div>
      {selectedSession && (
        <div>
          <h3>
            Attempt Cards for Session {selectedSession} (
            {athletesInSession.length} athletes)
          </h3>
          {athletesInSession.map((athlete) => (
            <AttemptCard athlete={athlete} key={athlete.id} />
          ))}
        </div>
      )}
      {!selectedSession && (
        <div style={{ marginTop: 32, color: "#444" }}>
          Please select a session to view attempt cards.
        </div>
      )}
    </div>
  );
}

export default AttemptCards;