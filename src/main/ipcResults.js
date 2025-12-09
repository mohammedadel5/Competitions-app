const { ipcMain } = require('electron');
const resultsRepo = require('../db/repositories/resultsRepo');

function registerResultHandlers() {
  ipcMain.handle('results:create', async (event, payload) => {
    const { competitionId, participantId, score, rank, judgeNotes, details } = payload || {};

    if (!competitionId || !participantId) {
      return { ok: false, error: 'INVALID_INPUT' };
    }

    try {
      const result = resultsRepo.create({
        competitionId,
        participantId,
        score,
        rank,
        judgeNotes,
        details
      });
      return { ok: true, id: result.id };
    } catch (err) {
      return { ok: false, error: 'DB_ERROR' };
    }
  });

	ipcMain.handle('results:list-all', async () => {
		try {
			return resultsRepo.listAllWithJoins();
		} catch (err) {
			return [];
		}
	});

	ipcMain.handle('results:get-details', async (event, { resultId }) => {
		if (!resultId) {
			return [];
		}
		try {
			return resultsRepo.listDetailsByResult(resultId);
		} catch (err) {
			return [];
		}
	});
}

module.exports = {
  registerResultHandlers
};
