const db = require('../db');

function listAllWithQuestionCounts() {
  const sql = `
    SELECT s.id,
           s.name_ar,
           s.code,
           s.is_active,
           s.sort_order,
           COALESCE(COUNT(q.id), 0) AS question_count
    FROM subjects s
    LEFT JOIN questions q ON q.subject_id = s.id
    WHERE s.is_active = 1
    GROUP BY s.id, s.name_ar, s.code, s.is_active, s.sort_order
    ORDER BY s.sort_order ASC, s.id ASC
  `;

  return db.prepare(sql).all();
}

module.exports = {
  listAllWithQuestionCounts
};
