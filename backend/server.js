const express = require('express');
const cors = require('cors');
const db = require('./db');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/competitions', (req, res) => {
  const { name, date, categories, athletes } = req.body;
  console.log('POST /api/competitions - Request body:', req.body);

  if (!name || !date || !categories) {
    console.error('Missing required competition fields');
    return res.status(400).json({ error: 'Missing required competition fields (name, date, categories)' });
  }

  const competitionStmt = db.prepare('INSERT INTO competitions (name, date, categories) VALUES (?, ?, ?)');
  competitionStmt.run(name, date, categories, function (err) {
    if (err) {
      console.error('Error creating competition:', err);
      return res.status(500).json({ error: 'Failed to create competition' });
    }

    const competitionId = this.lastID;
    console.log(`Created competition with ID: ${competitionId}`);

    if (athletes && Array.isArray(athletes)) {
      const athleteStmt = db.prepare(`
        INSERT INTO athletes (competition_id, session, category, name, team, dob, ageGroup, bodyWeight, rack, attempt1, lotn)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      athletes.forEach((athlete, index) => {
        console.log(`Inserting athlete ${index + 1} for competition ${competitionId}:`, athlete);
        athleteStmt.run(
          competitionId,
          athlete.session || null,
          athlete.category || null,
          athlete.name || null,
          athlete.team || null,
          athlete.dob || null,
          athlete.ageGroup || null,
          athlete.bodyWeight || null,
          athlete.rack || null,
          athlete.attempt1 || null,
          athlete.lotn || null
        );
      });
      athleteStmt.finalize();
    }

    competitionStmt.finalize();
    res.status(201).json({ message: 'Competition created', competitionId });
  });
});

app.get('/api/competitions', (req, res) => {
  console.log('GET /api/competitions');
  db.all('SELECT * FROM competitions', [], (err, competitions) => {
    if (err) {
      console.error('Error fetching competitions:', err);
      return res.status(500).json({ error: 'Failed to fetch competitions' });
    }
    console.log('Fetched competitions:', competitions);
    if (competitions.length === 0) return res.json([]);
    const result = [];
    let pending = competitions.length;
    competitions.forEach((comp) => {
      db.all('SELECT * FROM athletes WHERE competition_id = ?', [comp.id], (err, athletes) => {
        if (err) {
          console.error(`Error fetching athletes for competition ${comp.id}:`, err);
          return res.status(500).json({ error: 'Failed to fetch athletes' });
        }
        result.push({ ...comp, athletes });
        if (--pending === 0) res.json(result);
      });
    });
  });
});

app.get('/api/competitions/:id', (req, res) => {
  const { id } = req.params;
  console.log(`GET /api/competitions/${id}`);
  db.get('SELECT * FROM competitions WHERE id = ?', [id], (err, competition) => {
    if (err || !competition) {
      console.error(`Competition ${id} not found:`, err);
      return res.status(404).json({ error: 'Competition not found' });
    }
    db.all('SELECT * FROM athletes WHERE competition_id = ?', [id], (err, athletes) => {
      if (err) {
        console.error(`Error fetching athletes for competition ${id}:`, err);
        return res.status(500).json({ error: 'Failed to fetch athletes' });
      }
      console.log(`Fetched competition ${id} with athletes:`, { ...competition, athletes });
      res.json({ ...competition, athletes });
    });
  });
});

app.put('/api/competitions/:id', (req, res) => {
  const { id } = req.params;
  const { name, date, categories } = req.body;
  console.log(`PUT /api/competitions/${id} - Request body:`, req.body);

  if (!name || !date || !categories) {
    console.error('Missing required fields for update');
    return res.status(400).json({ error: 'Missing required fields (name, date, categories)' });
  }

  db.get('SELECT * FROM competitions WHERE id = ?', [id], (err, competition) => {
    if (err || !competition) {
      console.error(`Competition ${id} not found for update:`, err);
      return res.status(404).json({ error: 'Competition not found' });
    }
    const stmt = db.prepare('UPDATE competitions SET name = ?, date = ?, categories = ? WHERE id = ?');
    stmt.run(name, date, categories, id, (err) => {
      if (err) {
        console.error(`Error updating competition ${id}:`, err);
        return res.status(500).json({ error: 'Failed to update competition' });
      }
      stmt.finalize();
      res.status(200).json({ message: 'Competition updated successfully' });
    });
  });
});

app.delete('/api/competitions/:id', (req, res) => {
  const { id } = req.params;
  console.log(`DELETE /api/competitions/${id}`);
  db.get('SELECT * FROM competitions WHERE id = ?', [id], (err, competition) => {
    if (err || !competition) {
      console.error(`Competition ${id} not found for deletion:`, err);
      return res.status(404).json({ error: 'Competition not found' });
    }
    const deleteAthletesStmt = db.prepare('DELETE FROM athletes WHERE competition_id = ?');
    deleteAthletesStmt.run(id, (err) => {
      if (err) {
        console.error(`Error deleting athletes for competition ${id}:`, err);
        return res.status(500).json({ error: 'Failed to delete athletes' });
      }
      const deleteCompStmt = db.prepare('DELETE FROM competitions WHERE id = ?');
      deleteCompStmt.run(id, (err) => {
        if (err) {
          console.error(`Error deleting competition ${id}:`, err);
          return res.status(500).json({ error: 'Failed to delete competition' });
        }
        deleteAthletesStmt.finalize();
        deleteCompStmt.finalize();
        res.status(200).json({ message: 'Competition deleted successfully' });
      });
    });
  });
});

app.post('/api/competitions/:id/athletes', (req, res) => {
  const { id } = req.params;
  const { athletes } = req.body;
  console.log(`POST /api/competitions/${id}/athletes - Request body:`, req.body);

  if (!athletes || !Array.isArray(athletes)) {
    console.error('Invalid athlete data');
    return res.status(400).json({ error: 'Invalid athlete data' });
  }

  db.get('SELECT * FROM competitions WHERE id = ?', [id], (err, competition) => {
    if (err || !competition) {
      console.error(`Competition ${id} not found:`, err);
      return res.status(404).json({ error: 'Competition not found' });
    }

    const athleteStmt = db.prepare(`
      INSERT INTO athletes (competition_id, session, category, name, team, dob, ageGroup, bodyWeight, rack, attempt1, lotn)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    athletes.forEach((athlete, index) => {
      console.log(`Inserting athlete ${index + 1} for competition ${id}:`, athlete);
      athleteStmt.run(
        id,
        athlete.session || null,
        athlete.category || null,
        athlete.name || null,
        athlete.team || null,
        athlete.dob || null,
        athlete.ageGroup || null,
        athlete.bodyWeight || null,
        athlete.rack || null,
        athlete.attempt1 || null,
        athlete.lotn || null
      );
    });

    athleteStmt.finalize();

    db.all('SELECT * FROM athletes WHERE competition_id = ?', [id], (err, updatedAthletes) => {
      if (err) {
        console.error(`Error fetching updated athletes for competition ${id}:`, err);
        return res.status(500).json({ error: 'Failed to fetch updated athletes' });
      }
      console.log(`Updated athletes for competition ${id}:`, updatedAthletes);
      res.status(201).json({ message: 'Athletes added successfully', athletes: updatedAthletes });
    });
  });
});

app.put('/api/competitions/:id/athletes', (req, res) => {
  const { id } = req.params;
  const { athletes } = req.body;
  console.log(`PUT /api/competitions/${id}/athletes - Request body:`, req.body);

  if (!athletes || !Array.isArray(athletes)) {
    console.error('Invalid athlete data');
    return res.status(400).json({ error: 'Invalid athlete data' });
  }

  db.get('SELECT * FROM competitions WHERE id = ?', [id], (err, competition) => {
    if (err || !competition) {
      console.error(`Competition ${id} not found:`, err);
      return res.status(404).json({ error: 'Competition not found' });
    }

    db.run('DELETE FROM athletes WHERE competition_id = ?', [id], (err) => {
      if (err) {
        console.error(`Error deleting existing athletes for competition ${id}:`, err);
        return res.status(500).json({ error: 'Failed to delete existing athletes' });
      }

      const athleteStmt = db.prepare(`
        INSERT INTO athletes (id, competition_id, session, category, name, team, dob, ageGroup, bodyWeight, rack, attempt1, lotn)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      athletes.forEach((athlete, index) => {
        console.log(`Inserting updated athlete ${index + 1} for competition ${id}:`, athlete);
        athleteStmt.run(
          athlete.id,
          id,
          athlete.session || null,
          athlete.category || null,
          athlete.name || null,
          athlete.team || null,
          athlete.dob || null,
          athlete.ageGroup || null,
          athlete.bodyWeight || null,
          athlete.rack || null,
          athlete.attempt1 || null,
          athlete.lotn || null
        );
      });

      athleteStmt.finalize();
      res.status(200).json({ message: 'Athletes updated successfully' });
    });
  });
});

app.delete('/api/competitions/:id/athletes', (req, res) => {
  const { id } = req.params;
  const { athleteIds } = req.body;
  console.log(`DELETE /api/competitions/${id}/athletes - Request body:`, req.body);

  if (!athleteIds || !Array.isArray(athleteIds)) {
    console.error('Invalid athlete IDs');
    return res.status(400).json({ error: 'Invalid athlete IDs' });
  }

  const placeholders = athleteIds.map(() => '?').join(',');
  db.run(`DELETE FROM athletes WHERE competition_id = ? AND id IN (${placeholders})`, [id, ...athleteIds], (err) => {
    if (err) {
      console.error(`Error deleting athletes for competition ${id}:`, err);
      return res.status(500).json({ error: 'Failed to delete athletes' });
    }
    res.status(200).json({ message: 'Athletes deleted successfully' });
  });
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});