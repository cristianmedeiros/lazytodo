# Plan: Scaffold Core Application

## User Review Required

> [!IMPORTANT]
> * You will need to create a **private GitHub repository** (e.g., `lazytodo-data`) to store your `todos.md` file.
> * You will need to generate a **GitHub Personal Access Token (PAT)** (specifically, a fine-grained token with "Contents" read/write permissions for that private repository) so the app can read/write data securely.

## Proposed Changes

### Core SPA Scaffold
* [x] **Step 1: Set up index.html layout and modern CSS styling**
  * **Files:** `index.html`, `style.css`
  * **Description:** Implement a clean, developer-centric, responsive UI. It will show a double-column layout (Active Todos on the left, Archived/Done Todos on the right), a settings panel (for PAT and Repository settings), and a lightbox/modal for task creation.
  * **Test:** Open `index.html` in browser, verify layout, dark/light adaptive styling, and responsiveness.
* [x] **Step 2: Add keyboard shortcuts and modal functionality**
  * **Files:** `app.js`
  * **Description:** Add window event listeners for `Cmd+C` / `Ctrl+C` to open the task creation modal and auto-focus the textarea. Support closing via `Esc` or clicking outside the lightbox. Bind `Cmd+D` / `Ctrl+D` to mark the currently selected todo item as complete.
  * **Test:** Press shortcut, verify modal opens and focuses. Navigate/select a todo and press shortcut, verify it transitions to complete.
* [x] **Step 3: Implement client-side storage fallback**
  * **Files:** `app.js`
  * **Description:** Write core todo actions (create, list, select, check off/archive) using browser `localStorage` as a fallback. Ensure the active list is rendered in FIFO order (first created appears on top).
  * **Test:** Add 3 todos, verify the 1st one is at the top (FIFO). Check one off, verify it transitions to the archived list. Refresh and verify state persists.
* [x] **Step 4: Integrate Octokit and private repository sync**
  * **Files:** `app.js`
  * **Description:** Import Octokit via ESM CDN (`esm.sh`). Add functions to fetch the remote `todos.md` from your private repo, parse standard Markdown task lists (`- [ ] task` and `- [x] task`), render them in the UI, and push updates back as commits when todos are added or completed.
  * **Test:** Input PAT and Repository in settings, verify the app pulls existing todos from GitHub and successfully commits new/completed todos.
* [x] **Step 5: Configurations and Ignored Files**
  * **Files:** `.gitignore`, `README.md`
  * **Description:** Configure `.gitignore` to prevent any local testing keys, settings files, or logs from being committed. Add instructions to `README.md` detailing how to set up the app on GitHub Pages.
  * **Test:** Verify `config.js` or personal logs are ignored.

## Verification Plan

### Automated Tests
* None. (This is a pure static client-side application. Manual browser verification is the primary verification method).

### Manual Verification
* **Local Storage Sandbox:** Verify the app works flawlessly offline using `localStorage` if no PAT is configured.
* **Shortcut Bindings:** Verify `Cmd+C`/`Ctrl+C` opens the modal and focuses. Verify `Cmd+D`/`Ctrl+D` completes a selected task.
* **FIFO Check:** Add tasks "A", "B", "C" and verify order top-to-bottom is "A", "B", "C".
* **Octokit Sync:** Enter a PAT and Repo, verify GitHub API operations read and write to the repository's `todos.md`.
