import React, { useState } from "react";

export default function SessionDropdown({ sessions, value, onChange, onAddNew }) {
  const [adding, setAdding] = useState(false);
  const [newSession, setNewSession] = useState("");

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <select
        value={adding ? "__add__" : value || ""}
        onChange={e => {
          if (e.target.value === "__add__") {
            setAdding(true);
            setNewSession("");
          } else {
            onChange(e.target.value);
          }
        }}
        style={{ flex: 1 }}
      >
        <option value="">-- Select a session --</option>
        {sessions.map(s => <option key={s} value={s}>{s}</option>)}
        <option value="__add__">+ Add session</option>
      </select>
      {adding && (
        <div style={{ display: "flex", alignItems: "center", marginLeft: 4 }}>
          <input
            type="text"
            value={newSession}
            onChange={e => setNewSession(e.target.value)}
            placeholder="New session name"
            style={{ width: 80 }}
          />
          <button
            type="button"
            style={{ marginLeft: 2 }}
            onClick={() => {
              if (newSession.trim()) {
                onAddNew(newSession.trim());
                onChange(newSession.trim());
                setAdding(false);
              }
            }}
          >Add</button>
          <button
            type="button"
            style={{ marginLeft: 2 }}
            onClick={() => setAdding(false)}
          >Cancel</button>
        </div>
      )}
    </div>
  );
}