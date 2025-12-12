const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const Database = require('better-sqlite3');
const crypto = require('crypto');

const isPackaged = !!(app && app.isPackaged);

const dbDirPath = isPackaged ? app.getPath('userData') : __dirname;
const dbFilePath = path.join(dbDirPath, 'competitions.db');
const schemaPath = isPackaged
  ? path.join(process.resourcesPath, 'db', 'schema.sql')
  : path.join(__dirname, 'schema.sql');

try {
  fs.mkdirSync(dbDirPath, { recursive: true });
} catch (err) {
}

const db = new Database(dbFilePath);

if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
}

function ensureDefaultAdmin() {
  const row = db.prepare('SELECT COUNT(*) AS count FROM users').get();

  if (!row || row.count > 0) {
    return;
  }

  const username = 'admin';
  const password = 'admin123';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');

  db.prepare(
    'INSERT INTO users (username, password_hash, salt, role, must_change) VALUES (?, ?, ?, ?, 1)'
  ).run(username, hash, salt, 'admin');
}

function ensureDefaultSubjects() {
  const row = db.prepare('SELECT COUNT(*) AS count FROM subjects').get();

  if (!row || row.count > 0) {
    return;
  }

  const subjects = [
    { name_ar: 'التربية الإسلامية', code: 'ISLAMIC', sort_order: 1 },
    { name_ar: 'اللغة العربية', code: 'AR', sort_order: 2 },
    { name_ar: 'اللغة الإنجليزية', code: 'EN', sort_order: 3 },
    { name_ar: 'الرياضيات', code: 'MATH', sort_order: 4 },
    { name_ar: 'الأحياء', code: 'BIO', sort_order: 5 },
    { name_ar: 'الكيمياء', code: 'CHEM', sort_order: 6 },
    { name_ar: 'الفيزياء', code: 'PHYS', sort_order: 7 },
    { name_ar: 'التاريخ', code: 'HIST', sort_order: 8 },
    { name_ar: 'الجغرافية', code: 'GEO', sort_order: 9 }
  ];

  const insert = db.prepare(
    'INSERT INTO subjects (name_ar, code, sort_order) VALUES (?, ?, ?)'
  );

  const insertMany = db.transaction(() => {
    subjects.forEach((s) => {
      insert.run(s.name_ar, s.code, s.sort_order);
    });
  });

  insertMany();
}

function ensureCompetitionsSubjectColumn() {
  const columns = db.prepare('PRAGMA table_info(competitions)').all();
  const hasSubjectId = columns.some((col) => col && col.name === 'subject_id');

  if (!hasSubjectId) {
    db.exec('ALTER TABLE competitions ADD COLUMN subject_id INTEGER');
  }
}

ensureDefaultAdmin();
ensureDefaultSubjects();
ensureCompetitionsSubjectColumn();

module.exports = db;
