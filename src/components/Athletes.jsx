import React, { useState } from "react";
import * as XLSX from "xlsx";
import AthleteModal from './AthleteModal';
import SessionDropdown from "./SessionDropdown";

// Categories for filtering/sorting
const maleCategories = [
  "49kg", "54kg", "59kg", "65kg", "72kg", "80kg", "88kg", "97kg", "107kg", "+107kg",
];
const femaleCategories = [
  "41kg", "45kg", "50kg", "55kg", "61kg", "67kg", "73kg", "79kg", "86kg", "+86kg",
];


const weightCategories = { Male: maleCategories, Female: femaleCategories };

function calculateAgeGroups(dob) {
  if (!dob) return [];
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return [];
  const referenceDate = new Date("2025-12-31");
  const age = referenceDate.getFullYear() - birthDate.getFullYear() -
    (referenceDate.getMonth() < birthDate.getMonth() ||
      (referenceDate.getMonth() === birthDate.getMonth() && referenceDate.getDate() < birthDate.getDate()) ? 1 : 0);
  const ageGroups = [];
  if (age >= 14 && age <= 17) ageGroups.push("Rookie");
  if (age >= 18 && age <= 20) ageGroups.push("Next Gen");
  if (age >= 15) ageGroups.push("Elite");
  if (age >= 45) ageGroups.push("Legend");
  return ageGroups;
}

function ageGroupInitials(groups) {
  const map = {
    "Rookie": "R",
    "Next Gen": "NG",
    "Elite": "E",
    "Legend": "L"
  };
  return groups.map(g => map[g] || g).join(' ');
}

const getWeightCategory = (bodyWeight, gender) => {
  if (!bodyWeight || !gender) return "";
  const weight = parseFloat(bodyWeight);
  if (isNaN(weight)) return "";
  const categories = weightCategories[gender] || [];
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const catWeight = parseFloat(cat.replace("+", ""));
    if (cat.includes("+")) {
      if (weight > parseFloat(categories[i - 1])) return cat;
    } else if (weight <= catWeight) {
      return cat;
    }
  }
  return "";
};

const excelSerialToDate = (serial) => {
  if (!serial || isNaN(serial)) return null;
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};



function sortAthletes(athletes) {
  const categoryValue = (cat) => {
    if (!cat) return 1e6;
    if (cat.includes('+')) return parseInt(cat) + 1e3;
    return parseInt(cat);
  };
  return [...athletes].sort((a, b) => {
    if (a.gender !== b.gender) return a.gender === "Female" ? -1 : 1;
    const valA = categoryValue(a.category);
    const valB = categoryValue(b.category);
    if (valA !== valB) return valA - valB;
    const a1 = a.attempt1 ? parseFloat(a.attempt1) : -Infinity;
    const b1 = b.attempt1 ? parseFloat(b.attempt1) : -Infinity;
    return a1 - b1;
  });
}

function Athletes({ competitions, athletes: globalAthletes, setAthletesGlobally }) {
	
	
  const [athletes, setAthletes] = useState(globalAthletes || []);
  
  
  const [filters, setFilters] = useState({
    team: "",
    category: "",
    ageGroup: "",
    name: "",
    gender: "",
    session: "",
  });
  
  
  // Assign Lot# by attempt, per session, highest attempt gets 1 etc.
  const assignLotNumbersBySession = () => {
    // Group by session
    const sessionGroups = {};
    athletes.forEach(a => {
      const session = a.session || 'No Session';
      if (!sessionGroups[session]) sessionGroups[session] = [];
      sessionGroups[session].push(a);
    });

    // Assign lot# for each session group
    const updatedAthletes = [];
    for (const session in sessionGroups) {
      // Sort descending by attempt1 (use 0 for blank)
      const sorted = [...sessionGroups[session]].sort((a, b) => {
        const a1 = parseFloat(a.attempt1) || 0;
        const b1 = parseFloat(b.attempt1) || 0;
        return b1 - a1; // high to low
      });
      sorted.forEach((athlete, idx) => {
        updatedAthletes.push({
          ...athlete,
          lotn: (idx + 1).toString()
        });
      });
    }

    setAthletes(updatedAthletes);
    setAthletesGlobally(updatedAthletes);
  };
  
  
  
  
  
  
  
  
  const [competition, setCompetition] = useState({
    name: "",
    location: "",
    date: "",
    type: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentAthlete, setCurrentAthlete] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const teams = [...new Set(athletes.map(a => a.team).filter(Boolean))];
  const ageGroups = ["Rookie", "Next Gen", "Elite", "Legend"];
  const sessions = [...new Set(athletes.map(a => a.session).filter(Boolean))];

  const allDisplayedIds = sortAthletes(athletes)
    .filter(a =>
      (!filters.team || a.team === filters.team) &&
      (!filters.category || a.category === filters.category) &&
      (!filters.ageGroup || a.ageGroup === filters.ageGroup) &&
      (!filters.name || a.name.toLowerCase().includes(filters.name.toLowerCase())) &&
      (!filters.gender || a.gender === filters.gender) &&
      (!filters.session || a.session === filters.session)
    ).map(a => a.id);

  const isAllChecked = allDisplayedIds.length && allDisplayedIds.every(id => selectedRows.includes(id));
  const handleCheckAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(prev => Array.from(new Set([...prev, ...allDisplayedIds])));
    } else {
      setSelectedRows(prev => prev.filter(id => !allDisplayedIds.includes(id)));
    }
  };
  const handleRowCheck = (id) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) return;
    if (window.confirm("Delete selected athletes?")) {
      const remaining = athletes.filter(a => !selectedRows.includes(a.id));
      setAthletes(remaining);
      setAthletesGlobally(remaining);
      setSelectedRows([]);
      setSuccess("Selected athletes deleted.");
    }
  };



  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () =>
    setFilters({ team: "", category: "", ageGroup: "", name: "", gender: "", session: "" });

  const filteredSortedAthletes = sortAthletes(athletes).filter(
    a =>
      (!filters.team || a.team === filters.team) &&
      (!filters.category || a.category === filters.category) &&
      (!filters.ageGroup || a.ageGroup === filters.ageGroup) &&
      (!filters.name || a.name.toLowerCase().includes(filters.name.toLowerCase())) &&
      (!filters.gender || a.gender === filters.gender) &&
      (!filters.session || a.session === filters.session)
  );

  // Inline edit
  const handleInlineEdit = (id, field, value) => {
    const athlete = athletes.find(a => a.id === id);
    const updatedAthlete = { ...athlete, [field]: value };
    if (field === "bodyWeight") {
      updatedAthlete.category = getWeightCategory(value, athlete.gender);
    }
    if (field === "dob") {
      updatedAthlete.ageGroup = ageGroupInitials(calculateAgeGroups(value));
    }
    const updatedAthletes = athletes.map(a => a.id === id ? updatedAthlete : a);
    setAthletes(updatedAthletes);
    setAthletesGlobally(updatedAthletes);
    setError(null);
  };

  const openEditModal = (athlete) => {
    setCurrentAthlete(athlete);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (formData) => {
    const ageGroups = calculateAgeGroups(formData.dob);
    if (ageGroups.length === 0) {
      setError("Invalid date of birth for age group assignment.");
      return;
    }
    const updatedAthlete = {
      ...currentAthlete,
      ...formData,
      category: getWeightCategory(formData.bodyWeight, formData.gender),
      ageGroup: ageGroupInitials(ageGroups),
    };
    const otherAthletes = athletes.filter(a => a.id !== currentAthlete.id);
    const updatedAthletes = [...otherAthletes, updatedAthlete];
    setAthletes(updatedAthletes);
    setAthletesGlobally(updatedAthletes);
    setSuccess("Athlete updated successfully.");
    setError(null);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this athlete?")) {
      const updatedAthletes = athletes.filter(a => a.id !== id);
      setAthletes(updatedAthletes);
      setAthletesGlobally(updatedAthletes);
      setSuccess("Athlete deleted successfully.");
      setError(null);
    }
  };

  const handleAddSubmit = (formData) => {
    const ageGroups = calculateAgeGroups(formData.dob);
    if (ageGroups.length === 0) {
      setError("Invalid date of birth for age group assignment.");
      return;
    }
    const baseId = athletes.length + 1;
    const newAthlete = {
      id: baseId,
      ...formData,
      category: getWeightCategory(formData.bodyWeight, formData.gender),
      ageGroup: ageGroupInitials(ageGroups),
      competitionName: competition.name || null,
      competitionDate: competition.date || null,
      competitionLocation: competition.location || null,
      competitionType: competition.type || null,
    };
    const updatedAthletes = [...athletes, newAthlete];
    setAthletes(updatedAthletes);
    setAthletesGlobally(updatedAthletes);
    setSuccess("Athlete added successfully.");
    setError(null);
  };

  // File import (Excel)
  const importAthleteData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError("Please upload an Excel file (.xlsx or .xls).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const headers = json[0];
        const newAthletes = [];
        json.slice(1).forEach((row, index) => {
          let dob = row[headers.indexOf("Date of Birth")];
          if (typeof dob === 'number') dob = excelSerialToDate(dob);
          else {
            const parsedDate = new Date(dob);
            dob = !isNaN(parsedDate.getTime()) ? `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}` : null;
          }
          const ageGroups = dob ? calculateAgeGroups(dob) : [];
          if (ageGroups.length === 0) return;
          const baseId = athletes.length + newAthletes.length + index + 1;
          const bodyWeight = row[headers.indexOf("Body Weight")]?.toString();
          const gender = row[headers.indexOf("Gender")]?.toString();
          newAthletes.push({
            id: baseId,
            lotn: row[headers.indexOf("Lotn")]?.toString() || (baseId).toString(),
            name: row[headers.indexOf("Name")]?.toString() || "",
            gender: gender || "",
            category: getWeightCategory(bodyWeight, gender),
            ageGroup: ageGroupInitials(ageGroups),
            dob: dob || "",
            team: row[headers.indexOf("Team/Club")]?.toString() || "",
            bodyWeight: bodyWeight || null,
            session: row[headers.indexOf("Session")]?.toString() || "",
            attempt1: row[headers.indexOf("1 Attempt")]?.toString() || null,
            rack: row[headers.indexOf("Rack")]?.toString() || null,
            competitionName: competition.name || row[headers.indexOf("Competition name")]?.toString() || null,
            competitionDate: competition.date || row[headers.indexOf("Date")]?.toString() || null,
            competitionLocation: competition.location || row[headers.indexOf("Location")]?.toString() || null,
            competitionType: competition.type || row[headers.indexOf("Competition Type")]?.toString() || null,
          });
        });
        const validAthletes = newAthletes.filter(a => a.name && a.team && a.dob);
        if (validAthletes.length === 0) {
          setError("No valid athletes found in the Excel file. Ensure Name, Team/Club, and Date of Birth are provided and correctly formatted.");
          return;
        }
        const updatedAthletes = [...athletes, ...validAthletes];
        setAthletes(updatedAthletes);
        setAthletesGlobally(updatedAthletes);
        setSuccess("Athlete data imported successfully.");
        setError(null);
        e.target.value = "";
      } catch {
        setError("Failed to parse Excel file. Ensure it follows the correct format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };


  const clearAllData = () => {
    if (window.confirm("Are you sure you want to clear all athlete data?")) {
      setAthletes([]);
      setAthletesGlobally([]);
      setError(null);
      setSuccess(null);
    }
  };

  // Competition Setup Handlers
  const handleCompetitionChange = (e) => {
    const { name, value } = e.target;
    setCompetition(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const applyCompetitionDetails = () => {
    if (!competition.name || !competition.location || !competition.date || !competition.type) {
      setError("Please fill in all competition details before applying.");
      return;
    }
    const updatedAthletes = athletes.map(a => ({
      ...a,
      competitionName: competition.name,
      competitionDate: competition.date,
      competitionLocation: competition.location,
      competitionType: competition.type,
    }));
    setAthletes(updatedAthletes);
    setAthletesGlobally(updatedAthletes);
    setSuccess("Competition details applied to all athletes.");
    setError(null);
  };

  const applyCompetitionFromList = (comp) => {
    const updatedAthletes = athletes.map(a => ({
      ...a,
      competitionName: comp.name,
      competitionDate: comp.date,
      competitionLocation: comp.location,
      competitionType: comp.type,
    }));
    setAthletes(updatedAthletes);
    setAthletesGlobally(updatedAthletes);
    setSuccess(`Applied competition: ${comp.name} to all athletes.`);
    setError(null);
  };
  
  // Per-competition session mapping
const [competitionSessions, setCompetitionSessions] = useState({});
const selectedCompName = competition.name || ""; // or use a selected competition if you have one
const currentSessions = competitionSessions[selectedCompName] || [];

const addSessionForCompetition = (sessionName) => {
  setCompetitionSessions(prev => {
    const sessions = prev[selectedCompName] || [];
    if (sessions.includes(sessionName)) return prev;
    return {
      ...prev,
      [selectedCompName]: [...sessions, sessionName]
    };
  });
};

// When inline-editing session field, you should also add new sessions to the mapping if the session is not already present
const handleSessionChange = (athleteId, sessionName) => {
  handleInlineEdit(athleteId, "session", sessionName);
  if (sessionName && !currentSessions.includes(sessionName)) {
    addSessionForCompetition(sessionName);
  }
};


  return (
    <div className="container">
      <h1 className="text-3xl font-bold mb-8 text-center text-white-200">
        Manage Athletes
      </h1>
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">{success}</div>
      )}

      {/* Competition Setup */}
<section className="mb-6 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Competition Setup</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label>Competition Name</label>
            <input type="text" name="name" value={competition.name} onChange={handleCompetitionChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label>Location</label>
            <input type="text" name="location" value={competition.location} onChange={handleCompetitionChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label>Date</label>
            <input type="date" name="date" value={competition.date} onChange={handleCompetitionChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label>Competition Type</label>
            <input type="text" name="type" value={competition.type} onChange={handleCompetitionChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
        </div>
        <button onClick={applyCompetitionDetails} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Apply Competition Details</button>
      </section>

      {/* Select Existing Competition */}
      <section className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Select Existing Competition</h2>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Competition Name</th>
                <th>Location</th>
                <th>Date</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {competitions.map(comp => (
                <tr key={comp.id}>
                  <td>{comp.name}</td>
                  <td>{comp.location}</td>
                  <td>{comp.date}</td>
                  <td>{comp.type}</td>
                  <td>
                    <button className="action-btn edit" onClick={() => applyCompetitionFromList(comp)}>Apply</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
	  
      {/* Data Management */}
      <section className="mb-8 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Data Management</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div>
            <label>📁 Import Athlete Data (Excel)</label>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={importAthleteData} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" />
            <p className="text-sm text-gray-500 mt-1">Expected format: Lotn, Name, Gender, Category, Age Group, Date of Birth, Team/Club, Body Weight, Session, 1 Attempt, Rack, Competition name, Date, Location, Competition Type</p>
          </div>
          <button onClick={clearAllData} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Clear All Data</button>
          <button onClick={assignLotNumbersBySession} className="px-4 py-2 bg-green-600 text-black rounded-md hover:bg-green-700">Assign Lot Number by (Session)</button>
        </div>
      </section>	  

      {/* Filters */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Filters</h2>
        <div className="filters-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem', marginBottom: '1.5rem' }}>
          <div>
            <label>Name</label>
            <input name="name" value={filters.name} onChange={handleFilterChange} placeholder="Type athlete name..." />
          </div>
          <div>
            <label>Gender</label>
            <select name="gender" value={filters.gender} onChange={handleFilterChange}>
              <option value="">All Genders</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </div>
          <div>
            <label>Session</label>
            <select name="session" value={filters.session} onChange={handleFilterChange}>
              <option value="">All Sessions</option>
              {sessions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Team/Club</label>
            <select name="team" value={filters.team} onChange={handleFilterChange}>
              <option value="">All Teams</option>
              {teams.map(team => <option key={team} value={team}>{team}</option>)}
            </select>
          </div>
          <div>
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              <optgroup label="Male">
                {maleCategories.map(cat => (
                  <option key={`m-${cat}`} value={cat}>Male {cat}</option>
                ))}
              </optgroup>
              <optgroup label="Female">
                {femaleCategories.map(cat => (
                  <option key={`f-${cat}`} value={cat}>Female {cat}</option>
                ))}
              </optgroup>
            </select>
          </div>
          <div>
            <label>Age Group</label>
            <select name="ageGroup" value={filters.ageGroup} onChange={handleFilterChange}>
              <option value="">All Age Groups</option>
              {ageGroups.map(ageGroup => <option key={ageGroup} value={ageGroup}>{ageGroup}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={clearFilters} className="btn gray">Clear Filters</button>
          <button onClick={handleDeleteSelected} className="btn red" disabled={selectedRows.length === 0}>Delete Selected</button>
        </div>
      </section>




      {/* Table */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Athlete Database</h2>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={isAllChecked} onChange={handleCheckAll} />
                </th>
                <th>Lot #</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Category</th>
                <th>Age Group</th>
                <th>Date of Birth</th>
                <th>Team/Club</th>
                <th>Body Weight</th>
                <th>Session</th>
                <th>1st Attempt</th>
                <th>Rack</th>
                <th>Competition Name</th>
                <th>Date</th>
                <th>Location</th>
                <th>Competition Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSortedAthletes.map(athlete => (
                <tr key={athlete.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(athlete.id)}
                      onChange={() => handleRowCheck(athlete.id)}
                    />
                  </td>
                  <td>
                    <input type="text" value={athlete.lotn} onChange={e => handleInlineEdit(athlete.id, "lotn", e.target.value)} className="w-full p-1 border border-gray-300 rounded" />
                  </td>
                  <td>{athlete.name}</td>
                  <td>{athlete.gender}</td>
                  <td>{athlete.category}</td>
                  <td>{athlete.ageGroup}</td>
                  <td>{athlete.dob}</td>
                  <td>{athlete.team}</td>
                  <td>
                    <input type="number" value={athlete.bodyWeight || ""} onChange={e => handleInlineEdit(athlete.id, "bodyWeight", e.target.value)} className="w-full p-1 border border-gray-300 rounded" />
                  </td>
                  <td>
<SessionDropdown
  sessions={currentSessions}
  value={athlete.session}
  onChange={session => handleSessionChange(athlete.id, session)}
  onAddNew={addSessionForCompetition}
/>                  </td>
                  <td>
                    <input type="number" value={athlete.attempt1 || ""} onChange={e => handleInlineEdit(athlete.id, "attempt1", e.target.value)} className="w-full p-1 border border-gray-300 rounded" />
                  </td>
                  <td>
                    <input type="text" value={athlete.rack || ""} onChange={e => handleInlineEdit(athlete.id, "rack", e.target.value)} className="w-full p-1 border border-gray-300 rounded" />
                  </td>
                  <td>{athlete.competitionName}</td>
                  <td>{athlete.competitionDate}</td>
                  <td>{athlete.competitionLocation}</td>
                  <td>{athlete.competitionType}</td>
                  <td>
                    <button className="action-btn edit" onClick={() => openEditModal(athlete)}>Edit</button>
                    <button className="action-btn delete" onClick={() => handleDelete(athlete.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add New Athlete</button>
        </div>
      </section>
      <AthleteModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSubmit={handleEditSubmit} title="Edit Athlete" athleteData={currentAthlete} isEdit={true} />
      <AthleteModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddSubmit} title="Add New Athlete" athleteData={null} isEdit={false} />
    </div>
  );
}


export default Athletes;