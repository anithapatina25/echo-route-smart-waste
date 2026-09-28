// login.js - Centralized portal selection and login view
export function renderLogin(container, initialRole = 'citizen', onLoginSuccess, showToast) {
  let activeRole = initialRole || 'citizen';

  const demoAccounts = {
    citizen: {
      email: 'citizen@echoroute.gov.in',
      pass: 'citizen123',
      name: 'Ramesh Patel (Ward 4 Resident)',
      desc: 'Citizen portal for booking pickups, tracking collection, and reporting local waste issues.'
    },
    driver: {
      email: 'driver1@echoroute.gov.in',
      pass: 'driver123',
      name: 'Suresh Kumar (Tata Ace Tipper DL-04-E-1024)',
      desc: 'Driver portal for assigned pickups, optimized route sequencing, and photo completion proof.'
    },
    admin: {
      email: 'admin@echoroute.gov.in',
      pass: 'admin123',
      name: 'Officer Anil Sharma (Panchayat Development Officer)',
      desc: 'Admin command center for verifying requests, dispatching fleet, and live GPS map tracking.'
    }
  };

  function updateView() {
    const demo = demoAccounts[activeRole];

    container.innerHTML = `
      <div class="login-card-container">
        <!-- Logo Header -->
        <div style="text-align: center; margin-bottom: 1.75rem;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: linear-gradient(135deg, #15803d, #166534); color: white; border-radius: 14px; font-size: 1.75rem; margin-bottom: 0.75rem; box-shadow: var(--shadow-md);">
            ♻️
          </div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
            ECHO ROUTE SMART WASTE
          </h2>
          <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.25rem;">
            Panchayat Municipal Waste Management Portal
          </p>
        </div>

        <!-- 3 Role Tabs -->
        <div class="role-tabs">
          <button class="role-tab-btn ${activeRole === 'citizen' ? 'active' : ''}" data-role="citizen">
            🏡 CITIZEN
          </button>
          <button class="role-tab-btn ${activeRole === 'driver' ? 'active' : ''}" data-role="driver">
            🚛 DRIVER
          </button>
          <button class="role-tab-btn ${activeRole === 'admin' ? 'active' : ''}" data-role="admin">
            🏛️ ADMIN
          </button>
        </div>

        <!-- Login Form Card -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <div style="margin-bottom: 1.25rem;">
            <div style="font-size: 1.1rem; font-weight: 700; color: #0f172a; text-transform: capitalize;">
              ${activeRole} Portal Login
            </div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">
              ${demo.desc}
            </div>
          </div>

          <!-- Quick 1-Click Demo Login Box -->
          <div class="demo-login-box">
            <div class="demo-title">⚡ Instant Demo Login (${activeRole.toUpperCase()})</div>
            <div style="font-size: 0.825rem; color: #334155; margin-bottom: 0.6rem;">
              Account: <strong>${demo.name}</strong><br>
              Email: <code>${demo.email}</code> | Pass: <code>${demo.pass}</code>
            </div>
            <button class="btn btn-primary btn-sm w-100" id="btn-quick-login" style="font-size: 0.825rem; padding: 0.45rem;">
              🚀 1-Click Demo Sign In as ${activeRole.toUpperCase()}
            </button>
          </div>

          <!-- Manual Login Form -->
          <form id="login-form">
            <div class="form-group">
              <label class="form-label" for="login-email">Email Address / Username</label>
              <input type="email" id="login-email" class="form-control" placeholder="name@echoroute.gov.in" value="${demo.email}" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <input type="password" id="login-password" class="form-control" placeholder="••••••••" value="${demo.pass}" required>
            </div>

            <button type="submit" class="btn btn-primary w-100" id="btn-submit-login" style="padding: 0.75rem; font-size: 0.95rem;">
              Sign In to ${activeRole.toUpperCase()} Portal
            </button>
          </form>
        </div>

        <div style="text-align: center; font-size: 0.8rem; color: #94a3b8;">
          Gram Panchayat Shanti Nagar &bull; Smart Waste Operations System
        </div>
      </div>
    `;

    // Role Tab click handlers
    container.querySelectorAll('.role-tab-btn').forEach(btn => {
      btn.onclick = () => {
        activeRole = btn.getAttribute('data-role');
        updateView();
      };
    });

    // 1-Click Demo Login button handler
    const quickBtn = container.querySelector('#btn-quick-login');
    if (quickBtn) {
      quickBtn.onclick = () => {
        doLogin(demo.email, demo.pass, activeRole);
      };
    }

    // Form submission
    const form = container.querySelector('#login-form');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const email = container.querySelector('#login-email').value.trim();
        const password = container.querySelector('#login-password').value;
        if (!email || !password) {
          showToast('Please enter your email and password', 'error');
          return;
        }
        doLogin(email, password, activeRole);
      };
    }
  }

  async function doLogin(email, password, requestedRole) {
    const submitBtn = container.querySelector('#btn-submit-login');
    const quickBtn = container.querySelector('#btn-quick-login');
    if (submitBtn) submitBtn.disabled = true;
    if (quickBtn) quickBtn.disabled = true;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, requestedRole })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      showToast(`Welcome, ${data.user.name}!`, 'success');
      onLoginSuccess(data.token, data.user);

    } catch (err) {
      showToast(err.message, 'error');
      if (submitBtn) submitBtn.disabled = false;
      if (quickBtn) quickBtn.disabled = false;
    }
  }

  updateView();
}
