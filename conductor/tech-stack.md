# Technology Stack: Lazytodo

## Core Technologies
* **Frontend Core:** HTML5, CSS3 (using CSS custom properties for styling and themes), and modern vanilla JavaScript (ES6+ ESM).
* **Build System:** No-build/Zero-build. The app is served as pure static files directly from GitHub Pages or locally. This guarantees instant deployment, trivial updates (via simple Git pull/merge), and no build-dependency rot.
* **Libraries (via CDN/ESM):**
  * `@octokit/core` (via `esm.sh`) for clean, standard API interaction with GitHub.
  * Simple router (hash-based or vanilla `popstate`) for switching between active and archived views.

## Storage & Database
* **Database:** Git repository file storage.
* **Format:** Markdown (`todos.md`) using standard GitHub Flavored Markdown (GFM) task lists:
  * Active: `- [ ] Todo item text`
  * Completed: `- [x] Completed item text`
* **API:** GitHub REST API (`/repos/{owner}/{repo}/contents/{path}`) for reading, updating, and committing the `todos.md` file.

## Hosting & Deployment
* **Hosting Platform:** GitHub Pages (fully static, SSL, custom domain support).
* **Alternative Hosting:** Can be run locally by opening `index.html` directly in the browser.

## Authentication & Authorization
* **GitHub Integration:**
  * **Personal Access Token (PAT):** Direct input of a GitHub Fine-Grained Personal Access Token with read/write access to the repository's contents. Stored locally in the browser's `localStorage`.
  * **Zero Serverless/Backend Overhead:** Since it uses a PAT entered directly by the user, the app requires absolutely no backend, client secrets, or middleman OAuth proxies. It is 100% private and self-contained.
