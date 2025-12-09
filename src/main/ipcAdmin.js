const { ipcMain } = require('electron');
const db = require('../db/db');

function registerAdminHandlers() {
  ipcMain.handle('admin:reset-db', async () => {
    try {
      const tx = db.transaction(() => {
        // Order matters because of foreign keys
        db.exec('DELETE FROM result_details');
        db.exec('DELETE FROM results');
        db.exec('DELETE FROM answer_options');
        db.exec('DELETE FROM questions');
        db.exec('DELETE FROM participants');
        db.exec('DELETE FROM competitions');
      });
      tx();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: 'DB_RESET_ERROR' };
    }
  });
}

module.exports = {
  registerAdminHandlers
};
