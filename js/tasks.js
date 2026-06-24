import { tasksAPI } from './api.js';
import { showToast, formatDate, isOverdue } from './utils.js';

let tasks = [];
let currentView = 'board';
let filters = { status: '', priority: '', search: '' };
let editingTask = null;

export async function loadTasks() {
  const container = document.getElementById('tasks-area');
  container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
  try {
    tasks = await tasksAPI.getAll(Object.fromEntries(Object.entries(filters).filter(([,v]) => v)));
    renderTasks();
    updateStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

export function renderTasks() {
  const area = document.getElementById('tasks-area');
  if (currentView === 'board') {
    area.innerHTML = renderBoard();
  } else {
    area.innerHTML = renderList();
  }
  bindTaskEvents();
}

function renderBoard() {
  const cols = [
    { key: 'todo', label: 'To Do', dot: 'todo' },
    { key: 'in-progress', label: 'In Progress', dot: 'inprogress' },
    { key: 'completed', label: 'Completed', dot: 'done' },
  ];
  return `<div class="board-columns">
    ${cols.map(col => {
      const colTasks = tasks.filter(t => t.status === col.key);
      return `
      <div class="column">
        <div class="column-header">
          <span class="column-title">
            <span class="col-dot ${col.dot}"></span>${col.label}
          </span>
          <span class="col-count">${colTasks.length}</span>
        </div>
        ${colTasks.length === 0
          ? `<div class="empty-state"><p>No tasks here</p></div>`
          : colTasks.map(t => taskCard(t)).join('')}
      </div>`;
    }).join('')}
  </div>`;
}

function renderList() {
  if (!tasks.length) return `<div class="empty-state"><div class="empty-icon">📋</div><h3>No tasks found</h3><p>Create your first task to get started</p></div>`;
  return `<div class="task-list">${tasks.map(t => taskListItem(t)).join('')}</div>`;
}

function taskCard(t) {
  const due = t.dueDate ? `<span class="task-due ${isOverdue(t.dueDate) ? 'overdue' : ''}">${formatDate(t.dueDate)}</span>` : '';
  return `
  <div class="task-card" data-id="${t._id}">
    <div class="task-title">${t.title}</div>
    ${t.description ? `<div class="task-desc">${t.description}</div>` : ''}
    <div class="task-meta">
      <span class="badge badge-${t.priority}">${t.priority}</span>
      ${due}
    </div>
    <div class="task-actions">
      <button class="btn btn-ghost btn-sm edit-task" data-id="${t._id}">Edit</button>
      <button class="btn btn-danger btn-sm delete-task" data-id="${t._id}">Delete</button>
    </div>
  </div>`;
}

function taskListItem(t) {
  const done = t.status === 'completed';
  return `
  <div class="task-list-item">
    <div class="status-toggle ${done ? 'completed' : ''}" data-id="${t._id}" data-status="${t.status}">
      ${done ? '✓' : ''}
    </div>
    <div class="task-list-title ${done ? 'completed' : ''}">${t.title}</div>
    <span class="badge badge-${t.priority}">${t.priority}</span>
    ${t.dueDate ? `<span class="task-due ${isOverdue(t.dueDate) ? 'overdue' : ''}">${formatDate(t.dueDate)}</span>` : ''}
    <button class="btn btn-ghost btn-sm edit-task" data-id="${t._id}">Edit</button>
    <button class="btn btn-danger btn-sm delete-task" data-id="${t._id}">Delete</button>
  </div>`;
}

function bindTaskEvents() {
  document.querySelectorAll('.edit-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const task = tasks.find(t => t._id === btn.dataset.id);
      showTaskModal(task);
    });
  });
  document.querySelectorAll('.delete-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(btn.dataset.id);
    });
  });
  document.querySelectorAll('.status-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const newStatus = btn.dataset.status === 'completed' ? 'todo' : 'completed';
      updateTask(btn.dataset.id, { status: newStatus });
    });
  });
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    await tasksAPI.remove(id);
    showToast('Task deleted', 'success');
    loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function updateTask(id, updates) {
  try {
    await tasksAPI.update(id, updates);
    loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function updateStats() {
  try {
    const stats = await tasksAPI.stats();
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-todo').textContent = stats.todo;
    document.getElementById('stat-progress').textContent = stats['in-progress'];
    document.getElementById('stat-done').textContent = stats.completed;
    // Update sidebar counts
    document.getElementById('count-all').textContent = stats.total;
    document.getElementById('count-todo').textContent = stats.todo;
    document.getElementById('count-progress').textContent = stats['in-progress'];
    document.getElementById('count-done').textContent = stats.completed;
  } catch {}
}

export function showTaskModal(task = null) {
  editingTask = task;
  const existing = document.getElementById('task-modal');
  if (existing) existing.remove();

  const dueVal = task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'task-modal';
  modal.innerHTML = `
  <div class="modal">
    <div class="modal-header">
      <h3>${task ? 'Edit Task' : 'New Task'}</h3>
      <button class="modal-close" id="close-modal">✕</button>
    </div>
    <div class="form-group">
      <label>Title *</label>
      <input type="text" id="t-title" placeholder="Task title" value="${task?.title || ''}" required>
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="t-desc" placeholder="Optional description...">${task?.description || ''}</textarea>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
      <div class="form-group">
        <label>Status</label>
        <select id="t-status">
          <option value="todo" ${task?.status==='todo'?'selected':''}>To Do</option>
          <option value="in-progress" ${task?.status==='in-progress'?'selected':''}>In Progress</option>
          <option value="completed" ${task?.status==='completed'?'selected':''}>Completed</option>
        </select>
      </div>
      <div class="form-group">
        <label>Priority</label>
        <select id="t-priority">
          <option value="low" ${task?.priority==='low'?'selected':''}>Low</option>
          <option value="medium" ${(!task||task?.priority==='medium')?'selected':''}>Medium</option>
          <option value="high" ${task?.priority==='high'?'selected':''}>High</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Due Date</label>
      <input type="date" id="t-due" value="${dueVal}">
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="cancel-modal">Cancel</button>
      <button class="btn btn-primary" id="save-task">${task ? 'Save Changes' : 'Create Task'}</button>
    </div>
  </div>`;
  document.body.appendChild(modal);

  document.getElementById('close-modal').addEventListener('click', () => modal.remove());
  document.getElementById('cancel-modal').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  document.getElementById('save-task').addEventListener('click', async () => {
    const title = document.getElementById('t-title').value.trim();
    if (!title) { showToast('Title is required', 'error'); return; }
    const payload = {
      title,
      description: document.getElementById('t-desc').value.trim(),
      status: document.getElementById('t-status').value,
      priority: document.getElementById('t-priority').value,
      dueDate: document.getElementById('t-due').value || null,
    };
    const btn = document.getElementById('save-task');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    try {
      if (task) {
        await tasksAPI.update(task._id, payload);
        showToast('Task updated', 'success');
      } else {
        await tasksAPI.create(payload);
        showToast('Task created', 'success');
      }
      modal.remove();
      loadTasks();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = task ? 'Save Changes' : 'Create Task';
    }
  });
}

export function setView(view) {
  currentView = view;
  document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  renderTasks();
}

export function setFilter(key, value) {
  filters[key] = value;
  loadTasks();
}
