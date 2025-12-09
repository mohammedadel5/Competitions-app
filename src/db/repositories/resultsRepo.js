const db = require('../db');

function create({ competitionId, participantId, score, rank, judgeNotes, details }) {
  const insertResult = db.prepare(
    'INSERT INTO results (competition_id, participant_id, score, rank, judge_notes) VALUES (?, ?, ?, ?, ?)'
  );

  const insertDetail = db.prepare(
    'INSERT INTO result_details (result_id, question_id, selected_answer_id, is_correct) VALUES (?, ?, ?, ?)'
  );

  const tx = db.transaction(() => {
    const info = insertResult.run(
      competitionId,
      participantId,
      score != null ? score : null,
      rank != null ? rank : null,
      judgeNotes || null
    );

    const resultId = info.lastInsertRowid;

    if (Array.isArray(details) && details.length > 0) {
      details.forEach((d) => {
        insertDetail.run(
          resultId,
          d.questionId,
          d.selectedAnswerId != null ? d.selectedAnswerId : null,
          d.isCorrect ? 1 : 0
        );
      });
    }

    return { id: resultId };
  });

  return tx();
}

function listAllWithJoins() {
  const stmt = db.prepare(`
    SELECT
      r.id AS result_id,
      r.score,
      r.rank,
      r.judge_notes,
      c.id AS competition_id,
      c.name AS competition_name,
      c.start_date,
      c.subject_id,
      s.name_ar AS subject_name,
      p.id AS participant_id,
      p.full_name,
      p.group_or_school,
      p.category
    FROM results r
    JOIN competitions c ON c.id = r.competition_id
    JOIN participants p ON p.id = r.participant_id
    LEFT JOIN subjects s ON s.id = c.subject_id
    ORDER BY c.start_date DESC, r.id DESC
  `);

  return stmt.all();
}

function listDetailsByResult(resultId) {
  const stmt = db.prepare(`
    SELECT
      rd.id AS detail_id,
      q.id AS question_id,
      q.text AS question_text,
      rd.selected_answer_id,
      rd.is_correct AS is_correct,
      sel.text AS selected_answer_text,
      sel.is_correct AS selected_answer_is_correct,
      cor.id AS correct_answer_id,
      cor.text AS correct_answer_text
    FROM result_details rd
    JOIN questions q ON q.id = rd.question_id
    LEFT JOIN answer_options sel ON sel.id = rd.selected_answer_id
    LEFT JOIN answer_options cor ON cor.question_id = q.id AND cor.is_correct = 1
    WHERE rd.result_id = ?
    ORDER BY rd.id
  `);

  return stmt.all(resultId);
}

module.exports = {
  create,
  listAllWithJoins,
  listDetailsByResult
};
