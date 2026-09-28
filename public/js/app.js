// app.js - Master SPA Router and Application Controller for ECHO ROUTE SMART WASTE
import { renderNavbar } from './components/navbar.js';
import { renderLanding } from './views/landing.js';
import { renderLogin } from './views/login.js';
import { renderCitizen } from './views/citizen.js';
import { renderDriver } from './views/driver.js';
import { renderAdmin } from './views/admin.js';

// Application State
const state = {
  currentUser: null,
  token: localStorage.getItem('echo_token') || null,
  unreadCount: 0,
  notifications: []
};

// UI Containers
const navbarContainer = document.getElementById('navbar-container');
const appContainer = document.getElementById('app');
const toastContainer = document.getElementById('toast-container');
const modalContainer = document.getElementById('modal-container');

// ========================================================
// TOAST NOTIFICATIONS HELPER
// ========================================================
export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? '✅' :
               type === 'error' ? '❌' :
               type === 'warning' ? '⚠️' : 'ℹ️';

  toast.innerHTML = `
    <span>${icon}</span>
    <div style="flex: 1; font-weight: 500; color: #0f172a;">${message}</div>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ========================================================
// MODAL DIALOG HELPER
// ========================================================
export function showModal(title, contentHtml, buttons = []) {
  modalContainer.innerHTML = `
    <div class="modal-overlay" id="global-modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 style="font-size: 1.15rem; font-weight: 700; color: #0f172a;">${title}</h3>
          <button class="btn-icon" id="btn-modal-close" style="border: none; font-size: 1.25rem;">✕</button>
        </div>
        <div class="modal-body">
          ${contentHtml}
        </div>
        ${buttons.length > 0 ? `
          <div class="modal-footer">
            ${buttons.map((b, i) => `
              <button class="btn ${b.class || 'btn-outline'}" id="modal-btn-${i}">
                ${b.text}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;

  document.getElementById('btn-modal-close').onclick = closeModal;
  document.getElementById('global-modal-overlay').onclick = (e) => {
    if (e.target.id === 'global-modal-overlay') closeModal();
  };

  buttons.forEach((b, i) => {
    const btnEl = document.getElementById(`modal-btn-${i}`);
    if (btnEl && b.onClick) {
      btnEl.onclick = b.onClick;
    }
  });
}

export function closeModal() {
  modalContainer.innerHTML = '';
}

// ========================================================
// UNIFIED API REQUEST HELPER
// ========================================================
export async function api(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (state.token) {
    options.headers['Authorization'] = `Bearer ${state.token}`;
  }

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(endpoint, options);
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error || `Request failed with status ${response.status}`);
  }

  return json;
}

// ========================================================
// AUTHENTICATION LIFECYCLE
// ========================================================
async function initAuth() {
  if (state.token) {
    try {
      const res = await api('/api/auth/me');
      state.currentUser = res.user;
      await fetchNotifications();
    } catch (err) {
      console.warn('Session expired or invalid, logging out:', err);
      logout();
      return;
    }
  }
  handleRoute();
}

export function onLoginSuccess(token, user) {
  state.token = token;
  state.currentUser = user;
  localStorage.setItem('echo_token', token);

  fetchNotifications();

  // Redirect to respective role portal
  navigate(`${user.role}:dashboard`);
}

export async function logout() {
  if (state.token) {
    try {
      await api('/api/auth/logout', 'POST');
    } catch (e) {}
  }

  state.token = null;
  state.currentUser = null;
  localStorage.removeItem('echo_token');
  showToast('Logged out successfully.', 'info');
  navigate('login');
}

// ========================================================
// NOTIFICATIONS DESK
// ========================================================
async function fetchNotifications() {
  if (!state.currentUser) return;
  try {
    const res = await api('/api/notifications');
    state.notifications = res.notifications || [];
    state.unreadCount = res.unreadCount || 0;
    updateNavbar();
  } catch (e) {}
}

function openNotificationsModal() {
  const notifsHtml = state.notifications.length > 0 ? `
    <div style="display: flex; justify-content: flex-end; margin-bottom: 0.75rem;">
      <button class="btn btn-outline btn-sm" id="btn-mark-all-read">Mark All as Read</button>
    </div>
    <div style="display: flex; flex-direction: column; gap: 0.65rem; max-height: 400px; overflow-y: auto;">
      ${state.notifications.map(n => `
        <div style="padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); background: ${n.is_read ? '#ffffff' : '#f0fdf4'}; display: flex; gap: 0.65rem; align-items: flex-start;">
          <span style="font-size: 1.1rem;">
            ${n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : '🔔'}
          </span>
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 0.875rem; color: #0f172a;">${n.title}</div>
            <div style="font-size: 0.8rem; color: #475569; margin-top: 0.2rem;">${n.message}</div>
            <div style="font-size: 0.725rem; color: #94a3b8; margin-top: 0.25rem;">
              ${new Date(n.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  ` : `
    <div class="empty-state">
      <div class="empty-icon">🔔</div>
      <p>No new notifications at this time.</p>
    </div>
  `;

  showModal('🔔 Notifications &amp; Alerts', notifsHtml, [{ text: 'Close', class: 'btn-outline', onClick: closeModal }]);

  const markBtn = document.getElementById('btn-mark-all-read');
  if (markBtn) {
    markBtn.onclick = async () => {
      await api('/api/notifications/mark-read', 'POST');
      state.unreadCount = 0;
      state.notifications.forEach(n => n.is_read = 1);
      updateNavbar();
      closeModal();
      showToast('Notifications marked as read.', 'success');
    };
  }
}

// ========================================================
// ROUTING & ACCESS CONTROL GUARD
// ========================================================
export function navigate(route) {
  window.location.hash = route;
}

function updateNavbar() {
  renderNavbar(
    navbarContainer,
    state,
    (route) => navigate(route),
    logout,
    openNotificationsModal
  );
}

function handleRoute() {
  updateNavbar();

  const hash = window.location.hash.replace(/^#\/?/, '') || 'landing';
  const [mainRoute, subParam] = hash.split('?');
  const [rolePrefix, subAction] = mainRoute.split(':');

  // 1. Public Landing Page
  if (mainRoute === 'landing' || mainRoute === '') {
    renderLanding(appContainer, (route) => navigate(route));
    return;
  }

  // 2. Central Login Page
  if (mainRoute === 'login') {
    if (state.currentUser) {
      navigate(`${state.currentUser.role}:dashboard`);
      return;
    }
    const params = new URLSearchParams(subParam || '');
    const initialRole = params.get('role') || 'citizen';
    renderLogin(appContainer, initialRole, onLoginSuccess, showToast);
    return;
  }

  // 3. Protected Route Guards
  if (!state.currentUser) {
    showToast('Please sign in to access this portal.', 'warning');
    navigate('login');
    return;
  }

  // Enforce strict Role-Based Access Control (RBAC)
  if (rolePrefix === 'citizen') {
    if (state.currentUser.role !== 'citizen') {
      showToast(`Access Denied: You are signed in as a ${state.currentUser.role.toUpperCase()}.`, 'error');
      navigate(`${state.currentUser.role}:dashboard`);
      return;
    }
    renderCitizen(appContainer, subAction || 'dashboard', state, api, showToast, navigate);
    return;
  }

  if (rolePrefix === 'driver') {
    if (state.currentUser.role !== 'driver') {
      showToast(`Access Denied: You do not have Driver credentials.`, 'error');
      navigate(`${state.currentUser.role}:dashboard`);
      return;
    }
    renderDriver(appContainer, subAction || 'dashboard', state, api, showToast, showModal, closeModal, navigate);
    return;
  }

  if (rolePrefix === 'admin') {
    if (state.currentUser.role !== 'admin') {
      showToast(`Access Denied: Only Gram Panchayat Admins can access the command center.`, 'error');
      navigate(`${state.currentUser.role}:dashboard`);
      return;
    }
    renderAdmin(appContainer, subAction || 'dashboard', state, api, showToast, showModal, closeModal, navigate);
    return;
  }

  // Fallback
  navigate('landing');
}

// Window Event Listeners
window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', initAuth);

// Poll for notifications and status updates every 20 seconds
setInterval(() => {
  if (state.currentUser) {
    fetchNotifications();
  }
}, 20000);
