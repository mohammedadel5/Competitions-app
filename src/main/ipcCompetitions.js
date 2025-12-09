const { ipcMain } = require('electron');
const competitionsRepo = require('../db/repositories/competitionsRepo');

function registerCompetitionHandlers() {
  ipcMain.handle('competitions:list', async () => {
    return competitionsRepo.listAll();
  });

   ipcMain.handle('competitions:start-for-subject', async (event, { subjectId, subjectName }) => {
    if (!subjectId) {
      return { ok: false, error: 'INVALID_INPUT' };
    }

    const result = competitionsRepo.createForSubject(subjectId, subjectName);
    return { ok: true, id: result.id };
  });
}

module.exports = {
  registerCompetitionHandlers
};
