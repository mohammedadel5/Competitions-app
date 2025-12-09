const { ipcMain } = require('electron');
const db = require('../db/db');
const questionsRepo = require('../db/repositories/questionsRepo');

function registerQuestionHandlers() {
  ipcMain.handle('questions:list-by-subject', async (event, { subjectId }) => {
    return questionsRepo.listBySubject(subjectId);
  });

  ipcMain.handle('questions:create', async (event, payload) => {
    const { subjectId, text, difficulty, answers } = payload || {};

    if (!subjectId || !text || !difficulty) {
      return { ok: false, error: 'INVALID_INPUT' };
    }

    const existing = db
      .prepare('SELECT id FROM questions WHERE subject_id = ? AND text = ? LIMIT 1')
      .get(subjectId, text);
    if (existing) {
      return { ok: false, error: 'DUPLICATE_QUESTION_SAME_SUBJECT' };
    }

    try {
      const result = questionsRepo.createWithAnswers(subjectId, text, difficulty, answers || []);
      return { ok: true, id: result.id };
    } catch (err) {
      return { ok: false, error: 'DB_ERROR' };
    }
  });

  ipcMain.handle('questions:update', async (event, payload) => {
    const { id, subjectId, text, difficulty, answers } = payload || {};

    if (!id || !subjectId || !text || !difficulty) {
      return { ok: false, error: 'INVALID_INPUT' };
    }

    const existing = db
      .prepare('SELECT id FROM questions WHERE subject_id = ? AND text = ? AND id != ? LIMIT 1')
      .get(subjectId, text, id);
    if (existing) {
      return { ok: false, error: 'DUPLICATE_QUESTION_SAME_SUBJECT' };
    }

    try {
      questionsRepo.updateWithAnswers(id, text, difficulty, answers || []);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: 'DB_ERROR' };
    }
  });

  ipcMain.handle('questions:delete', async (event, { id }) => {
    if (!id) {
      return { ok: false, error: 'INVALID_INPUT' };
    }

    questionsRepo.deleteById(id);
    return { ok: true };
  });
}

module.exports = {
  registerQuestionHandlers
};
