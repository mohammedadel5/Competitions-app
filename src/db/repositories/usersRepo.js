const db = require('../db');

function findByUsername(username) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username);
}

module.exports = {
  findByUsername
};
