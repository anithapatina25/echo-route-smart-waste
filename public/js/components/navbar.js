// navbar.js - Dynamic role-aware navigation bar
export function renderNavbar(container, state, onNavigate, onLogout, onToggleNotifs) {
  const { currentUser, unreadCount } = state;

  let roleBadgeHtml = '';
  let linksHtml = '';

  if (currentUser) {
    roleBadgeHtml = `<span class="role-badge ${currentUser.role}">${currentUser.role}</span>`;

    if (currentUser.role === 'citizen') {
      linksHtml = `
        <a class="nav-link" data-route="citizen:dashboard">
          <span>📊</span><span class="link-text">Dashboard</span>
        </a>
        <a class="nav-link" data-route="citizen:book">
          <span>📦</span><span class="link-text">Book Pickup</span>
        </a>
        <a class="nav-link" data-route="citizen:pickups">
          <span>📋</span><span class="link-text">My Pickups</span>
        </a>
        <a class="nav-link" data-route="citizen:complaints">
          <span>⚠️</span><span class="link-text">Complaints</span>
        </a>
      `;
    } else if (currentUser.role === 'driver') {
      linksHtml = `
        <a class="nav-link" data-route="driver:dashboard">
          <span>📊</span><span class="link-text">Dashboard</span>
        </a>
        <a class="nav-link" data-route="driver:assignments">
          <span>🚛</span><span class="link-text">My Assignments</span>
        </a>
        <a class="nav-link" data-route="driver:route">
          <span>🗺️</span><span class="link-text">Today's Route</span>
        </a>
        <a class="nav-link" data-route="driver:completed">
          <span>✅</span><span class="link-text">Completed</span>
        </a>
      `;
    } else if (currentUser.role === 'admin') {
      linksHtml = `
        <a class="nav-link" data-route="admin:dashboard">
          <span>📊</span><span class="link-text">Dashboard</span>
        </a>
        <a class="nav-link" data-route="admin:requests">
          <span>📋</span><span class="link-text">Pickups</span>
        </a>
        <a class="nav-link" data-route="admin:drivers">
          <span>🚛</span><span class="link-text">Drivers</span>
        </a>
        <a class="nav-link" data-route="admin:citizens">
          <span>👥</span><span class="link-text">Citizens</span>
        </a>
        <a class="nav-link" data-route="admin:tracking">
          <span>📍</span><span class="link-text">Live Map</span>
        </a>
        <a class="nav-link" data-route="admin:routes">
          <span>🛣️</span><span class="link-text">Routes</span>
        </a>
        <a class="nav-link" data-route="admin:complaints">
          <span>⚠️</span><span class="link-text">Complaints</span>
        </a>
      `;
    }
  } else {
    linksHtml = `
      <a class="nav-link" data-route="landing">Home</a>
      <a class="nav-link" data-route="landing#how-it-works">How It Works</a>
      <a class="nav-link" data-route="landing#benefits">Benefits</a>
      <button class="btn btn-primary btn-sm" id="btn-nav-login">Access Portal</button>
    `;
  }

  container.innerHTML = `
    <div class="brand" id="nav-brand-logo">
      <div class="brand-icon">♻️</div>
      <div class="brand-text">
        <div class="brand-title">ECHO ROUTE SMART WASTE</div>
        <div class="brand-tagline">Smarter Routes. Cleaner Communities.</div>
      </div>
    </div>

    <div class="nav-menu">
      ${linksHtml}

      ${currentUser ? `
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-left: 0.5rem;">
          ${roleBadgeHtml}
          <div style="display: flex; flex-direction: column; text-align: right; line-height: 1.2;">
            <span style="font-size: 0.85rem; font-weight: 600; color: #0f172a;">${currentUser.name}</span>
            <span style="font-size: 0.725rem; color: #64748b;">${currentUser.email}</span>
          </div>

          <!-- Notification Bell -->
          <button class="btn-icon" id="btn-notifs" title="Notifications">
            🔔
            ${unreadCount > 0 ? `<span class="notif-dot"></span>` : ''}
          </button>

          <!-- Logout Button -->
          <button class="btn btn-outline btn-sm" id="btn-logout" title="Logout">
            Logout
          </button>
        </div>
      ` : ''}
    </div>
  `;

  // Attach event listeners
  container.querySelector('#nav-brand-logo').onclick = () => {
    if (currentUser) {
      onNavigate(`${currentUser.role}:dashboard`);
    } else {
      onNavigate('landing');
    }
  };

  container.querySelectorAll('.nav-link[data-route]').forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      onNavigate(link.getAttribute('data-route'));
    };
  });

  const loginBtn = container.querySelector('#btn-nav-login');
  if (loginBtn) {
    loginBtn.onclick = () => onNavigate('login');
  }

  const logoutBtn = container.querySelector('#btn-logout');
  if (logoutBtn) {
    logoutBtn.onclick = onLogout;
  }

  const notifsBtn = container.querySelector('#btn-notifs');
  if (notifsBtn) {
    notifsBtn.onclick = onToggleNotifs;
  }
}
