# Development Workflow: Lazytodo

## Branching Strategy
* **Trunk-Based Development:** The `main` branch is the core development branch.
* **Feature Branches:** For larger modifications or distinct tracks, create short-lived branch names starting with `feat/` or `fix/` (e.g., `feat/shortcut-completion`).
* **Direct Commits:** For minor documentation updates or very small hotfixes, committing directly to `main` is permitted.

## Testing & Quality Control
* **Local Verification:** Before committing, open `index.html` in the browser locally and test:
  * Todo CRUD functionality (adding, checking, archiving).
  * Key bindings (`Cmd+C` / `Ctrl+C` and `Cmd+D` / `Ctrl+D`).
  * Authentication (PAT local storage config) and data retrieval.

## Deployment Strategy (GitHub Pages)
* **Automated Pages Deployment:** GitHub Pages should be configured to deploy automatically from the `main` branch.
* **Continuous Delivery:** Merging a pull request or pushing directly to `main` instantly publishes the updated app.

## Merging Upstream Updates (For Forks)
To pull the latest improvements and bug fixes from the main project template without overwriting your local configuration:
1. Add the upstream remote once:
   ```bash
   git remote add upstream https://github.com/theitch/lazytodo.git
   ```
2. Pull and merge upstream changes:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   git push origin main
   ```
3. Custom configuration (`config.js`) is added to `.gitignore` so your personal repository credentials are never overwritten or committed during merges.
