CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL,
  must_change INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS competitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  subject_id INTEGER,
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE TABLE IF NOT EXISTS participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  competition_id INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  group_or_school TEXT,
  category TEXT,
  notes TEXT,
  FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  competition_id INTEGER NOT NULL,
  participant_id INTEGER NOT NULL,
  score REAL,
  rank INTEGER,
  judge_notes TEXT,
  FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
  FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS result_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  selected_answer_id INTEGER,
  is_correct INTEGER NOT NULL,
  FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (selected_answer_id) REFERENCES answer_options(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ar TEXT NOT NULL,
  code TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS answer_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Helpful indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_competitions_subject_id ON competitions(subject_id);
CREATE INDEX IF NOT EXISTS idx_participants_competition_id ON participants(competition_id);
CREATE INDEX IF NOT EXISTS idx_results_competition_id ON results(competition_id);
CREATE INDEX IF NOT EXISTS idx_results_participant_id ON results(participant_id);
CREATE INDEX IF NOT EXISTS idx_result_details_result_id ON result_details(result_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject_difficulty ON questions(subject_id, difficulty);
CREATE INDEX IF NOT EXISTS idx_answer_options_question_id ON answer_options(question_id);

-- Strong data integrity constraints
-- Each subject code must be unique (e.g. AR, MATH)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_code_unique ON subjects(code);

-- Avoid exact duplicate questions within the same subject
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_subject_text_unique
  ON questions(subject_id, text);

-- Ensure at most one correct answer per question
CREATE UNIQUE INDEX IF NOT EXISTS idx_answer_options_one_correct
  ON answer_options(question_id)
  WHERE is_correct = 1;
