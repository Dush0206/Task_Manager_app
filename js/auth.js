import { authAPI } from './api.js';
import { showToast } from './utils.js';

export function initAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    verifyAndLoad();
  } else {
    showAuthPage();
  }
}

async function verifyAndLoad() {
  try {
    const user = await authAPI.me();
    localStorage.setItem('user', JSON.stringify(user));
    import('./app.js').then(m => m.initApp(user));
  } catch {
    localStorage.clear();
    showAuthPage();
  }
}

function showAuthPage() {
  document.getElementById('root').innerHTML = authTemplate();
  bindAuthEvents();
}

function bindAuthEvents() {
  const tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const mode = tab.dataset.tab;
      document.getElementById('name-group').style.display = mode === 'register' ? 'block' : 'none';
      document.getElementById('auth-title').textContent = mode === 'login' ? 'Welcome back' : 'Create account';
      document.getElementById('submit-btn').textContent = mode === 'login' ? 'Sign in' : 'Create account';
    });
  });

  document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const mode = document.querySelector('.auth-tab.active').dataset.tab;
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    const payload = {
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
    };
    if (mode === 'register') payload.name = document.getElementById('name').value;

    try {
      const data = await authAPI[mode](payload);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ _id: data._id, name: data.name, email: data.email }));
      import('./app.js').then(m => m.initApp(data));
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = mode === 'login' ? 'Sign in' : 'Create account';
    }
  });
}

function authTemplate() {
  return `
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-logo">
        <h1>✓ TaskFlow</h1>
        <p>Manage your tasks with clarity</p>
      </div>
      <div class="auth-tabs">
        <button class="auth-tab active" data-tab="login">Sign in</button>
        <button class="auth-tab" data-tab="register">Register</button>
      </div>
      <form id="auth-form">
        <div class="form-group" id="name-group" style="display:none">
          <label>Full Name</label>
          <input type="text" id="name" placeholder="John Doe">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="email" placeholder="you@example.com" required>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="password" placeholder="••••••••" required minlength="6">
        </div>
        <button type="submit" class="btn btn-primary btn-full" id="submit-btn">
          <span id="auth-title">Sign in</span>
        </button>
      </form>
    </div>
  </div>`;
}

export function logout() {
  localStorage.clear();
  showAuthPage();
}
