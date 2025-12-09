const db = require('../db');

function listBySubject(subjectId) {
  const questions = db
    .prepare(
      'SELECT id, subject_id, text, difficulty, created_at, updated_at FROM questions WHERE subject_id = ? ORDER BY id DESC'
    )
    .all(subjectId);

  const answersStmt = db.prepare(
    'SELECT id, question_id, text, is_correct, order_index FROM answer_options WHERE question_id = ? ORDER BY order_index ASC'
  );

  return questions.map((q) => ({
    ...q,
    answers: answersStmt.all(q.id)
  }));
}

function createWithAnswers(subjectId, text, difficulty, answers) {
  const insertQuestion = db.prepare(
    'INSERT INTO questions (subject_id, text, difficulty) VALUES (?, ?, ?)'
  );
  const insertAnswer = db.prepare(
    'INSERT INTO answer_options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)'
  );

  const tx = db.transaction((subjectIdInner, textInner, difficultyInner, answersInner) => {
    const info = insertQuestion.run(subjectIdInner, textInner, difficultyInner);
    const questionId = info.lastInsertRowid;

    (answersInner || []).forEach((a, index) => {
      if (!a || !a.text) {
        return;
      }
      insertAnswer.run(questionId, a.text, a.is_correct ? 1 : 0, index);
    });

    return questionId;
  });

  const id = tx(subjectId, text, difficulty, answers || []);
  return { id };
}

function updateWithAnswers(id, text, difficulty, answers) {
  const updateQuestion = db.prepare(
    'UPDATE questions SET text = ?, difficulty = ?, updated_at = datetime(\'now\') WHERE id = ?'
  );
  const deleteAnswers = db.prepare('DELETE FROM answer_options WHERE question_id = ?');
  const insertAnswer = db.prepare(
    'INSERT INTO answer_options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)'
  );

  const tx = db.transaction((idInner, textInner, difficultyInner, answersInner) => {
    updateQuestion.run(textInner, difficultyInner, idInner);
    deleteAnswers.run(idInner);

    (answersInner || []).forEach((a, index) => {
      if (!a || !a.text) {
        return;
      }
      insertAnswer.run(idInner, a.text, a.is_correct ? 1 : 0, index);
    });
  });

  tx(id, text, difficulty, answers || []);
}

function deleteById(id) {
  const deleteAnswers = db.prepare('DELETE FROM answer_options WHERE question_id = ?');
  const deleteQuestion = db.prepare('DELETE FROM questions WHERE id = ?');

  const tx = db.transaction((idInner) => {
    deleteAnswers.run(idInner);
    deleteQuestion.run(idInner);
  });

  tx(id);
}

module.exports = {
  listBySubject,
  createWithAnswers,
  updateWithAnswers,
  deleteById
};
