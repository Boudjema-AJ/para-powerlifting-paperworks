import React, { useState, useEffect } from "react";
import AttemptCard from "./AttemptCard";
import ListPdfFields from "./ListPdfFields";
import Modal from "react-modal";
// No external imports needed - using only native browser APIs

Modal.setAppElement('#root');

function AttemptCards({ athletes }) {
  // Debug: Log the athletes data
  console.log("Athletes data:", athletes);
  
  // Extract unique sessions from athletes data
  const sessions = Array.from(
    new Set(
      (athletes || [])
        .map((a) => a.session)
        .filter(Boolean)
        .filter(session => session !== null && session !== undefined)
    )
  ).sort(); // Sort sessions for better UX
  
  console.log("Available sessions:", sessions);
  
  // Initialize with first session if available
  const [selectedSession, setSelectedSession] = useState(null);
  
  // Auto-select first session when sessions are available
  useEffect(() => {
    if (sessions.length > 0 && !selectedSession) {
      setSelectedSession(sessions[0]);
    }
  }, [sessions, selectedSession]);
  
  // Filter athletes for selected session
  const athletesInSession = selectedSession
    ? (athletes || []).filter((a) => a.session === selectedSession)
    : [];
  
  console.log("Athletes in selected session:", athletesInSession);
  
  // Function to download all attempt cards as CSV (no external libraries needed)
  const handleDownloadAllCards = () => {
    if (!selectedSession || athletesInSession.length === 0) {
      alert("No athletes available for download");
      return;
    }
    
    try {
      generateCSVFile(athletesInSession, selectedSession);
    } catch (error) {
      console.error("Error generating CSV file:", error);
      alert("Error generating file. Please try again.");
    }
  };

  // Generate CSV file using only native browser APIs
  const generateCSVFile = (athletes, session) => {
    console.log("Generating CSV for session:", session);
    
    try {
      // CSV Headers
      const headers = [
        'Lot No.',
        'Name', 
        'Team/Club',
        'Date of Birth',
        'Category/Group',
        'Body Weight',
        'Rack Height',
        'Age Group',
        'Session'
      ];
      
      // Convert athletes data to CSV rows
      const csvRows = athletes.map(athlete => [
        athlete.lotn || '',
        athlete.name || '',
        athlete.team || '',
        athlete.dob || '',
        athlete.category || '',
        athlete.bodyWeight || '',
        athlete.rack || '',
        athlete.ageGroup || '',
        athlete.session || ''
      ]);
      
      // Combine headers and data
      const allRows = [headers, ...csvRows];
      
      // Convert to CSV string
      const csvContent = allRows
        .map(row => row.map(field => {
          // Escape fields that contain commas, quotes, or newlines
          const stringField = String(field);
          if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
          }
          return stringField;
        }).join(','))
        .join('\n');
      
      // Add BOM for proper Excel opening
      const csvWithBOM = '\uFEFF' + csvContent;
      
      // Create blob and download
      const blob = new Blob([csvWithBOM], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      // Create download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Generate filename with timestamp
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
      const filename = `Session_${session}_AttemptCards_${timestamp}.csv`;
      
      // Set download attributes
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log("CSV file generated successfully:", filename);
      alert(`✅ File downloaded successfully: ${filename}\n\nThis CSV file can be opened in Excel or any spreadsheet application.`);
      
    } catch (error) {
      console.error("Error in CSV generation:", error);
      throw error;
    }
  };

  // If no athletes data at all
  if (!athletes || athletes.length === 0) {
    return (
      <div className="attempt-cards-page" style={{ padding: 20 }}>
        <div style={{ textAlign: "center", marginTop: 48, fontSize: 18, color: "#f44336" }}>
          <h2>No Athletes Data</h2>
          <p>Please upload or provide athletes data to generate attempt cards.</p>
          <div style={{ marginTop: 20, fontSize: 14, color: "#666" }}>
            <p>Expected data format:</p>
            <pre style={{ textAlign: "left", background: "#f5f5f5", padding: 10, borderRadius: 4 }}>
{`[
  {
    id: 1,
    lotn: "001",
    name: "John Doe",
    team: "Team A",
    dob: "1990-01-01",
    category: "Men",
    bodyWeight: "80kg",
    rack: "5",
    ageGroup: "Senior",
    session: 1
  }
]`}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="attempt-cards-page" style={{ padding: 20 }}>
      {/* Debug Information (remove in production) */}
      <div style={{ background: "#f0f0f0", padding: 10, marginBottom: 20, fontSize: 12, borderRadius: 4 }}>
        <strong>Debug Info:</strong> {athletes.length} athletes loaded, {sessions.length} sessions found
        {sessions.length > 0 && ` (${sessions.join(', ')})`}
      </div>
      
      {/* Controls Bar */}
      <div className="controls-bar" style={{ 
        display: "flex", 
        alignItems: "center", 
        marginBottom: 20, 
        padding: 16, 
        background: "#f9f9f9", 
        borderRadius: 8,
        flexWrap: "wrap",
        gap: 12
      }}>
        <ListPdfFields />
        
        {sessions.length > 0 && (
          <>
            <span style={{ fontWeight: "bold" }}>Select Session:</span>
            {sessions.map((session) => (
              <button
                key={session}
                className={selectedSession === session ? "active" : ""}
                onClick={() => setSelectedSession(session)}
                style={{
                  background: selectedSession === session ? "#1976d2" : "#eee",
                  color: selectedSession === session ? "#fff" : "#222",
                  border: "none",
                  borderRadius: 4,
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  transition: "all 0.2s"
                }}
              >
                Session {session}
              </button>
            ))}
            
            {/* Download All Button */}
            {selectedSession && athletesInSession.length > 0 && (
              <button
                onClick={handleDownloadAllCards}
                style={{
                  background: "#4caf50",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "10px 20px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  marginLeft: "auto"
                }}
              >
                📥 Download All Cards (CSV)
              </button>
            )}
          </>
        )}
      </div>

      {/* Content Area */}
      {sessions.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: 48, fontSize: 18, color: "#ff9800" }}>
          <h3>No Sessions Found</h3>
          <p>Athletes data exists but no sessions were found.</p>
          <p style={{ fontSize: 14, color: "#666" }}>
            Make sure your athletes have a 'session' property with valid values.
          </p>
        </div>
      ) : !selectedSession ? (
        <div style={{ textAlign: "center", marginTop: 48, fontSize: 18, color: "#666" }}>
          <h3>Select a Session</h3>
          <p>Please select a session above to view attempt cards.</p>
        </div>
      ) : (
        <>
          <h2 style={{ marginTop: 0, marginBottom: 24, color: "#333" }}>
            Attempt Cards for Session {selectedSession} 
            <span style={{ color: "#666", fontSize: 16, fontWeight: "normal" }}>
              ({athletesInSession.length} athletes)
            </span>
          </h2>
          
          {athletesInSession.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {athletesInSession.map((athlete) => (
                <div key={athlete.id || athlete.lotn || Math.random()}>
                  <AttemptCard athlete={athlete} hideExcelDownload={true} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", marginTop: 24, fontSize: 16, color: "#666" }}>
              <h3>No Athletes in This Session</h3>
              <p>Session {selectedSession} exists but contains no athletes.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AttemptCards;