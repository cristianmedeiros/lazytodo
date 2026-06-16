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
* **Done Archival:** Once a todo is marked complete, it is moved to an "Archived" section (maintaining clean active lists).

### 2. Keyboard-Centric Workflows & Shortcuts
* **Modal Trigger:** Pressing `Cmd+C` (macOS) or `Ctrl+C` (Windows/Linux) opens a lightbox/modal with a focused textarea to register a new todo.
* **Quick Add Button:** A prominent `+` floating button in the UI also opens this modal.
* **Shortcut Completion:** Having a todo item selected in the UI and pressing `Cmd+D` (macOS) or `Ctrl+D` (Windows/Linux) marks it complete.

### 3. Serverless Git-Backed Storage
* **Markdown Database:** Todos are persisted in a standard Markdown file (e.g., `todos.md`) in the repository.
* **GitHub Pages Hosting:** The app is a static client-side single-page application (SPA) designed to be hosted for free on GitHub Pages.
* **GitHub Authentication:** Users authenticate using GitHub (OAuth/Token) to grant the app write access to the markdown files in their repository.
* **Personal Installation & Forking:** Installation is as simple as forking the repository and enabling GitHub Pages.

### 4. Upgrades & Customization
* **Separate Configuration:** Custom application settings (like OAuth IDs or repository names) are stored in a configuration file (e.g., `config.json`) separate from the core logic. This allows users to easily pull updates from the upstream template repository without conflicts.
