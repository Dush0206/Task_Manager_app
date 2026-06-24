import { logout } from './auth.js';
import { loadTasks, showTaskModal, setView, setFilter } from './tasks.js';
import { getInitials, debounce } from './utils.js';

export function initApp(user) {
  document.getElementById('root').innerHTML = appTemplate(user);
  bindAppEvents();
  loadTasks();
}

function appTemplate(user) {
  const u = user || JSON.parse(localStorage.getItem('user') || '{}');
  return `
  <div class="app-layout">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">✓ TaskFlow</div>
      <span class="nav-label">Menu</span>
      <div class="nav-item active" data-filter-status="">
        <span>📋</span> All Tasks <span class="count" id="count-all">0</span>
      </div>
      <div class="nav-item" data-filter-status="todo">
        <span>⬜</span> To Do <span class="count" id="count-todo">0</span>
      </div>
      <div class="nav-item" data-filter-status="in-progress">
        <span>🔄</span> In Progress <span class="count" id="count-progress">0</span>
      </div>
      <div class="nav-item" data-filter-status="completed">
        <span>✅</span> Completed <span class="count" id="count-done">0</span>
      </div>
      <div class="sidebar-bottom">
        <div class="user-info">
          <div class="avatar">${getInitials(u.name)}</div>
          <div>
            <div style="font-size:.9rem;font-weight:600">${u.name}</div>
            <div style="font-size:.75rem;color:var(--text-muted)">${u.email}</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-full" id="logout-btn">Sign out</button>
      </div>
    </aside>

    <main class="main-content">
      <div class="topbar">
        <div style="display:flex;align-items:center;gap:1rem">
          <button class="menu-btn" id="menu-btn">☰</button>
          <h2>My Tasks</h2>
        </div>
        <div class="topbar-actions">
          <div class="view-toggle">
            <button class="view-btn active" data-view="board" title="Board view">⊞</button>
            <button class="view-btn" data-view="list" title="List view">☰</button>
          </div>
          <button class="btn btn-primary" id="new-task-btn">+ New Task</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon purple">📋</div>
          <div><div class="stat-num" id="stat-total">0</div><div class="stat-label">Total Tasks</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">⬜</div>
          <div><div class="stat-num" id="stat-todo">0</div><div class="stat-label">To Do</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon yellow">🔄</div>
          <div><div class="stat-num" id="stat-progress">0</div><div class="stat-label">In Progress</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">✅</div>
          <div><div class="stat-num" id="stat-done">0</div><div class="stat-label">Completed</div></div>
        </div>
      </div>

      <div class="filters-bar">
        <input type="search" class="search-input" id="search-input" placeholder="🔍  Search tasks...">
        <select class="filter-select" id="priority-filter">
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div id="tasks-area"></div>
    </main>
  </div>`;
}

function bindAppEvents() {
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('new-task-btn').addEventListener('click', () => showTaskModal());
  document.getElementById('menu-btn')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  document.querySelectorAll('.nav-item[data-filter-status]').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      setFilter('status', item.dataset.filterStatus);
    });
  });

  const debouncedSearch = debounce((val) => setFilter('search', val), 400);
  document.getElementById('search-input').addEventListener('input', (e) => debouncedSearch(e.target.value));
  document.getElementById('priority-filter').addEventListener('change', (e) => setFilter('priority', e.target.value));
}
