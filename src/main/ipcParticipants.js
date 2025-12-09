const { ipcMain } = require('electron');
const participantsRepo = require('../db/repositories/participantsRepo');
const competitionsRepo = require('../db/repositories/competitionsRepo');

function registerParticipantHandlers() {
  ipcMain.handle('participants:list-by-competition', async (event, { competitionId }) => {
    return participantsRepo.listByCompetition(competitionId);
  });

  ipcMain.handle('participants:list-by-subject', async (event, { subjectId }) => {
    if (!subjectId) {
      return [];
    }
    try {
      return participantsRepo.listBySubject(subjectId);
    } catch (err) {
      return [];
    }
  });

	ipcMain.handle('participants:create', async (event, payload) => {
		const { competitionId, fullName, groupOrSchool, category } = payload || {};

		if (!competitionId || !fullName) {
			return { ok: false, error: 'INVALID_INPUT' };
		}

		try {
			const result = participantsRepo.create(competitionId, { fullName, groupOrSchool, category });
			return { ok: true, id: result.id };
		} catch (err) {
			return { ok: false, error: 'DB_ERROR' };
		}
	});

  ipcMain.handle('participants:create-for-subject', async (event, payload) => {
    const { subjectId, subjectName, fullName, groupOrSchool, category } = payload || {};

    if (!subjectId || !fullName) {
      return { ok: false, error: 'INVALID_INPUT' };
    }

    try {
      let competitionId = competitionsRepo.findLatestBySubject(subjectId);
      if (!competitionId) {
        const created = competitionsRepo.createForSubject(subjectId, subjectName);
        competitionId = created.id;
      }

      const result = participantsRepo.create(competitionId, { fullName, groupOrSchool, category });
      return { ok: true, id: result.id, competitionId };
    } catch (err) {
      return { ok: false, error: 'DB_ERROR' };
    }
  });

  ipcMain.handle('participants:update', async (event, payload) => {
    const { id, fullName, groupOrSchool, category, notes } = payload || {};

    if (!id || !fullName) {
      return { ok: false, error: 'INVALID_INPUT' };
    }

    try {
      participantsRepo.update(id, { fullName, groupOrSchool, category, notes });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: 'DB_ERROR' };
    }
  });

  ipcMain.handle('participants:delete', async (event, { id }) => {
    if (!id) {
      return { ok: false, error: 'INVALID_INPUT' };
    }

    try {
      const result = participantsRepo.remove(id);
      return { ok: true, changes: result.changes };
    } catch (err) {
      return { ok: false, error: 'DB_ERROR' };
    }
  });
}

module.exports = {
  registerParticipantHandlers
};
