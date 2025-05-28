import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import Athletes from "./components/Athletes";
import Competition from "./components/Competition";
import WeighInList from "./components/WeighInList";
import AttemptCards from "./components/AttemptCards";

import Results from "./components/Results";
import "./styles.css";

// Initial Data




const initialAthletes = [
  { id: 1, lotn: "1", name: "John Doe", gender: "Male", category: "65kg", ageGroup: "Elite", dob: "1990-05-15", team: "USA", bodyWeight: "64.5", session: "1", attempt1: null, rack: null, competitionName: null, competitionDate: null, competitionLocation: null, competitionType: null },
  { id: 2, lotn: "2", name: "Jane Smith", gender: "Female", category: "55kg", ageGroup: "Next Gen", dob: "2005-03-22", team: "GBR", bodyWeight: "54.5", session: "1", attempt1: "100", rack: "1", competitionName: null, competitionDate: null, competitionLocation: null, competitionType: null },
  { id: 3, lotn: "3", name: "Ali Khan", gender: "Male", category: "80kg", ageGroup: "Legend", dob: "1975-11-11", team: "EGY", bodyWeight: "79.8", session: "2", attempt1: null, rack: null, competitionName: null, competitionDate: null, competitionLocation: null, competitionType: null },
];

const initialCompetitions = [
  { id: 1, name: "World Championships 2025", location: "Tokyo, Japan", date: "2025-08-15", type: "International" },
  { id: 2, name: "National Open", location: "New York, USA", date: "2025-09-10", type: "National" },
];

function App() {
  const [currentSection, setCurrentSection] = useState("dashboard");
  const [competitions, setCompetitions] = useState(initialCompetitions);
  const [athletes, setAthletes] = useState(initialAthletes);

  // Optionally, you may want to track which competition is selected for the Weigh-In List
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(competitions[0]?.id || null);

  const renderSection = () => {
    switch (currentSection) {
      case "athletes":
        return (
          <Athletes
            competitions={competitions}
            athletes={athletes}
            setAthletesGlobally={setAthletes}
          />
        );
      case "competition":
        return (
          <Competition
            competitions={competitions}
            setCompetitions={setCompetitions}
          />
        );
      case "results":
        return <Results />;
      case "weighinlist":
        return (
          <WeighInList
            athletes={athletes}
            competitions={competitions}
            selectedCompetitionId={selectedCompetitionId}
            setSelectedCompetitionId={setSelectedCompetitionId}
          />
        );
		
		case "attemptcards":
		  return (
			<AttemptCards
			  athletes={athletes}
			  competitions={competitions}
			/>
		  );
      default:
        return (
          <Dashboard
            setCurrentSection={setCurrentSection}
            competitions={competitions}
            athletes={athletes}
          />
        );
    }
  };

  return (
    <div>
      <nav className="nav-bar">
        		
		<ul>
          <li>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                setCurrentSection("dashboard");
              }}
              className={currentSection === "dashboard" ? "active" : ""}
            >
              Dashboard
            </a>
          </li>
          <li>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                setCurrentSection("competition");
              }}
              className={currentSection === "competition" ? "active" : ""}
            >
              Create Competition
            </a>
          </li>
          <li>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                setCurrentSection("athletes");
              }}
              className={currentSection === "athletes" ? "active" : ""}
            >
              Manage Athletes
            </a>
          </li>
          <li>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                setCurrentSection("weighinlist");
              }}
              className={currentSection === "weighinlist" ? "active" : ""}
            >
              Weigh-in List
            </a>
          </li>
  
			<li>
			  <a
				href="#"
				onClick={e => {
				  e.preventDefault();
				  setCurrentSection("attemptcards");
				}}
				className={currentSection === "attemptcards" ? "active" : ""}
			  >
				Attempt Cards
			  </a>
			</li>			
			<li>
            <a href="#"
              onClick={e => {
                e.preventDefault();
                setCurrentSection("results");
              }}
              className={currentSection === "results" ? "active" : ""}
            >
			
			
			
			
              Results
            </a>
          </li>
        </ul>
      </nav>
      <div className="container">{renderSection()}</div>
    </div>
  );
}

export default App;