const { ipcMain } = require('electron');
const subjectsRepo = require('../db/repositories/subjectsRepo');

function registerSubjectHandlers() {
  ipcMain.handle('subjects:list-with-stats', async () => {
    return subjectsRepo.listAllWithQuestionCounts();
  });
}

module.exports = {
  registerSubjectHandlers
};
