const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  auth: {
    login(credentials) {
      return ipcRenderer.invoke('auth:login', credentials);
    }
  },
  subjects: {
    listWithStats() {
      return ipcRenderer.invoke('subjects:list-with-stats');
    }
  },
  competitions: {
    list() {
      return ipcRenderer.invoke('competitions:list');
    },
    startForSubject(subjectId, subjectName) {
      return ipcRenderer.invoke('competitions:start-for-subject', { subjectId, subjectName });
    }
  },
  participants: {
    listByCompetition(competitionId) {
      return ipcRenderer.invoke('participants:list-by-competition', { competitionId });
    },
		create(competitionId, payload) {
			return ipcRenderer.invoke('participants:create', { competitionId, ...payload });
		},
		listBySubject(subjectId) {
			return ipcRenderer.invoke('participants:list-by-subject', { subjectId });
		},
		createForSubject(subjectId, payload) {
			return ipcRenderer.invoke('participants:create-for-subject', { subjectId, ...payload });
		},
		update(payload) {
			return ipcRenderer.invoke('participants:update', payload);
		},
		delete(id) {
			return ipcRenderer.invoke('participants:delete', { id });
		}
  },
  results: {
		save(payload) {
			return ipcRenderer.invoke('results:create', payload);
		},
		listAll() {
			return ipcRenderer.invoke('results:list-all');
		},
		getDetails(resultId) {
			return ipcRenderer.invoke('results:get-details', { resultId });
		}
	},
  admin: {
    resetDb() {
      return ipcRenderer.invoke('admin:reset-db');
    }
  },
  questions: {
    listBySubject(subjectId) {
      return ipcRenderer.invoke('questions:list-by-subject', { subjectId });
    },
    create(payload) {
      return ipcRenderer.invoke('questions:create', payload);
    },
    update(payload) {
      return ipcRenderer.invoke('questions:update', payload);
    },
    delete(id) {
      return ipcRenderer.invoke('questions:delete', { id });
    }
  }
});
