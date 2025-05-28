import React, { useState, useRef } from "react";
import html2pdf from "html2pdf.js";

function WeighInList({
  athletes,
  competitions,
  selectedCompetitionId,
  setSelectedCompetitionId,
}) {
  const selectedCompetition =
    competitions.find((comp) => comp.id === selectedCompetitionId) ||
    competitions[0] ||
    {};

  const allGenders = ["Male", "Female"];
  const allCategories = [
    ...new Set(
      athletes
        .filter((a) =>
          selectedCompetition
            ? a.competitionName === selectedCompetition.name
            : true
        )
        .map((a) => a.category)
    ),
  ].filter(Boolean);

  const [gender, setGender] = useState("All");
  const [category, setCategory] = useState("All");

  const filteredAthletes = athletes.filter((athlete) => {
    const matchCompetition =
      athlete.competitionName === selectedCompetition.name ||
      !athlete.competitionName;
    const matchGender = gender === "All" ? true : athlete.gender === gender;
    const matchCategory = category === "All" ? true : athlete.category === category;
    return matchCompetition && matchGender && matchCategory;
  });

  let categoryLabel = "All";
  if (gender !== "All" && category === "All") {
    categoryLabel = `All ${gender}`;
  } else if (gender === "All" && category !== "All") {
    categoryLabel = `All (${category})`;
  } else if (gender !== "All" && category !== "All") {
    categoryLabel = `${gender} ${category}`;
  } else {
    categoryLabel = "All Athletes";
  }

  // PDF Export logic
  const tableRef = useRef();

  const handleExportPDF = () => {
    const element = tableRef.current;
    html2pdf()
      .set({
        margin: 0.5,
        filename: `Weigh-in_List_${selectedCompetition.name || "Competition"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
      })
      .from(element)
      .save();
  };

  return (
    <div>
      <h2>Weigh-in List</h2>
      {/* Controls */}
      <label>
        Competition:&nbsp;
        <select
          value={selectedCompetitionId || ""}
          onChange={(e) => setSelectedCompetitionId(Number(e.target.value))}
        >
          {competitions.map((comp) => (
            <option key={comp.id} value={comp.id}>
              {comp.name}
            </option>
          ))}
        </select>
      </label>
      <label style={{ marginLeft: 16 }}>
        Gender:&nbsp;
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="All">All</option>
          {allGenders.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>
      <label style={{ marginLeft: 16 }}>
        Category:&nbsp;
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="All">All</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </label>

      {/* Weigh-in List Table Model */}
      <div style={{ marginTop: 24 }} ref={tableRef}>
        <table className="weighin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th colSpan={8} style={{ textAlign: "center", fontSize: "20px" }}>
                Weigh-in List
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Competition</b></td>
              <td colSpan={7}>{selectedCompetition.name || ""}</td>
            </tr>
            <tr>
              <td><b>Date</b></td>
              <td colSpan={7}>{selectedCompetition.date || ""}</td>
            </tr>
            <tr>
              <td><b>Bodyweight Category(ies)</b></td>
              <td colSpan={7}>{categoryLabel}</td>
            </tr>
          </tbody>
        </table>
        <table className="weighin-table" style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
          <thead>
            <tr>
              <th>Lot No</th>
              <th>Name</th>
              <th>SDMS ID</th>
              <th>Team/Club</th>
              <th>DoB</th>
              <th>Body Weight</th>
              <th>Attempt 1</th>
              <th>Rack Height</th>
            </tr>
          </thead>
          <tbody>
            {filteredAthletes.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center" }}>
                  No athletes to display for this selection.
                </td>
              </tr>
            ) : (
              filteredAthletes.map((athlete, idx) => (
                <tr key={athlete.id || idx}>
                  <td>{athlete.lotn}</td>
                  <td>{athlete.name}</td>
                  <td>{athlete.sdmsId || ""}</td>
                  <td>{athlete.team}</td>
                  <td>{athlete.dob}</td>
                  <td>{athlete.bodyWeight}</td>
                  <td>{athlete.attempt1 || ""}</td>
                  <td>{athlete.rack || ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Chief Weigh-in Official signature section */}
        <table
          style={{
            width: "50%",
            marginTop: "32px",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <tr>
              <td>
                <b>Chief Weigh-in Official:                           </b>
              </td>
              <td>
                Signature: 
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PDF Export Button */}
      <div style={{ marginTop: 16 }}>
        <button onClick={handleExportPDF}><b>Export as PDF</b></button>
      </div>
    </div>
  );
}

export default WeighInList;