const { ipcMain } = require('electron');
const crypto = require('crypto');
const usersRepo = require('../db/repositories/usersRepo');

function verifyPassword(password, user) {
  if (!password || !user || !user.salt || !user.password_hash) {
    return false;
  }

  const derived = crypto
    .pbkdf2Sync(password, user.salt, 100000, 64, 'sha512')
    .toString('hex');

  return derived === user.password_hash;
}

function registerAuthHandlers() {
  ipcMain.handle('auth:login', async (event, { username, password }) => {
    // TODO: implement real password verification (PBKDF2).
    const user = usersRepo.findByUsername(username);

    if (!user || !verifyPassword(password, user)) {
      return { ok: false, error: 'INVALID_CREDENTIALS' };
    }

    return {
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };
  });
}

module.exports = {
  registerAuthHandlers
};
