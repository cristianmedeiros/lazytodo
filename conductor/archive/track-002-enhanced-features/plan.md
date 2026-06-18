# Plan: Archive Modal, Notes, and Tag Cloud

## Proposed Changes

### UI & Layout Modifications
* [x] **Step 1: Update HTML structures for sidebar and header**
  * **Files:** `index.html`
  * **Description:** 
    * Remove the side-by-side active/archived columns.
    * Redesign the layout into a responsive two-column grid: a Left Sidebar (for the Tag Cloud and Notes list) and a Main Area (for the Active Todos).
    * Add an "Archive" text button in the top bar header to toggle the new Archive modal.
    * Add a "New Note" button to the header actions.
    * Add the `<dialog>` modals for `archive-dialog` and `note-dialog`.
  * **Test:** Open `index.html` in browser, verify new layout with sidebar, main content area, and header actions.

* [x] **Step 2: Update CSS styling for sidebar, tags, and notes**
  * **Files:** `style.css`
  * **Description:** 
    * Add styles for the two-column grid.
    * Add tag capsule styling (rounded pills, hover glows, and selected highlighted states).
    * Add compact card styling for notes in the sidebar.
    * Set up layout scroll limits for the sidebar sections and the main list.
  * **Test:** Verify the styling matches the developer-centric dark/light themes.

### Data Model & Serialization
* [x] **Step 3: Update todo schema and Markdown parsing/serialization**
  * **Files:** `app.js`
  * **Description:** 
    * Modify the todo object schema to capture `createdAt` and `completedAt`.
    * Update `serializeMarkdown` and `parseMarkdown` to store dates inside the markdown file:
      * Active: `- [ ] Text (Created: YYYY-MM-DDTHH:MM:SSZ)`
      * Archived: `- [x] Text (Created: YYYY-MM-DDTHH:MM:SSZ, Completed: YYYY-MM-DDTHH:MM:SSZ)`
      * Notes: `- Text (Created: YYYY-MM-DDTHH:MM:SSZ)` (written under a `## Notes` section).
  * **Test:** Verify that tasks created or completed preserve these dates in local storage and write them to the Markdown file.

### Functional Components
* [x] **Step 4: Implement Archive Modal & Notes Component**
  * **Files:** `app.js`
  * **Description:**
    * Add event listener for `Cmd+N` / `Ctrl+N` to open the Note dialog and focus the note textarea. Support `Ctrl+Enter` / `Cmd+Enter` to save the note.
    * Render notes in the sidebar list.
    * Render completed todos in the Archive modal, sorted by completion date (`completedAt` descending).
    * Display readable dates next to active todos (creation date) and archived todos (completion date).
  * **Test:** Add notes, verify they save and render in the sidebar. Mark todos complete, open Archive modal, verify they are listed with completion dates.

* [x] **Step 5: Implement Tag Cloud and Filtering System**
  * **Files:** `app.js`
  * **Description:**
    * Add a parser that extracts hashtags (`#\w+`) from active todo text, archived todo text, and note text.
    * Render all unique tags in the sidebar Tag Cloud with item counts (e.g. `#dev (3)`).
    * Clicking a tag filters all lists (Active, Archived, Notes) to only show matches. Highlight the active tag and display a "Clear Filter" button.
  * **Test:** Create a todo with `#work` and a note with `#work`. Click `#work` in the tag cloud, verify both lists filter to only show items containing `#work`. Click clear, verify lists reset.
