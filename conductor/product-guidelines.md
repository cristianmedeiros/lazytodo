# Product Guidelines: Lazytodo

## UX & Design Principles
* **Developer-Centric Minimalism:** Clean, high-contrast, uncluttered interface. Zero bloat. Focus on maximum readability and efficiency.
* **Keyboard-First Workflow:** Every interaction must be achievable via keyboard. Include visible hint badges (e.g., `[Cmd+C]`, `[Cmd+D]`) for discoverability.
* **Adaptive Theme:** Support system dark and light modes. Use a sleek developer-oriented color palette (dark slates, neon accents for focus/highlights, neutral light grays).
* **Instant Feedback & Transitions:** Interactive elements should feel snappy. Use subtle micro-animations (e.g., checkbox transition, modal fade-in) for a premium feel.
* **State Visibility:** Clearly show the status of the sync with GitHub (e.g., "Synced", "Saving...", "Offline", or "Auth Required").

## Architectural & Technical Constraints
* **Pure Static Frontend:** No build step required for hosting unless absolutely necessary. Vanilla HTML5, CSS custom properties, and Modern ES6+ JavaScript.
* **Stateless Client:** The app does not run its own backend. All data storage relies strictly on the GitHub API, reading and writing files directly to the user's workspace repository.
* **Security & Auth:** Access tokens must be stored securely in `localStorage` and never transmitted to any third-party server. Clear authentication errors and allow easy logout.
* **Robust File Merging:** Handle edge cases gracefully (e.g., empty files, malformed markdown, rate-limiting, and simple conflict detection).
* **Upstream Pull Compatibility:** Avoid modifying core application styles and templates directly in a way that blocks upstream Git pulls. Keep configuration in `config.js` or `config.json`.
