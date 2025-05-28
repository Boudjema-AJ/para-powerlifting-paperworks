import React, { useEffect, useState } from "react";

function Dashboard({ setCurrentSection, competitions, athletes }) {
  const [totalCompetitions, setTotalCompetitions] = useState(0);
  const [totalAthletes, setTotalAthletes] = useState(0);
  const [activeCompetitions, setActiveCompetitions] = useState(0);

  useEffect(() => {
    setTotalAthletes(athletes ? athletes.length : 0);
    setTotalCompetitions(competitions ? competitions.length : 0);
    setActiveCompetitions(
      competitions
        ? competitions.filter((c) => new Date(c.date) >= new Date()).length
        : 0
    );
  }, [competitions, athletes]);

  return (
    <div>
      <div className="header">
        <h1>Competition Management System</h1>
        <p>Manage powerlifting competitions with ease</p>
      </div>
      <div className="dashboard">
        <div className="card">
          <p>{totalCompetitions}</p>
          <h3>TOTAL COMPETITIONS</h3>
          <button
            onClick={() => setCurrentSection("competition")}
            className="red"
          >
            Create Competition
          </button>
        </div>
        <div className="card">
          <p>{totalAthletes}</p>
          <h3>TOTAL ATHLETES</h3>
          <button
            onClick={() => setCurrentSection("athletes")}
            className="blue"
          >
            Manage Athletes
          </button>
        </div>
        <div className="card">
          <p>{activeCompetitions}</p>
          <h3>ACTIVE COMPETITIONS</h3>
          <button
            onClick={() => setCurrentSection("results")}
            className="green"
          >
            View Results
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;