# Competitions App

Offline, Arabic-friendly desktop application for managing **school competitions**. Built with Electron and SQLite for simple, reliable local data storage.

---

## Current MVP scope

The current build focuses on running classroom / school competitions offline with a simple Arabic RTL UI:

- **Authentication**
  - Simple admin login screen backed by the local `users` table.

- **Subjects & Question Bank**
  - View subjects with question counts.
  - Add / edit / delete questions per subject.
  - Support difficulty levels (easy / medium / hard).
  - Each question has multiple answers with exactly one correct answer.
  - Strong uniqueness rules:
    - Unique subject codes.
    - Prevent duplicate questions per subject.

- **Participants Management**
  - Manage participants per subject (add / edit / delete).
  - Filter participants by subject.

- **Run Competition (Quiz)**
  - Choose a subject and configure a run (how many easy/medium/hard questions, random order, etc.).
  - Select a participant and run questions one by one.
  - Show friendly emoji feedback dialog for correct/wrong answers.
  - Save results to the database, including per-question details.
  - Quickly start the next participant run with the same configuration.

- **Results & History**
  - View list of past runs with filters (subject, date, etc.).
  - Drill down into a result to see each question, chosen answer, correctness, and scoring summary.

- **Admin & Safety Tools**
  - Temporary admin button to **reset all app data** (for clean testing and safe schema upgrades).
  - Clear toast-based error messages when uniqueness constraints are violated.

---

## Tech Stack

- **Runtime / Shell**: Electron (main + renderer; Windows is the primary distribution target).
- **Database**: SQLite via **better-sqlite3** (synchronous, embedded DB).
- **Frontend**: Vanilla HTML/CSS/JS with RTL-friendly layout.

---

## Repository Structure

```text
Competitions-app/
├── package.json              # scripts, deps, and electron-builder config
├── main.js                   # Electron main process (windows, menus, lifecycle)
├── preload.js                # secure IPC bridge (contextIsolation, window.api)
├── src/
│   ├── db/
│   │   ├── db.js             # SQLite connection and initialization
│   │   ├── schema.sql        # Database schema (users, subjects, questions, results, ...)
│   │   └── repositories/
│   │       ├── usersRepo.js
│   │       ├── subjectsRepo.js
│   │       ├── competitionsRepo.js
│   │       ├── participantsRepo.js
│   │       ├── questionsRepo.js
│   │       └── resultsRepo.js
│   ├── main/
│   │   ├── ipcAuth.js        # IPC handlers for authentication and users
│   │   ├── ipcCompetitions.js# IPC handlers for competitions
│   │   ├── ipcParticipants.js# IPC handlers for participants
│   │   ├── ipcQuestions.js   # IPC handlers for questions & answers
│   │   ├── ipcResults.js     # IPC handlers for results & reports
│   │   └── ipcAdmin.js       # IPC handlers for admin tools (e.g. reset DB)
│   ├── renderer/
│   │   ├── index.html        # Main renderer window (RTL, Arabic title)
│   │   ├── app.js            # Bootstraps renderer app, basic routing
│   │   ├── ui.js             # Shared UI helpers (toasts, confirm dialogs, answer dialog)
│   │   └── views/
│   │       ├── Login.js
│   │       ├── Competitions.js
│   │       ├── Participants.js
│   │       ├── Questions.js
│   │       ├── RunCompetition.js
│   │       └── Results.js
│   └── assets/
│       └── styles.css        # Shared Arabic-friendly styles, modals, toasts, etc.
└── build/                    # Icon resources (icon.png, icon.ico), kept in git
```

---

## Prerequisites

- **Node.js 18+** (LTS recommended; CI uses 18).
- **npm** (bundled with Node.js).
- **Development OS**:
  - macOS or Windows.
  - Building the final Windows installer is easiest on Windows or via GitHub Actions.

---

## Getting started (development)

Install dependencies:

```bash
npm install
```

Run the app in dev mode:

```bash
npm run dev
```

This launches the Electron app loading `src/renderer/index.html` with the secure preload bridge.

---

## Building installers (local)

Ensure you have the base icon files under `build/` (for example, `build/icon.png` and `build/icon.ico`).

### Windows installers (NSIS + portable)

To build Windows artifacts locally (from a Windows machine or a macOS dev environment with the right tooling):

```bash
npm run dist:win
```

This uses the `build.win` section in `package.json` and builds:

- **NSIS installer** with a friendly product name and shortcuts.
- **Portable EXE** (no installation, can be run directly).

Notes:

- For native modules like `better-sqlite3`, building on a **Windows runner** (local or CI) is recommended.

---

## CI / Release workflow

The repo includes a GitHub Actions workflow:

- `.github/workflows/build-and-release.yml`

Behavior:

- Triggers on **push of any tag starting with `v`** (for example: `v0.1.0`, `v0.2.1`).
- **build-win** job (Windows):
  - Checks out code.
  - Installs dependencies via `npm install`.
  - Ensures `build/icon.ico` is available for the installer.
  - Builds a Windows NSIS installer with `electron-builder`, setting the version from the tag (everything after the leading `v`).
  - Zips the installer and generates `dist/CompetitionsApp-checksums-win.txt` with SHA-256 hashes.
  - Uploads EXE + ZIP + checksum as workflow artifacts.
- **release** job (Ubuntu):
  - Downloads the Windows artifacts.
  - Uses `softprops/action-gh-release` to create a GitHub Release for the tag and attach:
    - `CompetitionsApp-Setup-*.exe`
    - `CompetitionsApp-Setup-*.exe.zip`
    - `CompetitionsApp-checksums-win.txt`

To cut a new release:

```bash
# after committing your changes
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions will build the Windows installer and publish a release for that tag with all artifacts attached.

---

## Database

The app initializes SQLite tables from `src/db/schema.sql` at first run, using a local database file at `src/db/competitions.db` (created automatically if missing).

Key tables:

- `users(id, username, password_hash, salt, role, must_change, created_at)`
- `subjects(id, name_ar, code, sort_order, created_at)`
- `competitions(id, subject_id, started_at, finished_at, notes, ...)`
- `participants(id, subject_id, full_name, group_or_school, category, notes)`
- `questions(id, subject_id, text, difficulty, created_at, updated_at)`
- `answers(id, question_id, text, is_correct)`
- `results(id, competition_id, participant_id, total_score, correct_count, wrong_count, created_at)`
- `result_details(id, result_id, question_id, answer_id, is_correct)`

Indexes and constraints:

- Unique subject codes.
- Optional unique `(subject_id, text)` for questions.
- Enforced "one correct answer per question" via unique indexes.

---

## Architecture

High-level responsibilities:

| Component           | Technology             | Role                                                                 |
| ------------------- | ---------------------- | -------------------------------------------------------------------- |
| User Interface      | HTML, CSS, JavaScript  | Defines the look, feel, and user interaction (renderer process).    |
| Application Runtime | Electron               | Manages windows, menus, and app lifecycle.                          |
| Backend / Logic     | Node.js (main process) | Handles IPC, admin tools, and direct database interaction.          |
| Database Driver     | better-sqlite3         | Synchronous Node.js driver for SQLite database operations.          |
| Database            | SQLite                 | Self-contained file-based database storing all competition data.    |

Typical flow:

1. Renderer calls `window.api.*` functions exposed by `preload.js`.
2. `preload.js` uses `ipcRenderer.invoke` to call IPC handlers in `src/main/`.
3. IPC handlers use repository modules in `src/db/repositories/` to read/write SQLite.
4. Results are returned via IPC back to the renderer and surfaced in the UI.

---

## Security

- `contextIsolation: true`.
- `nodeIntegration: false`.
- All DB operations exposed via `preload.js` using `ipcRenderer.invoke` handlers defined in `src/main/*` IPC modules.
- Passwords hashed with PBKDF2 (`sha512`, 100k iterations) and per-user salt.

---

## Development Tips

- If you change DB schema, bump the app version and apply migrations or use the admin **reset data** tool in the UI for clean testing.
- Keep the UI simple and RTL-friendly. Test Arabic labels and number inputs.
- Use the toast and modal helpers in `ui.js` instead of native `alert`/`confirm`.

---

## Roadmap

- Add backup/restore and safe DB migration tools for offline data.
- Create an app settings screen (school info, defaults, language/font options).
- Add more automated tests for DB repositories and main flows.

---

## License

MIT