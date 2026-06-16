import { Octokit } from 'https://esm.sh/@octokit/core';

// --- State Management ---
let state = {
  todos: [], // Array of { id, text, done, createdAt }
  selectedIndex: -1, // Currently selected todo index in active list
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

// Modals
const taskDialogEl = document.getElementById('task-dialog');
const settingsDialogEl = document.getElementById('settings-dialog');
const taskFormEl = document.getElementById('task-form');
const settingsFormEl = document.getElementById('settings-form');
const taskContentEl = document.getElementById('task-content');

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
  } else {
    state.todos = [];
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

function saveLocalSettings() {
  localStorage.setItem('lazytodo_settings', JSON.stringify(state.settings));
}

// --- Dialog / Lightbox Setup & Light Dismiss Fallbacks ---
function openModal(dialog) {
  dialog.showModal();
  // Focus appropriate inputs on show
  if (dialog === taskDialogEl) {
    setTimeout(() => taskContentEl.focus(), 50);
  }
}

function closeModal(dialog) {
  dialog.close();
  // Clear forms on close
  if (dialog === taskDialogEl) {
    taskFormEl.reset();
  }
}

// Bind close button actions and cancel buttons
document.querySelectorAll('.modal-dialog').forEach(dialog => {
  const closeBtn = dialog.querySelector('.dialog-close-btn');
  const cancelBtn = dialog.querySelector('.cancel-btn');

  if (closeBtn) closeBtn.addEventListener('click', () => closeModal(dialog));
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal(dialog));

  // Modern browser Light-Dismiss is handled via `closedby="any"` in HTML.
  // Fallback for browsers (like Safari) that do not yet support `closedby="any"`
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
settingsToggleBtnEl.addEventListener('click', () => {
  // Pre-populate settings form
  patInputEl.value = state.settings.pat || '';
  repoInputEl.value = state.settings.repo || '';
  pathInputEl.value = state.settings.path || 'todos.md';
  openModal(settingsDialogEl);
});

// --- Todo Rendering ---
function renderTodos() {
  // Separate active and archived
  const activeTodos = state.todos.filter(t => !t.done);
  // Sort Active by FIFO (chronological order - oldest at the top)
  activeTodos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const archivedTodos = state.todos.filter(t => t.done);
  // Sort Archived by completed/created date (newest completed at the top)
  archivedTodos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Render Active Column
  activeListEl.innerHTML = '';
  if (activeTodos.length === 0) {
    activeListEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">📋</span>
        <p>No active tasks.</p>
        <small>Press Cmd+C / Ctrl+C to add one!</small>
      </div>
    `;
    state.selectedIndex = -1;
  } else {
    // Maintain or adjust selectedIndex bounds
    if (state.selectedIndex >= activeTodos.length) {
      state.selectedIndex = activeTodos.length - 1;
    } else if (state.selectedIndex < 0 && activeTodos.length > 0) {
      // Default to first item
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
        <div class="todo-text">${escapeHtml(todo.text)}</div>
      `;

      // Handle card click (selects the card)
      card.addEventListener('click', (e) => {
        // Prevent click if clicking checkbox directly (let change event handle it)
        if (e.target.closest('.checkbox-wrapper')) return;
        state.selectedIndex = index;
        renderTodos();
      });

      // Handle checkbox change
      const checkbox = card.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', () => {
        completeTodo(todo.id);
      });

      activeListEl.appendChild(card);
    });
  }

  // Render Archived Column
  archivedListEl.innerHTML = '';
  if (archivedTodos.length === 0) {
    archivedListEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">📦</span>
        <p>Archive is empty.</p>
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
        <div class="todo-text">${escapeHtml(todo.text)}</div>
      `;

      archivedListEl.appendChild(card);
    });
  }

  // Update counters
  activeCountEl.textContent = activeTodos.length;
  archivedCountEl.textContent = archivedTodos.length;

  // Sync scroll positioning if selected element is out of view
  scrollSelectedIntoView();
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

// --- Todo CRUD Actions ---
function addTodo(text) {
  const newTodo = {
    id: 'todo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    text: text.trim(),
    done: false,
    createdAt: new Date().toISOString()
  };

  state.todos.push(newTodo);
  saveLocalTodos();
  
  // Auto select the newly added todo (goes to the bottom in FIFO order)
  const activeTodosCount = state.todos.filter(t => !t.done).length;
  state.selectedIndex = activeTodosCount - 1;

  renderTodos();

  // If sync settings configured, trigger push to Git
  if (isGitConfigured()) {
    pushToGit();
  }
}

function completeTodo(id) {
  const todoIndex = state.todos.findIndex(t => t.id === id);
  if (todoIndex !== -1) {
    state.todos[todoIndex].done = true;
    saveLocalTodos();
    
    // Decrement selectedIndex if we completed the last item
    const activeTodosCount = state.todos.filter(t => !t.done).length;
    if (state.selectedIndex >= activeTodosCount) {
      state.selectedIndex = Math.max(0, activeTodosCount - 1);
    }
    
    renderTodos();

    if (isGitConfigured()) {
      pushToGit();
    }
  }
}

// --- Keyboard Shortcuts Handler ---
window.addEventListener('keydown', (e) => {
  // Check if any modal is open
  const isAnyModalOpen = taskDialogEl.hasAttribute('open') || settingsDialogEl.hasAttribute('open');
  
  // 1. Add Task Modal Trigger: Cmd+C (macOS) / Ctrl+C (Windows/Linux)
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
    if (!isAnyModalOpen) {
      e.preventDefault();
      openModal(taskDialogEl);
    }
  }

  // 2. Mark Selected Task Complete: Cmd+D (macOS) / Ctrl+D (Windows/Linux)
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
    if (!isAnyModalOpen) {
      e.preventDefault();
      const activeTodos = state.todos.filter(t => !t.done);
      // Sort Active by FIFO
      activeTodos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      if (state.selectedIndex >= 0 && state.selectedIndex < activeTodos.length) {
        const selectedTodo = activeTodos[state.selectedIndex];
        completeTodo(selectedTodo.id);
      }
    }
  }

  // 3. Navigation inside active list: ArrowUp / ArrowDown
  if (!isAnyModalOpen) {
    const activeTodos = state.todos.filter(t => !t.done);
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

// Submit Form Handlers
taskFormEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskContentEl.value.trim();
  if (text) {
    addTodo(text);
    closeModal(taskDialogEl);
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
  if (confirm('Are you sure you want to disconnect your GitHub account? Your local changes will remain but won\'t be synced anymore.')) {
    state.settings.pat = '';
    state.settings.repo = '';
    state.settings.path = 'todos.md';
    saveLocalSettings();
    closeModal(settingsDialogEl);
    updateSyncUI();
  }
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

// Markdown Parser
function parseMarkdown(mdText) {
  const lines = mdText.split('\n');
  const parsedTodos = [];
  const taskRegex = /^\s*[-*]\s+\[([ xX])\]\s+(.+)$/;

  lines.forEach(line => {
    const match = line.match(taskRegex);
    if (match) {
      const done = match[1].toLowerCase() === 'x';
      const text = match[2].trim();
      parsedTodos.push({
        id: 'todo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        text: text,
        done: done,
        createdAt: new Date().toISOString()
      });
    }
  });

  return parsedTodos;
}

// Markdown Serializer
function serializeMarkdown(todos) {
  const activeTodos = todos.filter(t => !t.done);
  activeTodos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const archivedTodos = todos.filter(t => t.done);
  archivedTodos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  let md = '# Lazytodo\n\n';

  md += '## Active\n';
  if (activeTodos.length === 0) {
    md += '*(No active tasks)*\n';
  } else {
    activeTodos.forEach(todo => {
      md += `- [ ] ${todo.text}\n`;
    });
  }

  md += '\n## Archived\n';
  if (archivedTodos.length === 0) {
    md += '*(No archived tasks)*\n';
  } else {
    archivedTodos.forEach(todo => {
      md += `- [x] ${todo.text}\n`;
    });
  }

  return md;
}

// --- GitHub Git-Sync Integration ---
async function pullFromGit() {
  if (!isGitConfigured() || isSyncing) return;
  isSyncing = true;

  setSyncStatus('syncing', 'Fetching from GitHub...');

  const [owner, repo] = state.settings.repo.split('/');
  const octokit = new Octokit({ auth: state.settings.pat });

  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path: state.settings.path,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
        'Cache-Control': 'no-cache'
      }
    });

    state.fileSha = response.data.sha;
    const mdText = decodeBase64Utf8(response.data.content);
    const remoteTodos = parseMarkdown(mdText);

    // Merge remote and local (prevent duplicate text)
    const mergedTodos = [...remoteTodos];
    state.todos.forEach(localTodo => {
      const exists = remoteTodos.some(r => r.text.toLowerCase().trim() === localTodo.text.toLowerCase().trim());
      if (!exists) {
        mergedTodos.push(localTodo);
      }
    });

    state.todos = mergedTodos;
    saveLocalTodos();
    renderTodos();
    setSyncStatus('synced', `Synced with ${state.settings.repo}`);

    const localOnlyCount = state.todos.length - remoteTodos.length;
    if (localOnlyCount > 0) {
      isSyncing = false;
      await pushToGit();
      return;
    }
  } catch (error) {
    if (error.status === 404) {
      console.log('todos.md not found in repository. Initializing new file...');
      state.fileSha = '';
      isSyncing = false;
      await pushToGit();
      return;
    } else {
      console.error('GitHub fetch failed:', error);
      setSyncStatus('offline', `Fetch failed: ${error.message || 'Error'}`);
    }
  } finally {
    isSyncing = false;
  }
}

async function pushToGit() {
  if (!isGitConfigured() || isSyncing) return;
  isSyncing = true;

  setSyncStatus('syncing', 'Saving to GitHub...');

  const [owner, repo] = state.settings.repo.split('/');
  const octokit = new Octokit({ auth: state.settings.pat });
  const mdText = serializeMarkdown(state.todos);
  const base64Content = encodeBase64Utf8(mdText);

  try {
    const params = {
      owner,
      repo,
      path: state.settings.path,
      message: 'chore(todos): Update todo list via Lazytodo',
      content: base64Content,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    };

    if (state.fileSha) {
      params.sha = state.fileSha;
    }

    const response = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', params);
    state.fileSha = response.data.content.sha;
    setSyncStatus('synced', `Saved to ${state.settings.repo}`);
  } catch (error) {
    if (error.status === 409) {
      console.warn('Conflict detected during push. Performing auto-merge...');
      isSyncing = false;
      await pullFromGit();
    } else {
      console.error('GitHub save failed:', error);
      setSyncStatus('offline', `Save failed: ${error.message || 'Error'}`);
    }
  } finally {
    isSyncing = false;
  }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  loadLocalData();
  updateSyncUI();
  renderTodos();

  if (isGitConfigured()) {
    pullFromGit();
  }
});
