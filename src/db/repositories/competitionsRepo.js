const db = require('../db');

function listAll() {
  const stmt = db.prepare('SELECT * FROM competitions ORDER BY start_date DESC, id DESC');
  return stmt.all();
}

function createForSubject(subjectId, subjectName) {
  const name = subjectName ? `مسابقة ${subjectName}` : 'مسابقة';

  const stmt = db.prepare(
    'INSERT INTO competitions (name, description, start_date, status, subject_id) VALUES (?, ?, datetime(\'now\'), ?, ?)'
  );

  const info = stmt.run(name, null, 'running', subjectId || null);
  return { id: info.lastInsertRowid };
}

function findLatestBySubject(subjectId) {
  const stmt = db.prepare(
    'SELECT id FROM competitions WHERE subject_id = ? ORDER BY start_date DESC, id DESC LIMIT 1'
  );
  const row = stmt.get(subjectId);
  return row ? row.id : null;
}

module.exports = {
  listAll,
  createForSubject,
  findLatestBySubject
};
