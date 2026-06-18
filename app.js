// --- State Management ---
let state = {
  todos: [], // Array of { id, text, done, createdAt, completedAt }
  notes: [], // Array of { id, text, createdAt }
  selectedIndex: -1, // Currently selected todo index in active list
  activeTagFilter: '', // Active hashtag filter (e.g., '#work')
  fileSha: '', // GitHub file SHA
  settings: {
    pat: '',
    repo: '',
    path: 'todos.md'
  }
};

let isSyncing = false;

// --- DOM Elements ---
const activeListEl = document.getElementById('active-todos-list');
const archivedListEl = document.getElementById('archived-todos-list');
const activeCountEl = document.getElementById('active-count');
const archivedCountEl = document.getElementById('archived-count');
const addBtnEl = document.getElementById('add-todo-btn');
const settingsToggleBtnEl = document.getElementById('settings-toggle-btn');
const settingsDisconnectBtnEl = document.getElementById('settings-disconnect-btn');

// Sidebar Elements
const notesListEl = document.getElementById('notes-list');
const notesCountEl = document.getElementById('notes-count');
const tagCloudEl = document.getElementById('tag-cloud');
const clearTagFilterBtnEl = document.getElementById('clear-tag-filter-btn');

// Header action buttons
const archiveToggleBtnEl = document.getElementById('archive-toggle-btn');
const noteToggleBtnEl = document.getElementById('note-toggle-btn');

// Modals
const taskDialogEl = document.getElementById('task-dialog');
const settingsDialogEl = document.getElementById('settings-dialog');
const noteDialogEl = document.getElementById('note-dialog');
const archiveDialogEl = document.getElementById('archive-dialog');

// Forms
const taskFormEl = document.getElementById('task-form');
const settingsFormEl = document.getElementById('settings-form');
const noteFormEl = document.getElementById('note-form');

// Textareas
const taskContentEl = document.getElementById('task-content');
const noteContentEl = document.getElementById('note-content');

// Settings Fields
const patInputEl = document.getElementById('settings-pat');
const repoInputEl = document.getElementById('settings-repo');
const pathInputEl = document.getElementById('settings-path');
const syncStatusEl = document.getElementById('sync-status');

// --- Helper Functions: Local Storage Persistence ---
function loadLocalData() {
  const localTodos = localStorage.getItem('lazytodo_todos');
  if (localTodos) {
    try {
      state.todos = JSON.parse(localTodos);
    } catch (e) {
      console.error('Error parsing local todos', e);
      state.todos = [];
    }
  }

  const localNotes = localStorage.getItem('lazytodo_notes');
  if (localNotes) {
    try {
      state.notes = JSON.parse(localNotes);
    } catch (e) {
      console.error('Error parsing local notes', e);
      state.notes = [];
    }
  }

  const localSettings = localStorage.getItem('lazytodo_settings');
  if (localSettings) {
    try {
      state.settings = { ...state.settings, ...JSON.parse(localSettings) };
    } catch (e) {
      console.error('Error parsing local settings', e);
    }
  }
}

function saveLocalTodos() {
  localStorage.setItem('lazytodo_todos', JSON.stringify(state.todos));
}

function saveLocalNotes() {
  localStorage.setItem('lazytodo_notes', JSON.stringify(state.notes));
}

function saveLocalSettings() {
  localStorage.setItem('lazytodo_settings', JSON.stringify(state.settings));
}

// --- Dialog / Lightbox Setup & Light Dismiss Fallbacks ---
function openModal(dialog) {
  dialog.showModal();
  if (dialog === taskDialogEl) {
    setTimeout(() => taskContentEl.focus(), 50);
  } else if (dialog === noteDialogEl) {
    setTimeout(() => noteContentEl.focus(), 50);
  }
}

function closeModal(dialog) {
  dialog.close();
  if (dialog === taskDialogEl) {
    taskFormEl.reset();
  } else if (dialog === noteDialogEl) {
    noteFormEl.reset();
  }
}

// Bind close button actions and cancel buttons for all modals
document.querySelectorAll('.modal-dialog').forEach(dialog => {
  const closeBtn = dialog.querySelector('.dialog-close-btn');
  const cancelBtn = dialog.querySelector('.cancel-btn');

  if (closeBtn) closeBtn.addEventListener('click', () => closeModal(dialog));
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal(dialog));

  // Fallback for browsers without closedby="any" (backdrop click detection)
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isClickInside = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isClickInside) {
        closeModal(dialog);
      }
    });
  }
});

// Event Listeners for dialog openers
addBtnEl.addEventListener('click', () => openModal(taskDialogEl));
noteToggleBtnEl.addEventListener('click', () => openModal(noteDialogEl));
archiveToggleBtnEl.addEventListener('click', () => {
  renderTodos(); // Ensure freshest list
  openModal(archiveDialogEl);
});

settingsToggleBtnEl.addEventListener('click', () => {
  patInputEl.value = state.settings.pat || '';
  repoInputEl.value = state.settings.repo || '';
  pathInputEl.value = state.settings.path || 'todos.md';
  openModal(settingsDialogEl);
});

// --- Date Formatting Helper ---
function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + 
         date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// --- Hashtag Parser and Highlighter ---
function extractTags(text) {
  if (!text) return [];
  const matches = text.match(/#\w+/g);
  return matches ? Array.from(new Set(matches.map(t => t.toLowerCase()))) : [];
}

function highlightTags(text) {
  return escapeHtml(text).replace(/#\w+/g, '<span class="hashtag">$&</span>');
}

// --- Tag Cloud Rendering ---
function getTagCounts() {
  const counts = {};
  const items = [...state.todos, ...state.notes];
  items.forEach(item => {
    const tags = extractTags(item.text);
    tags.forEach(tag => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });
  return counts;
}

function renderTagCloud() {
  const counts = getTagCounts();
  tagCloudEl.innerHTML = '';
  
  const tags = Object.keys(counts).sort();
  if (tags.length === 0) {
    tagCloudEl.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-muted);">No tags found. Use #tag in items.</span>';
    clearTagFilterBtnEl.style.display = 'none';
    return;
  }

  clearTagFilterBtnEl.style.display = state.activeTagFilter ? 'inline-block' : 'none';

  tags.forEach(tag => {
    const pill = document.createElement('span');
    pill.className = `tag-pill${tag === state.activeTagFilter ? ' active' : ''}`;
    pill.innerHTML = `${tag} <span class="tag-count">${counts[tag]}</span>`;
    
    pill.addEventListener('click', () => {
      state.activeTagFilter = (state.activeTagFilter === tag) ? '' : tag;
      renderTagCloud();
      renderTodos();
      renderNotes();
    });
    
    tagCloudEl.appendChild(pill);
  });
}

// --- Todo & Notes Rendering ---
function renderTodos() {
  // Filter and sort Active Todos (FIFO order - oldest first)
  let activeTodos = state.todos.filter(t => !t.done);
  if (state.activeTagFilter) {
    activeTodos = activeTodos.filter(t => extractTags(t.text).includes(state.activeTagFilter));
  }
  activeTodos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Filter and sort Archived Todos (newest completed first)
  let archivedTodos = state.todos.filter(t => t.done);
  if (state.activeTagFilter) {
    archivedTodos = archivedTodos.filter(t => extractTags(t.text).includes(state.activeTagFilter));
  }
  archivedTodos.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  // Render Active Column
  activeListEl.innerHTML = '';
  if (activeTodos.length === 0) {
    activeListEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">📋</span>
        <p>${state.activeTagFilter ? 'No active tasks match this tag.' : 'No active tasks.'}</p>
        <small>Press Cmd+C / Ctrl+C to add one!</small>
      </div>
    `;
    state.selectedIndex = -1;
  } else {
    if (state.selectedIndex >= activeTodos.length) {
      state.selectedIndex = activeTodos.length - 1;
    } else if (state.selectedIndex < 0 && activeTodos.length > 0) {
      state.selectedIndex = 0;
    }

    activeTodos.forEach((todo, index) => {
      const card = document.createElement('div');
      card.className = `todo-card${index === state.selectedIndex ? ' selected' : ''}`;
      card.setAttribute('role', 'option');
      card.setAttribute('aria-selected', index === state.selectedIndex ? 'true' : 'false');
      card.dataset.id = todo.id;

      card.innerHTML = `
        <div class="checkbox-wrapper">
          <input type="checkbox" aria-label="Mark task complete">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div style="flex: 1;">
          <div class="todo-text">${highlightTags(todo.text)}</div>
          <div class="todo-meta">
            <span>Created: ${formatDate(todo.createdAt)}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.checkbox-wrapper')) return;
        state.selectedIndex = index;
        renderTodos();
      });

      const checkbox = card.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', () => {
        completeTodo(todo.id);
      });

      activeListEl.appendChild(card);
    });
  }

  // Render Archived Column inside the modal
  archivedListEl.innerHTML = '';
  if (archivedTodos.length === 0) {
    archivedListEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">📦</span>
        <p>No completed tasks found.</p>
      </div>
    `;
  } else {
    archivedTodos.forEach(todo => {
      const card = document.createElement('div');
      card.className = 'todo-card';
      
      card.innerHTML = `
        <div class="checkbox-wrapper">
          <input type="checkbox" checked disabled aria-label="Completed task">
          <svg viewBox="0 0 24 24" style="opacity: 1; transform: scale(1);"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div style="flex: 1;">
          <div class="todo-text" style="text-decoration: line-through; color: var(--text-muted);">${highlightTags(todo.text)}</div>
          <div class="todo-meta">
            <span>Created: ${formatDate(todo.createdAt)}</span>
            <span>•</span>
            <span>Completed: ${formatDate(todo.completedAt)}</span>
          </div>
        </div>
      `;

      archivedListEl.appendChild(card);
    });
  }

  // Update Counters
  activeCountEl.textContent = activeTodos.length;
  // Calculate total counts (ignoring active tag filters for global header indicators)
  const totalArchived = state.todos.filter(t => t.done).length;
  archivedCountEl.textContent = totalArchived;
  document.getElementById('archived-count').textContent = totalArchived;

  scrollSelectedIntoView();
}

function renderNotes() {
  let notes = [...state.notes];
  if (state.activeTagFilter) {
    notes = notes.filter(n => extractTags(n.text).includes(state.activeTagFilter));
  }
  // Sort notes descending (newest on top)
  notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  notesListEl.innerHTML = '';
  if (notes.length === 0) {
    notesListEl.innerHTML = `
      <div class="empty-state" style="height: 100px;">
        <p style="font-size: 0.85rem;">No notes found.</p>
        <small style="font-size: 0.75rem;">Press Cmd+N / Ctrl+N to add one!</small>
      </div>
    `;
  } else {
    notes.forEach(note => {
      const card = document.createElement('div');
      card.className = 'note-card';
      
      card.innerHTML = `
        <div>${highlightTags(note.text)}</div>
        <div class="note-card-footer">
          <span>${formatDate(note.createdAt)}</span>
          <button class="note-delete-btn" data-id="${note.id}" title="Delete Note">Delete</button>
        </div>
      `;

      // Wire up note delete button
      card.querySelector('.note-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNote(note.id);
      });

      notesListEl.appendChild(card);
    });
  }

  notesCountEl.textContent = state.notes.length;
}

function scrollSelectedIntoView() {
  const selectedEl = activeListEl.querySelector('.todo-card.selected');
  if (selectedEl) {
    const parentRect = activeListEl.getBoundingClientRect();
    const elemRect = selectedEl.getBoundingClientRect();
    const isVisible = (elemRect.top >= parentRect.top) && (elemRect.bottom <= parentRect.bottom);
    if (!isVisible) {
      selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

// --- Actions: Add & Archive & Delete ---
function addTodo(text) {
  const newTodo = {
    id: 'todo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    text: text.trim(),
    done: false,
    createdAt: new Date().toISOString()
  };

  state.todos.push(newTodo);
  saveLocalTodos();
  
  // Select newly created todo
  const activeTodos = state.todos.filter(t => !t.done);
  state.selectedIndex = activeTodos.length - 1;

  renderTodos();
  renderTagCloud();

  if (isGitConfigured()) {
    pushToGit();
  }
}

function completeTodo(id) {
  const todoIndex = state.todos.findIndex(t => t.id === id);
  if (todoIndex !== -1) {
    state.todos[todoIndex].done = true;
    state.todos[todoIndex].completedAt = new Date().toISOString();
    saveLocalTodos();
    
    const activeTodosCount = state.todos.filter(t => !t.done).length;
    if (state.selectedIndex >= activeTodosCount) {
      state.selectedIndex = Math.max(0, activeTodosCount - 1);
    }
    
    renderTodos();
    renderTagCloud();

    if (isGitConfigured()) {
      pushToGit();
    }
  }
}

function addNote(text) {
  const newNote = {
    id: 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  state.notes.push(newNote);
  saveLocalNotes();
  
  renderNotes();
  renderTagCloud();

  if (isGitConfigured()) {
    pushToGit();
  }
}

function deleteNote(id) {
  if (confirm('Are you sure you want to delete this note?')) {
    state.notes = state.notes.filter(n => n.id !== id);
    saveLocalNotes();
    
    renderNotes();
    renderTagCloud();

    if (isGitConfigured()) {
      pushToGit();
    }
  }
}

// --- Keyboard Shortcuts Handler ---
window.addEventListener('keydown', (e) => {
  const isAnyModalOpen = taskDialogEl.hasAttribute('open') || 
                         settingsDialogEl.hasAttribute('open') ||
                         noteDialogEl.hasAttribute('open') ||
                         archiveDialogEl.hasAttribute('open');
  
  // 1. Add Task Modal Trigger: Cmd+C / Ctrl+C
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
    if (!isAnyModalOpen) {
      e.preventDefault();
      openModal(taskDialogEl);
    }
  }

  // 2. Add Note Modal Trigger: Cmd+N / Ctrl+N
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
    if (!isAnyModalOpen) {
      e.preventDefault();
      openModal(noteDialogEl);
    }
  }

  // 3. Mark Selected Task Complete: Cmd+D / Ctrl+D
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
    if (!isAnyModalOpen) {
      e.preventDefault();
      const activeTodos = state.todos.filter(t => !t.done);
      activeTodos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      if (state.selectedIndex >= 0 && state.selectedIndex < activeTodos.length) {
        const selectedTodo = activeTodos[state.selectedIndex];
        completeTodo(selectedTodo.id);
      }
    }
  }

  // 4. Navigation: ArrowUp / ArrowDown
  if (!isAnyModalOpen) {
    let activeTodos = state.todos.filter(t => !t.done);
    if (state.activeTagFilter) {
      activeTodos = activeTodos.filter(t => extractTags(t.text).includes(state.activeTagFilter));
    }
    activeTodos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (activeTodos.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        state.selectedIndex = (state.selectedIndex + 1) % activeTodos.length;
        renderTodos();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        state.selectedIndex = (state.selectedIndex - 1 + activeTodos.length) % activeTodos.length;
        renderTodos();
      }
    }
  }
});

// --- Submit Form Handlers ---
taskFormEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskContentEl.value.trim();
  if (text) {
    addTodo(text);
    closeModal(taskDialogEl);
  }
});

// Submit on Ctrl+Enter / Cmd+Enter inside task textarea
taskContentEl.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    taskFormEl.requestSubmit();
  }
});

noteFormEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = noteContentEl.value.trim();
  if (text) {
    addNote(text);
    closeModal(noteDialogEl);
  }
});

// Submit on Ctrl+Enter / Cmd+Enter inside note textarea
noteContentEl.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    noteFormEl.requestSubmit();
  }
});

settingsFormEl.addEventListener('submit', (e) => {
  e.preventDefault();
  state.settings.pat = patInputEl.value.trim();
  state.settings.repo = repoInputEl.value.trim();
  state.settings.path = pathInputEl.value.trim() || 'todos.md';

  saveLocalSettings();
  closeModal(settingsDialogEl);
  updateSyncUI();

  if (isGitConfigured()) {
    pullFromGit();
  }
});

settingsDisconnectBtnEl.addEventListener('click', () => {
  if (confirm('Disconnect GitHub account? Local changes remain but won\'t sync.')) {
    state.settings.pat = '';
    state.settings.repo = '';
    state.settings.path = 'todos.md';
    saveLocalSettings();
    closeModal(settingsDialogEl);
    updateSyncUI();
  }
});

clearTagFilterBtnEl.addEventListener('click', () => {
  state.activeTagFilter = '';
  renderTagCloud();
  renderTodos();
  renderNotes();
});

// --- Utility/Markdown/Base64 Functions ---
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function isGitConfigured() {
  return !!(state.settings.pat && state.settings.repo);
}

function setSyncStatus(status, text) {
  syncStatusEl.className = `sync-status status-${status}`;
  syncStatusEl.querySelector('.status-text').textContent = text;
}

function updateSyncUI() {
  if (isGitConfigured()) {
    setSyncStatus('synced', `Synced with ${state.settings.repo}`);
    settingsDisconnectBtnEl.style.display = 'block';
  } else {
    setSyncStatus('offline', 'Local Storage Mode');
    settingsDisconnectBtnEl.style.display = 'none';
  }
}

// UTF-8 base64 encoding/decoding helpers
function decodeBase64Utf8(str) {
  try {
    return decodeURIComponent(atob(str).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    console.error('Base64 decode error', e);
    return atob(str);
  }
}

function encodeBase64Utf8(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
    return String.fromCharCode(parseInt(p1, 16));
  }));
}

// Markdown Parser (supports Active, Archived, and Notes)
function parseMarkdown(mdText) {
  const lines = mdText.split('\n');
  const parsedTodos = [];
  const parsedNotes = [];
  
  let currentSection = ''; // 'active', 'archived', 'notes'
  
  const activeSectionRegex = /^##\s+Active/i;
  const archivedSectionRegex = /^##\s+Archived/i;
  const notesSectionRegex = /^##\s+Notes/i;
  
  const activeTodoRegex = /^\s*[-*]\s+\[ \]\s+(.+)$/;
  const archivedTodoRegex = /^\s*[-*]\s+\[[xX]\]\s+(.+)$/;
  const noteItemRegex = /^\s*[-*]\s+(.+)$/;
  
  const activeMetaRegex = /^(.+?)\s*\(Created:\s*([^\)]+)\)$/;
  const archivedMetaRegex = /^(.+?)\s*\(Created:\s*([^,]+),\s*Completed:\s*([^\)]+)\)$/;
  const noteMetaRegex = /^(.+?)\s*\(Created:\s*([^\)]+)\)$/;
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;
    
    if (activeSectionRegex.test(trimmedLine)) {
      currentSection = 'active';
      return;
    }
    if (archivedSectionRegex.test(trimmedLine)) {
      currentSection = 'archived';
      return;
    }
    if (notesSectionRegex.test(trimmedLine)) {
      currentSection = 'notes';
      return;
    }
    
    if (currentSection === 'active') {
      const match = line.match(activeTodoRegex);
      if (match) {
        const rawText = match[1];
        const metaMatch = rawText.match(activeMetaRegex);
        let text = rawText;
        let createdAt = new Date().toISOString();
        
        if (metaMatch) {
          text = metaMatch[1];
          createdAt = metaMatch[2];
        }
        
        parsedTodos.push({
          id: 'todo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          text: text.trim(),
          done: false,
          createdAt: createdAt
        });
      }
    } else if (currentSection === 'archived') {
      const match = line.match(archivedTodoRegex);
      if (match) {
        const rawText = match[1];
        const metaMatch = rawText.match(archivedMetaRegex);
        let text = rawText;
        let createdAt = new Date().toISOString();
        let completedAt = new Date().toISOString();
        
        if (metaMatch) {
          text = metaMatch[1];
          createdAt = metaMatch[2];
          completedAt = metaMatch[3];
        } else {
          const activeMetaMatch = rawText.match(activeMetaRegex);
          if (activeMetaMatch) {
            text = activeMetaMatch[1];
            createdAt = activeMetaMatch[2];
            completedAt = createdAt;
          }
        }
        
        parsedTodos.push({
          id: 'todo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          text: text.trim(),
          done: true,
          createdAt: createdAt,
          completedAt: completedAt
        });
      }
    } else if (currentSection === 'notes') {
      const match = line.match(noteItemRegex);
      if (match) {
        const rawText = match[1];
        const metaMatch = rawText.match(noteMetaRegex);
        let text = rawText;
        let createdAt = new Date().toISOString();
        
        if (metaMatch) {
          text = metaMatch[1];
          createdAt = metaMatch[2];
        }
        
        text = text.replace(/<br>/g, '\n');
        
        parsedNotes.push({
          id: 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          text: text.trim(),
          createdAt: createdAt
        });
      }
    }
  });
  
  return { todos: parsedTodos, notes: parsedNotes };
}

// Markdown Serializer (incorporates Active, Archived, and Notes)
function serializeMarkdown(todos, notes) {
  const activeTodos = todos.filter(t => !t.done);
  activeTodos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const archivedTodos = todos.filter(t => t.done);
  archivedTodos.sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt)); // FIFO in completion

  let md = '# Lazytodo\n\n';

  md += '## Active\n';
  if (activeTodos.length === 0) {
    md += '*(No active tasks)*\n';
  } else {
    activeTodos.forEach(todo => {
      md += `- [ ] ${todo.text} (Created: ${todo.createdAt})\n`;
    });
  }

  md += '\n## Archived\n';
  if (archivedTodos.length === 0) {
    md += '*(No archived tasks)*\n';
  } else {
    archivedTodos.forEach(todo => {
      md += `- [x] ${todo.text} (Created: ${todo.createdAt}, Completed: ${todo.completedAt})\n`;
    });
  }

  md += '\n## Notes\n';
  if (notes.length === 0) {
    md += '*(No notes)*\n';
  } else {
    notes.forEach(note => {
      const escapedText = note.text.replace(/\n/g, '<br>');
      md += `- ${escapedText} (Created: ${note.createdAt})\n`;
    });
  }

  return md;
}

// --- GitHub Git-Sync Integration ---
async function pullFromGit() {
  if (!isGitConfigured() || isSyncing) return;
  isSyncing = true;

  setSyncStatus('syncing', 'Fetching from GitHub...');

  const path = state.settings.path;
  const url = `https://api.github.com/repos/${state.settings.repo}/contents/${path}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${state.settings.pat}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('todos.md not found in repository. Initializing new file...');
        state.fileSha = '';
        isSyncing = false;
        await pushToGit();
        return;
      }
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    state.fileSha = data.sha;
    const mdText = decodeBase64Utf8(data.content);
    const remoteData = parseMarkdown(mdText);

    // Merge remote and local todos
    const mergedTodos = [...remoteData.todos];
    state.todos.forEach(localTodo => {
      const exists = remoteData.todos.some(r => r.text.toLowerCase().trim() === localTodo.text.toLowerCase().trim());
      if (!exists) {
        mergedTodos.push(localTodo);
      }
    });

    // Merge remote and local notes
    const mergedNotes = [...remoteData.notes];
    state.notes.forEach(localNote => {
      const exists = remoteData.notes.some(r => r.text.toLowerCase().trim() === localNote.text.toLowerCase().trim());
      if (!exists) {
        mergedNotes.push(localNote);
      }
    });

    state.todos = mergedTodos;
    state.notes = mergedNotes;
    
    saveLocalTodos();
    saveLocalNotes();
    
    renderTodos();
    renderNotes();
    renderTagCloud();
    setSyncStatus('synced', `Synced with ${state.settings.repo}`);

    const localOnlyTodos = state.todos.length - remoteData.todos.length;
    const localOnlyNotes = state.notes.length - remoteData.notes.length;
    if (localOnlyTodos > 0 || localOnlyNotes > 0) {
      isSyncing = false;
      await pushToGit();
      return;
    }
  } catch (error) {
    console.error('GitHub fetch failed:', error);
    setSyncStatus('offline', `Fetch failed: ${error.message || 'Error'}`);
  } finally {
    isSyncing = false;
  }
}

async function pushToGit() {
  if (!isGitConfigured() || isSyncing) return;
  isSyncing = true;

  setSyncStatus('syncing', 'Saving to GitHub...');

  const path = state.settings.path;
  const url = `https://api.github.com/repos/${state.settings.repo}/contents/${path}`;
  const mdText = serializeMarkdown(state.todos, state.notes);
  const base64Content = encodeBase64Utf8(mdText);

  try {
    const body = {
      message: 'chore(todos/notes): Sync via Lazytodo',
      content: base64Content
    };

    if (state.fileSha) {
      body.sha = state.fileSha;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${state.settings.pat}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      if (response.status === 409) {
        console.warn('Conflict detected during push. Performing auto-merge...');
        isSyncing = false;
        await pullFromGit();
        return;
      }
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    state.fileSha = data.content.sha;
    setSyncStatus('synced', `Saved to ${state.settings.repo}`);
  } catch (error) {
    console.error('GitHub save failed:', error);
    setSyncStatus('offline', `Save failed: ${error.message || 'Error'}`);
  } finally {
    isSyncing = false;
  }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  loadLocalData();
  updateSyncUI();
  renderTodos();
  renderNotes();
  renderTagCloud();

  if (isGitConfigured()) {
    pullFromGit();
  }
});
