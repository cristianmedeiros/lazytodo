# Initial Concept

A GitHub Pages-hosted Todo app that stores tasks in Markdown files and authenticates with GitHub, as described.

# Product Guide: Lazytodo

## Vision
A highly convenient, minimalist, developer-friendly todo application designed to help developers stop losing track of tasks. Lazytodo runs entirely in the browser, is hosted on GitHub Pages, and stores tasks directly as Markdown list items in a Git repository. It uses GitHub authentication to write changes back to the repository.

## Target Audience
Developers and power users who prefer keyboard-centric workflows, want to keep their todo lists in simple text formats, and want a self-hosted, personal productivity dashboard without third-party databases.

## Core Features

### 1. Simple Todo Management
* **FIFO Ordering:** Todos are displayed in First-In-First-Out (FIFO) order, meaning the first todo registered appears at the top of the list, and new items are added to the bottom.
* **Completion Checkboxes:** Each todo item has a checkbox to mark it complete.
* **Done Archival:** Completed tasks are moved to a separate "Archived Tasks" modal, accessible via a header link, keeping the main interface clean. Completed todos are ordered by their close date (newest completed on top).
* **Date Metadata:** Displays the creation date on active todo cards and both creation and completion dates on archived cards.

### 2. Notes Feature
* **Modal Trigger:** Pressing `Cmd+N` (macOS) or `Ctrl+N` (Windows/Linux) or clicking the pencil icon in the header opens a note creation modal.
* **Compact Sidebar List:** Notes are displayed in a scrollable list in the left sidebar, sorted by newest first.
* **Quick Delete:** Notes can be easily deleted using the inline "Delete" action.

### 3. Tag Cloud & Filtering System
* **Hashtag Extraction:** The app automatically parses hashtags (e.g. `#work`, `#personal`) from active todos, archived todos, and notes.
* **Sidebar Tag Cloud:** Displays all unique hashtags with their respective counts (e.g. `#dev (3)`).
* **Instant Filtering:** Clicking a tag in the cloud filters todos and notes to display only items containing that tag. An active filter can be cleared by clicking the tag again or clicking "Clear".

### 4. Keyboard-Centric Workflows & Shortcuts
* **Modal Trigger:** Pressing `Cmd+C` (macOS) or `Ctrl+C` (Windows/Linux) opens a lightbox/modal with a focused textarea to register a new todo.
* **Note Modal Trigger:** Pressing `Cmd+N` (macOS) or `Ctrl+N` (Windows/Linux) opens a note modal with a focused textarea.
* **Quick Add Button:** A prominent `+` floating button in the UI also opens this modal.
* **Shortcut Completion:** Having a todo item selected in the UI and pressing `Cmd+D` (macOS) or `Ctrl+D` (Windows/Linux) marks it complete.
* **Shortcut Submission:** Pressing `Ctrl+Enter` or `Cmd+Enter` inside any textarea submits the form.

## Storage & Database
* **Markdown Database:** Todos are persisted in a standard Markdown file (e.g., `todos.md`) in the repository.
* **GitHub Pages Hosting:** The app is a static client-side single-page application (SPA) designed to be hosted for free on GitHub Pages.
* **GitHub Authentication:** Users authenticate using GitHub (OAuth/Token) to grant the app write access to the markdown files in their repository.
* **Personal Installation & Forking:** Installation is as simple as forking the repository and enabling GitHub Pages.

## Upgrades & Customization
* **Separate Configuration:** Custom application settings (like OAuth IDs or repository names) are stored in a configuration file (e.g., `config.json`) separate from the core logic. This allows users to easily pull updates from the upstream template repository without conflicts.
