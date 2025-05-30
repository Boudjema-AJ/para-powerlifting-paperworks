// backend/db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('competitions.db');

db.serialize(() => {
  // Create competitions table
  db.run(`
    CREATE TABLE IF NOT EXISTS competitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT,
      categories TEXT
    )
  `);

  // Create athletes table
  db.run(`
    CREATE TABLE IF NOT EXISTS athletes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competition_id INTEGER,
      session INTEGER,
      category TEXT,
      name TEXT,
      team TEXT,
      dob TEXT,
      ageGroup TEXT,
      bodyWeight TEXT,
      rack TEXT,
      attempt1 TEXT,
      FOREIGN KEY (competition_id) REFERENCES competitions(id)
    )
  `);
});

module.exports = db;