const db = require('../db');

function listByCompetition(competitionId) {
  const stmt = db.prepare(`
    SELECT p.*
    FROM participants p
    JOIN competitions c ON c.id = p.competition_id
    WHERE c.subject_id = (SELECT subject_id FROM competitions WHERE id = ?)
    ORDER BY p.id DESC
  `);

  return stmt.all(competitionId);
}

function create(competitionId, { fullName, groupOrSchool, category }) {
  const stmt = db.prepare(
    'INSERT INTO participants (competition_id, full_name, group_or_school, category, notes) VALUES (?, ?, ?, ?, ?)' 
  );

  const info = stmt.run(
    competitionId,
    fullName,
    groupOrSchool || null,
    category || null,
    null
  );

  return { id: info.lastInsertRowid };
}

function listBySubject(subjectId) {
  const stmt = db.prepare(`
    SELECT p.*
    FROM participants p
    JOIN competitions c ON c.id = p.competition_id
    WHERE c.subject_id = ?
    ORDER BY p.id DESC
  `);

  return stmt.all(subjectId);
}

function update(id, { fullName, groupOrSchool, category, notes }) {
  const stmt = db.prepare(
    'UPDATE participants SET full_name = ?, group_or_school = ?, category = ?, notes = ? WHERE id = ?'
  );

  const info = stmt.run(fullName, groupOrSchool || null, category || null, notes || null, id);
  return { changes: info.changes };
}

function remove(id) {
  const stmt = db.prepare('DELETE FROM participants WHERE id = ?');
  const info = stmt.run(id);
  return { changes: info.changes };
}

module.exports = {
  listByCompetition,
  create,
  listBySubject,
  update,
  remove
};
