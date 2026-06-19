# ⚡ Lazy Todo

A minimalist, keyboard-first todo application for developers. It is served as a 100% static client-side single-page app (SPA), runs entirely in your browser, and securely stores your tasks in **Markdown format** within a **private GitHub repository** of your choice.

<img width="1409" height="924" alt="image" src="https://github.com/user-attachments/assets/2b9a46a0-cb54-4e99-bddf-9bd3d27e7558" />


## 🚀 Features

* **FIFO Ordering:** Active todos are listed chronologically (oldest at the top) so you focus on completing tasks in the order they were registered.
* **Done Archival:** Completed tasks are checked off and automatically moved to the "Archived Tasks" section to keep your active list clean.
* **Keyboard-First Interface:**
  * <kbd>Cmd</kbd>+<kbd>C</kbd> / <kbd>Ctrl</kbd>+<kbd>C</kbd> — Open the task creation modal (focuses automatically).
  * <kbd>↑</kbd> and <kbd>↓</kbd> — Navigate/select tasks in the active column.
  * <kbd>Cmd</kbd>+<kbd>D</kbd> / <kbd>Ctrl</kbd>+<kbd>D</kbd> — Mark the currently selected task as complete (archives it).
  * <kbd>Esc</kbd> — Close any open dialog.
* **Secure, Direct Git Storage:** Connects directly from your browser to the GitHub API using a Personal Access Token (PAT).
* **Double Isolation (Private Data + Public Code):** You can host this app publicly on GitHub Pages, while saving your actual todos in a completely separate, private repository. Anyone visiting your GitHub Pages site will only see the clean interface asking for their own token.

---

## 🛠️ Setup Guide

### 1. Create your Private Data Repository
1. Log in to GitHub.
2. Create a new repository (e.g., named `lazytodo-data`).
3. Set the repository visibility to **Private** (ensuring your todos are hidden from the public).
4. Create an empty file named `todos.md` inside it, or let the app initialize it for you.

### 2. Generate a GitHub Personal Access Token (PAT)
The app needs a token to read and write your `todos.md` file.
1. Go to **GitHub Settings** ➔ **Developer Settings** ➔ **Personal Access Tokens** ➔ **Fine-grained tokens**.
2. Click **Generate new token**.
3. Name your token (e.g., `Lazytodo Sync Token`).
4. Under **Repository access**, select **Only select repositories** and pick your private data repository (`lazytodo-data`).
5. Under **Permissions** ➔ **Repository permissions**, find **Contents** and set it to **Read and write**.
6. Generate the token and copy it.

### 3. Deploy/Run the App
Since Lazytodo is a zero-build static application, you have two options to run it:

#### Option A: Host on GitHub Pages (Forking)
1. Fork this repository to your GitHub profile.
2. In your fork's settings, navigate to **Pages**.
3. Under **Build and deployment** ➔ **Source**, select **Deploy from a branch**.
4. Set the branch to `main` (or `master`) and folder to `/ (root)`. Click **Save**.
5. Once deployed, open the GitHub Pages URL, click the gear icon (⚙️) to open settings, paste your **PAT** and **repository path** (e.g., `your-username/lazytodo-data`), and hit **Save Settings**.

#### Option B: Run Locally
1. Clone this repository to your computer.
2. Double-click `index.html` to open it directly in any web browser, or run a simple local server (e.g., `npx serve` or python's `http.server`).
3. Configure your settings (PAT + Repository path) in the settings dialog. Your settings are saved securely in your browser's local storage.

---

## 🔄 Merging Updates
To pull the latest UI updates and improvements from the upstream repository without affecting your configurations:
```bash
# Add upstream remote (only once)
git remote add upstream https://github.com/theitch/lazytodo.git

# Pull and merge changes
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```
