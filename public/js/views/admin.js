// admin.js - Admin & Panchayat Official Command Center
export function renderAdmin(container, subRoute = 'dashboard', state, api, showToast, showModal, closeModal, onNavigate) {
  const { currentUser } = state;

  let activeTab = subRoute;

  function renderFrame() {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Panchayat Command Center</h1>
          <div class="page-subtitle">
            Officer: <strong>${currentUser.name}</strong> &bull; Gram Panchayat Shanti Nagar Administrative Operations
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-outline btn-sm" id="btn-admin-refresh">🔄 Refresh Data</button>
        </div>
      </div>

      <!-- Admin Navigation Tabs -->
      <div style="display: flex; gap: 0.5rem; border-bottom: 2px solid var(--border-color); margin-bottom: 1.5rem; overflow-x: auto;">
        <button class="btn btn-outline btn-sm admin-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
          📊 Dashboard
        </button>
        <button class="btn btn-outline btn-sm admin-nav-btn ${activeTab === 'requests' ? 'active' : ''}" data-tab="requests">
          📋 Pickup Requests
        </button>
        <button class="btn btn-outline btn-sm admin-nav-btn ${activeTab === 'drivers' ? 'active' : ''}" data-tab="drivers">
          🚛 Drivers &amp; Fleet
        </button>
        <button class="btn btn-outline btn-sm admin-nav-btn ${activeTab === 'citizens' ? 'active' : ''}" data-tab="citizens">
          👥 Citizen Directory
        </button>
        <button class="btn btn-outline btn-sm admin-nav-btn ${activeTab === 'tracking' ? 'active' : ''}" data-tab="tracking">
          📍 Live Fleet Map
        </button>
        <button class="btn btn-outline btn-sm admin-nav-btn ${activeTab === 'routes' ? 'active' : ''}" data-tab="routes">
          🛣️ Route Optimizer
        </button>
        <button class="btn btn-outline btn-sm admin-nav-btn ${activeTab === 'complaints' ? 'active' : ''}" data-tab="complaints">
          ⚠️ Complaints Desk
        </button>
      </div>

      <div id="admin-tab-content">
        <div style="text-align: center; padding: 2rem;">
          <div class="loading-spinner"></div>
        </div>
      </div>
    `;

    container.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.onclick = () => {
        activeTab = btn.getAttribute('data-tab');
        container.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadTabContent();
      };
    });

    const refreshBtn = container.querySelector('#btn-admin-refresh');
    if (refreshBtn) refreshBtn.onclick = () => loadTabContent();

    loadTabContent();
  }

  async function loadTabContent() {
    const content = container.querySelector('#admin-tab-content');
    if (!content) return;

    if (activeTab === 'dashboard') {
      await loadDashboard(content);
    } else if (activeTab === 'requests') {
      await loadRequests(content);
    } else if (activeTab === 'drivers') {
      await loadDrivers(content);
    } else if (activeTab === 'citizens') {
      await loadCitizens(content);
    } else if (activeTab === 'tracking') {
      await loadTrackingMap(content);
    } else if (activeTab === 'routes') {
      await loadRoutes(content);
    } else if (activeTab === 'complaints') {
      await loadComplaints(content);
    }
  }

  // ==========================================
  // 1. ADMIN DASHBOARD
  // ==========================================
  async function loadDashboard(target) {
    try {
      const statsRes = await api('/api/stats');
      const m = statsRes.metrics;

      target.innerHTML = `
        <!-- 8 Stat Cards -->
        <div class="grid-cards" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
          <div class="stat-card">
            <div>
              <div class="stat-label">Total Citizens</div>
              <div class="stat-val">${m.totalCitizens}</div>
            </div>
            <div class="stat-icon-wrapper stat-icon-blue">👥</div>
          </div>

          <div class="stat-card">
            <div>
              <div class="stat-label">Registered Drivers</div>
              <div class="stat-val">${m.totalDrivers}</div>
            </div>
            <div class="stat-icon-wrapper stat-icon-green">🚛</div>
          </div>

          <div class="stat-card">
            <div>
              <div class="stat-label">Total Requests</div>
              <div class="stat-val">${m.totalPickups}</div>
            </div>
            <div class="stat-icon-wrapper stat-icon-blue">📦</div>
          </div>

          <div class="stat-card">
            <div>
              <div class="stat-label">Pending Requests</div>
              <div class="stat-val">${m.pendingPickups}</div>
            </div>
            <div class="stat-icon-wrapper stat-icon-amber">⏳</div>
          </div>

          <div class="stat-card">
            <div>
              <div class="stat-label">Verified Requests</div>
              <div class="stat-val">${m.verifiedPickups}</div>
            </div>
            <div class="stat-icon-wrapper stat-icon-purple">📋</div>
          </div>

          <div class="stat-card">
            <div>
              <div class="stat-label">Active Pickups</div>
              <div class="stat-val">${m.activePickups}</div>
            </div>
            <div class="stat-icon-wrapper stat-icon-blue">⚡</div>
          </div>

          <div class="stat-card">
            <div>
              <div class="stat-label">Completed Pickups</div>
              <div class="stat-val">${m.completedPickups}</div>
            </div>
            <div class="stat-icon-wrapper stat-icon-green">✅</div>
          </div>

          <div class="stat-card">
            <div>
              <div class="stat-label">Open Complaints</div>
              <div class="stat-val">${m.openComplaints}</div>
            </div>
            <div class="stat-icon-wrapper stat-icon-amber">⚠️</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
          <!-- Quick Action Shortcuts -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">⚡ Operational Shortcuts</h3>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <button class="btn btn-outline" id="dash-btn-requests" style="justify-content: flex-start; padding: 0.85rem;">
                📋 <strong>Process Pickup Queue</strong> (${m.pendingPickups} pending verification)
              </button>
              <button class="btn btn-outline" id="dash-btn-map" style="justify-content: flex-start; padding: 0.85rem;">
                📍 <strong>Live Vehicle Map</strong> (Monitor active Panchayat tippers)
              </button>
              <button class="btn btn-outline" id="dash-btn-complaints" style="justify-content: flex-start; padding: 0.85rem;">
                ⚠️ <strong>Grievance Redressal Desk</strong> (${m.openComplaints} pending review)
              </button>
            </div>
          </div>

          <!-- Waste Categories Distribution -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">♻️ Waste Stream Breakdown</h3>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              ${(statsRes.wasteCategories || []).map(wc => `
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.25rem;">
                    <span><strong>${wc.waste_type}</strong></span>
                    <span>${wc.count} requests</span>
                  </div>
                  <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; width: ${Math.min(100, (wc.count / (m.totalPickups || 1)) * 100)}%; background: #16a34a;"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      target.querySelector('#dash-btn-requests').onclick = () => { activeTab = 'requests'; renderFrame(); };
      target.querySelector('#dash-btn-map').onclick = () => { activeTab = 'tracking'; renderFrame(); };
      target.querySelector('#dash-btn-complaints').onclick = () => { activeTab = 'complaints'; renderFrame(); };

    } catch (err) {
      target.innerHTML = `<div class="card" style="color: red;">Error: ${err.message}</div>`;
    }
  }

  // ==========================================
  // 2. ADMIN PICKUP REQUESTS MANAGEMENT
  // ==========================================
  async function loadRequests(target) {
    try {
      const [pickupsRes, driversRes] = await Promise.all([
        api('/api/pickups'),
        api('/api/drivers')
      ]);

      const pickups = pickupsRes.pickups || [];
      const drivers = (driversRes.drivers || []).filter(d => d.is_active === 1);

      target.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">📋 Central Pickup Requests Management</h2>
              <p style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">
                Verify citizen submissions, allocate drivers, and review digital completion proofs.
              </p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <select id="filter-pickup-status" class="form-select" style="width: auto; font-size: 0.8rem;">
                <option value="ALL">All Statuses (${pickups.length})</option>
                <option value="Requested">Requested</option>
                <option value="Verified">Verified</option>
                <option value="Driver Assigned">Driver Assigned</option>
                <option value="Driver On The Way">Driver On The Way</option>
                <option value="Arrived">Arrived</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Citizen</th>
                  <th>Waste Type</th>
                  <th>Quantity</th>
                  <th>Location</th>
                  <th>Date &amp; Slot</th>
                  <th>Status</th>
                  <th>Assigned Driver</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="pickups-table-body">
                <!-- Injected via renderTableRows -->
              </tbody>
            </table>
          </div>
        </div>
      `;

      const tbody = target.querySelector('#pickups-table-body');
      const filterSelect = target.querySelector('#filter-pickup-status');

      function renderTableRows(filterStatus = 'ALL') {
        const filtered = filterStatus === 'ALL' ? pickups : pickups.filter(p => p.status === filterStatus);

        if (filtered.length === 0) {
          tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #64748b;">No pickup requests matching this filter.</td></tr>`;
          return;
        }

        tbody.innerHTML = filtered.map(p => `
          <tr>
            <td><strong>#${p.id}</strong></td>
            <td>
              <strong>${p.citizen_name}</strong><br>
              <small style="color: #64748b;">${p.citizen_phone || ''}</small>
            </td>
            <td>${p.waste_type}</td>
            <td>${p.quantity}</td>
            <td style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.address}</td>
            <td>${p.scheduled_date}<br><small style="color: #64748b;">${p.preferred_time}</small></td>
            <td><span class="badge badge-${p.status.toLowerCase().replace(/ /g, '-')}">${p.status}</span></td>
            <td>
              ${p.driver_name ? `
                <strong>${p.driver_name}</strong><br>
                <small style="color: #64748b;">${p.vehicle_type || 'Tipper'}</small>
              ` : '<span style="color:#eab308; font-weight: 600;">Unassigned</span>'}
            </td>
            <td>
              <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                ${p.status === 'Requested' ? `
                  <button class="btn btn-primary btn-sm btn-verify-req" data-id="${p.id}">
                    Verify
                  </button>
                ` : ''}

                ${p.status === 'Verified' || p.status === 'Requested' || p.status === 'Driver Assigned' ? `
                  <button class="btn btn-warning btn-sm btn-assign-req" data-id="${p.id}">
                    ${p.driver_name ? 'Reassign' : 'Assign Driver'}
                  </button>
                ` : ''}

                <button class="btn btn-outline btn-sm btn-view-req" data-id="${p.id}">
                  Audit Details
                </button>
              </div>
            </td>
          </tr>
        `).join('');

        // Action Handlers
        tbody.querySelectorAll('.btn-verify-req').forEach(btn => {
          btn.onclick = async () => {
            const id = btn.getAttribute('data-id');
            try {
              await api(`/api/pickups/${id}/verify`, 'PUT');
              showToast(`Request #${id} marked as Verified!`, 'success');
              loadRequests(target);
            } catch (err) {
              showToast(err.message, 'error');
            }
          };
        });

        tbody.querySelectorAll('.btn-assign-req').forEach(btn => {
          btn.onclick = () => {
            const id = btn.getAttribute('data-id');
            const pickup = pickups.find(p => p.id === id);
            openAssignDriverModal(pickup, drivers, () => loadRequests(target));
          };
        });

        tbody.querySelectorAll('.btn-view-req').forEach(btn => {
          btn.onclick = () => {
            const id = btn.getAttribute('data-id');
            const pickup = pickups.find(p => p.id === id);
            openAuditModal(pickup);
          };
        });
      }

      filterSelect.onchange = (e) => renderTableRows(e.target.value);
      renderTableRows('ALL');

    } catch (err) {
      target.innerHTML = `<div class="card" style="color: red;">Error: ${err.message}</div>`;
    }
  }

  // Assign Driver Modal
  function openAssignDriverModal(pickup, availableDrivers, onSuccess) {
    const modalContent = `
      <div style="font-size: 0.9rem; color: #475569; margin-bottom: 1rem;">
        Assign an active Gram Panchayat driver to Request <strong>#${pickup.id}</strong> (${pickup.waste_type}, ${pickup.quantity}).
        <br>
        <strong>Address:</strong> ${pickup.address} &bull; ${pickup.scheduled_date}
      </div>

      <div class="form-group">
        <label class="form-label" for="select-assign-driver">Select Available Driver &amp; Vehicle *</label>
        <select id="select-assign-driver" class="form-select">
          ${availableDrivers.map(d => `
            <option value="${d.id}" ${pickup.assigned_driver_id === d.id ? 'selected' : ''}>
              ${d.name} &bull; ${d.vehicle_type} (${d.vehicle_number}) &bull; [${d.active_assignments} active stops]
            </option>
          `).join('')}
        </select>
      </div>
    `;

    showModal(
      '🚛 Assign Driver & Vehicle',
      modalContent,
      [
        { text: 'Cancel', class: 'btn-outline', onClick: closeModal },
        {
          text: 'Confirm Driver Assignment',
          class: 'btn-primary',
          onClick: async () => {
            const driverId = parseInt(document.getElementById('select-assign-driver').value, 10);
            try {
              await api(`/api/pickups/${pickup.id}/assign`, 'PUT', { driverId });
              closeModal();
              showToast(`Driver successfully assigned to #${pickup.id}`, 'success');
              if (onSuccess) onSuccess();
            } catch (err) {
              showToast(err.message, 'error');
            }
          }
        }
      ]
    );
  }

  // Audit Pickup Details Modal
  function openAuditModal(pickup) {
    const modalContent = `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.875rem;">
        <div style="display: flex; justify-content: space-between;">
          <strong>Request ID:</strong> <span>#${pickup.id}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <strong>Status:</strong> <span class="badge badge-${pickup.status.toLowerCase().replace(/ /g, '-')}">${pickup.status}</span>
        </div>
        <div><strong>Citizen:</strong> ${pickup.citizen_name} (${pickup.citizen_phone || 'N/A'})</div>
        <div><strong>Doorstep Address:</strong> ${pickup.address}</div>
        <div><strong>Waste Specifications:</strong> ${pickup.waste_type} &bull; ${pickup.quantity}</div>
        <div><strong>Slot:</strong> ${pickup.scheduled_date} &bull; ${pickup.preferred_time}</div>
        <div><strong>Assigned Driver:</strong> ${pickup.driver_name ? `${pickup.driver_name} (${pickup.vehicle_type || 'Tipper'} - ${pickup.vehicle_number})` : 'None'}</div>

        <hr style="border: none; border-top: 1px solid var(--border-color); margin: 0.5rem 0;">

        <!-- Citizen Photo -->
        <div>
          <strong style="font-size: 0.85rem;">Citizen Waste Photo:</strong>
          ${pickup.citizen_photo_url ? `
            <img src="${pickup.citizen_photo_url}" style="width: 100%; max-height: 180px; object-fit: cover; border-radius: 6px; margin-top: 0.25rem;" alt="Waste">
          ` : '<p style="color:#94a3b8;">No photo uploaded</p>'}
        </div>

        <!-- Driver Proof Photo -->
        <div>
          <strong style="font-size: 0.85rem;">Driver Completion Proof:</strong>
          ${pickup.completion_proof_url ? `
            <img src="${pickup.completion_proof_url}" style="width: 100%; max-height: 180px; object-fit: cover; border-radius: 6px; margin-top: 0.25rem;" alt="Proof">
            <div style="font-size: 0.8rem; color: #166534; margin-top: 0.25rem;">
              <strong>Driver Remarks:</strong> ${pickup.completion_notes || 'Cleaned and loaded'}
            </div>
          ` : '<p style="color:#94a3b8;">Pending completion proof</p>'}
        </div>
      </div>
    `;

    showModal(`Audit Record: #${pickup.id}`, modalContent, [{ text: 'Close', class: 'btn-outline', onClick: closeModal }]);
  }

  // ==========================================
  // 3. DRIVERS & FLEET MANAGEMENT
  // ==========================================
  async function loadDrivers(target) {
    try {
      const res = await api('/api/drivers');
      const drivers = res.drivers || [];

      target.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">🚛 Gram Panchayat Sanitation Fleet &amp; Drivers</h2>
              <p style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">
                Manage existing Panchayat vehicles, drivers, and monitor individual completion ratios.
              </p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-add-driver">
              ➕ Add New Driver
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>Contact Mobile</th>
                  <th>Vehicle Type &amp; Plate</th>
                  <th>License #</th>
                  <th>Active Workload</th>
                  <th>Total Completed</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${drivers.map(d => `
                  <tr>
                    <td><strong>${d.name}</strong></td>
                    <td>${d.phone || '+91 94123 45678'}</td>
                    <td>
                      <strong>${d.vehicle_type}</strong><br>
                      <code>${d.vehicle_number}</code>
                    </td>
                    <td><small style="color: #64748b;">${d.license_number || 'DL-VALID'}</small></td>
                    <td><span class="badge badge-driver-assigned">${d.active_assignments} stops</span></td>
                    <td><strong>${d.completed_count}</strong></td>
                    <td>
                      ${d.is_active ? `
                        <span class="badge badge-completed">Active / On Duty</span>
                      ` : '<span class="badge badge-pending">Offline / Inactive</span>'}
                    </td>
                    <td>
                      <button class="btn btn-outline btn-sm btn-toggle-driver-status" data-id="${d.id}">
                        ${d.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      target.querySelectorAll('.btn-toggle-driver-status').forEach(btn => {
        btn.onclick = async () => {
          const id = btn.getAttribute('data-id');
          try {
            await api(`/api/drivers/${id}/toggle-active`, 'PUT');
            showToast('Driver status toggled successfully', 'success');
            loadDrivers(target);
          } catch (err) {
            showToast(err.message, 'error');
          }
        };
      });

      target.querySelector('#btn-add-driver').onclick = () => openAddDriverModal(() => loadDrivers(target));

    } catch (err) {
      target.innerHTML = `<div class="card" style="color: red;">Error: ${err.message}</div>`;
    }
  }

  function openAddDriverModal(onSuccess) {
    const modalContent = `
      <form id="add-driver-form">
        <div class="form-group">
          <label class="form-label" for="new-driver-name">Driver Full Name *</label>
          <input type="text" id="new-driver-name" class="form-control" placeholder="e.g. Ramdas Yadav" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="new-driver-email">Email Address *</label>
            <input type="email" id="new-driver-email" class="form-control" placeholder="driver@echoroute.gov.in" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="new-driver-phone">Mobile Phone *</label>
            <input type="text" id="new-driver-phone" class="form-control" placeholder="+91 94123 00000" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="new-driver-pass">Initial Password *</label>
          <input type="password" id="new-driver-pass" class="form-control" value="driver123" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="new-driver-veh">Vehicle Type *</label>
            <select id="new-driver-veh" class="form-select" required>
              <option value="Tata Ace Tipper (1.5 Ton)">Tata Ace Tipper (1.5 Ton)</option>
              <option value="Mahindra Bolero Pickup (1.8 Ton)">Mahindra Bolero Pickup (1.8 Ton)</option>
              <option value="E-Rickshaw Loader (500 Kg)">E-Rickshaw Loader (500 Kg)</option>
              <option value="Tractor-Trolley (3 Ton)">Tractor-Trolley (3 Ton)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="new-driver-plate">Vehicle Plate # *</label>
            <input type="text" id="new-driver-plate" class="form-control" placeholder="DL-04-E-9999" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="new-driver-license">Driving License #</label>
          <input type="text" id="new-driver-license" class="form-control" placeholder="DL-2022-XXXXXX">
        </div>
      </form>
    `;

    showModal('➕ Register New Panchayat Driver', modalContent, [
      { text: 'Cancel', class: 'btn-outline', onClick: closeModal },
      {
        text: 'Save Driver',
        class: 'btn-primary',
        onClick: async () => {
          const name = document.getElementById('new-driver-name').value.trim();
          const email = document.getElementById('new-driver-email').value.trim();
          const phone = document.getElementById('new-driver-phone').value.trim();
          const password = document.getElementById('new-driver-pass').value;
          const vehicleType = document.getElementById('new-driver-veh').value;
          const vehicleNumber = document.getElementById('new-driver-plate').value.trim();
          const licenseNumber = document.getElementById('new-driver-license').value.trim();

          if (!name || !email || !password || !vehicleNumber) {
            showToast('Please fill all required fields', 'error');
            return;
          }

          try {
            await api('/api/drivers', 'POST', {
              name, email, phone, password, vehicleType, vehicleNumber, licenseNumber
            });
            closeModal();
            showToast(`Driver ${name} created successfully!`, 'success');
            if (onSuccess) onSuccess();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      }
    ]);
  }

  // ==========================================
  // 4. CITIZEN DIRECTORY
  // ==========================================
  async function loadCitizens(target) {
    try {
      const res = await api('/api/citizens');
      const citizens = res.citizens || [];

      target.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">👥 Registered Panchayat Citizens (${citizens.length})</h2>
              <p style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">
                Village residents enrolled in doorstep waste pickup services.
              </p>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Citizen Name</th>
                  <th>Contact Info</th>
                  <th>Village Ward &amp; Address</th>
                  <th>Registered On</th>
                  <th>Total Requests</th>
                  <th>Completed</th>
                  <th>Active Requests</th>
                </tr>
              </thead>
              <tbody>
                ${citizens.map(c => `
                  <tr>
                    <td><strong>${c.name}</strong></td>
                    <td>
                      ${c.email}<br>
                      <small style="color: #64748b;">${c.phone || '+91 98111 22334'}</small>
                    </td>
                    <td>
                      <strong>${c.village_ward || 'Ward 4'}</strong><br>
                      <small style="color: #64748b;">${c.address || 'Shanti Nagar'}</small>
                    </td>
                    <td>${new Date(c.created_at).toLocaleDateString()}</td>
                    <td><strong>${c.total_requests}</strong></td>
                    <td><span class="badge badge-completed">${c.completed_requests}</span></td>
                    <td>
                      ${c.active_requests > 0 ? `
                        <span class="badge badge-driver-assigned">${c.active_requests} in progress</span>
                      ` : '<span style="color:#94a3b8;">0</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      target.innerHTML = `<div class="card" style="color: red;">Error: ${err.message}</div>`;
    }
  }

  // ==========================================
  // 5. LIVE FLEET TRACKING (MAP)
  // ==========================================
  async function loadTrackingMap(target) {
    try {
      target.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">📍 Live Fleet &amp; Collection Tracking</h2>
              <p style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">
                Real-time spatial visualization of Gram Panchayat waste vehicles and pickup locations.
              </p>
            </div>
            <span class="badge badge-under-review" style="font-size: 0.8rem;">
              ⚠️ Prototype GPS Simulation &bull; Gram Panchayat Shanti Nagar
            </span>
          </div>

          <div id="admin-map" class="map-frame"></div>

          <div style="margin-top: 1rem; display: flex; gap: 1.5rem; flex-wrap: wrap; font-size: 0.825rem;">
            <div><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:#f59e0b; margin-right:4px;"></span> <strong>Pending Pickup</strong></div>
            <div><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:#2563eb; margin-right:4px;"></span> <strong>Assigned / En Route</strong></div>
            <div><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:#16a34a; margin-right:4px;"></span> <strong>Completed Stop</strong></div>
            <div><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:#7c3aed; margin-right:4px;"></span> <strong>Panchayat MRF Depot Base</strong></div>
          </div>
        </div>
      `;

      const [pickupsRes, driversRes] = await Promise.all([
        api('/api/pickups'),
        api('/api/drivers')
      ]);

      const pickups = pickupsRes.pickups || [];
      const drivers = driversRes.drivers || [];

      setTimeout(() => {
        if (typeof L === 'undefined') return;

        const depotLat = 28.5355;
        const depotLng = 77.3910;
        const map = L.map('admin-map').setView([depotLat, depotLng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Depot Marker
        L.marker([depotLat, depotLng]).addTo(map).bindPopup(`
          <b>🏢 Gram Panchayat MRF Yard &amp; Depot</b><br>
          Central Operations Center
        `).openPopup();

        // Driver markers
        drivers.forEach(d => {
          if (d.current_lat && d.current_lng) {
            L.circleMarker([d.current_lat, d.current_lng], {
              radius: 9,
              fillColor: '#7c3aed',
              color: '#ffffff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.9
            }).addTo(map).bindPopup(`
              <b>🚛 ${d.name}</b> (${d.vehicle_type})<br>
              Plate: <code>${d.vehicle_number}</code><br>
              Active Stops: ${d.active_assignments}<br>
              <em>* Prototype simulated GPS coordinate</em>
            `);
          }
        });

        // Pickup markers
        pickups.forEach(p => {
          let color = '#f59e0b';
          if (p.status === 'Completed') color = '#16a34a';
          else if (p.status.includes('Driver') || p.status === 'Arrived') color = '#2563eb';

          L.circleMarker([p.latitude || depotLat, p.longitude || depotLng], {
            radius: 7,
            fillColor: color,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(map).bindPopup(`
            <b>#${p.id} - ${p.citizen_name}</b><br>
            ${p.waste_type} (${p.quantity})<br>
            📍 ${p.address}<br>
            Status: <b>${p.status}</b><br>
            Driver: ${p.driver_name || 'Unassigned'}
          `);
        });

      }, 100);

    } catch (err) {
      target.innerHTML = `<div class="card" style="color: red;">Error: ${err.message}</div>`;
    }
  }

  // ==========================================
  // 6. ROUTE OPTIMIZATION MODULE
  // ==========================================
  async function loadRoutes(target) {
    try {
      const driversRes = await api('/api/drivers');
      const drivers = driversRes.drivers || [];

      target.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">🛣️ Route Sequencing &amp; Optimization</h2>
              <p style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">
                Calculate optimized stop sequencing to reduce travel time and fuel consumption for Panchayat vehicles.
              </p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <select id="route-select-driver" class="form-select" style="font-size: 0.8rem;">
                ${drivers.map(d => `
                  <option value="${d.id}">${d.name} (${d.vehicle_type})</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div id="route-optimization-content">
            <div class="loading-spinner"></div>
          </div>
        </div>
      `;

      const driverSelect = target.querySelector('#route-select-driver');
      driverSelect.onchange = () => fetchAndRenderRoute(driverSelect.value);

      if (drivers.length > 0) {
        fetchAndRenderRoute(drivers[0].id);
      }

      async function fetchAndRenderRoute(driverId) {
        const subContent = target.querySelector('#route-optimization-content');
        subContent.innerHTML = `<div style="text-align:center; padding:2rem;"><div class="loading-spinner"></div></div>`;

        try {
          const routeRes = await api(`/api/routes/optimize?driverId=${driverId}`);

          subContent.innerHTML = `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <strong style="color: #166534; font-size: 1.05rem;">
                  Route Sequenced for: ${routeRes.driver ? routeRes.driver.name : 'Selected Driver'}
                </strong>
                <div style="font-size: 0.85rem; color: #15803d; margin-top: 0.2rem;">
                  Vehicle: ${routeRes.driver ? routeRes.driver.vehicle_type : 'Tipper'} &bull; ${routeRes.stops ? routeRes.stops.length : 0} Waypoints Scheduled
                </div>
              </div>
              <div style="display: flex; gap: 1rem; font-size: 0.9rem;">
                <div style="background: white; padding: 0.5rem 0.85rem; border-radius: 6px; border: 1px solid #bbf7d0;">
                  <span style="color: #64748b; font-size: 0.75rem;">TOTAL DISTANCE</span><br>
                  <strong>${routeRes.totalDistanceKm || 0} km</strong>
                </div>
                <div style="background: white; padding: 0.5rem 0.85rem; border-radius: 6px; border: 1px solid #bbf7d0;">
                  <span style="color: #64748b; font-size: 0.75rem;">ROUTE EFFICIENCY GAIN</span><br>
                  <strong style="color: #16a34a;">~${routeRes.fuelSavingsPercent || 24}% (Illustrative Estimate)</strong>
                </div>
              </div>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Waypoint #</th>
                    <th>Request ID</th>
                    <th>Waste Type</th>
                    <th>Quantity</th>
                    <th>Address</th>
                    <th>Est. Distance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${routeRes.stops && routeRes.stops.length > 0 ? routeRes.stops.map(s => `
                    <tr>
                      <td><strong>Stop #${s.stopNumber}</strong></td>
                      <td>#${s.pickup.id}</td>
                      <td>${s.pickup.waste_type}</td>
                      <td>${s.pickup.quantity}</td>
                      <td>${s.pickup.address}</td>
                      <td>${s.estimatedDistanceKm} km</td>
                      <td><span class="badge badge-${s.pickup.status.toLowerCase().replace(/ /g, '-')}">${s.pickup.status}</span></td>
                    </tr>
                  `).join('') : `
                    <tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: #64748b;">No active stops assigned to this driver.</td></tr>
                  `}
                </tbody>
              </table>
            </div>
          `;
        } catch (e) {
          subContent.innerHTML = `<div style="color:red;">Error: ${e.message}</div>`;
        }
      }

    } catch (err) {
      target.innerHTML = `<div class="card" style="color: red;">Error: ${err.message}</div>`;
    }
  }

  // ==========================================
  // 7. COMPLAINTS MANAGEMENT
  // ==========================================
  async function loadComplaints(target) {
    try {
      const res = await api('/api/complaints');
      const complaints = res.complaints || [];

      target.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">⚠️ Citizen Grievance &amp; Complaint Desk (${complaints.length})</h2>
              <p style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">
                Review reported missed pickups, overflowing village bins, and illegal dumping incidents.
              </p>
            </div>
          </div>

          ${complaints.length > 0 ? `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Grievance ID</th>
                    <th>Reporting Citizen</th>
                    <th>Type</th>
                    <th>Location Landmark</th>
                    <th>Reported On</th>
                    <th>Status</th>
                    <th>Photo Attached</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${complaints.map(c => `
                    <tr>
                      <td><strong>#${c.id}</strong></td>
                      <td>
                        ${c.citizen_name}<br>
                        <small style="color: #64748b;">${c.citizen_phone || ''}</small>
                      </td>
                      <td><strong>${c.type}</strong></td>
                      <td>${c.location}</td>
                      <td>${new Date(c.created_at).toLocaleDateString()}</td>
                      <td><span class="badge badge-${c.status.toLowerCase().replace(/ /g, '-')}">${c.status}</span></td>
                      <td>${c.photo_url ? '<span class="badge badge-completed">✓ Yes</span>' : '<span style="color:#94a3b8">None</span>'}</td>
                      <td>
                        <button class="btn btn-outline btn-sm btn-manage-complaint" data-id="${c.id}">
                          Manage Grievance
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-icon">🎉</div>
              <p>No complaints reported. Zero active grievances.</p>
            </div>
          `}
        </div>
      `;

      target.querySelectorAll('.btn-manage-complaint').forEach(btn => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-id');
          const comp = complaints.find(c => c.id === id);
          openManageComplaintModal(comp, () => loadComplaints(target));
        };
      });

    } catch (err) {
      target.innerHTML = `<div class="card" style="color: red;">Error: ${err.message}</div>`;
    }
  }

  function openManageComplaintModal(comp, onSuccess) {
    const modalContent = `
      <div style="font-size: 0.875rem; color: #334155; margin-bottom: 1rem;">
        <div><strong>Grievance ID:</strong> #${comp.id}</div>
        <div><strong>Citizen:</strong> ${comp.citizen_name} (${comp.citizen_phone || 'N/A'})</div>
        <div><strong>Issue Type:</strong> ${comp.type}</div>
        <div><strong>Location:</strong> ${comp.location}</div>
        <div style="margin-top: 0.5rem; padding: 0.5rem; background: #f8fafc; border-radius: 6px;">
          <strong>Description:</strong><br>${comp.description}
        </div>
        ${comp.photo_url ? `
          <div style="margin-top: 0.5rem;">
            <strong>Attached Photo:</strong><br>
            <img src="${comp.photo_url}" style="width: 100%; max-height: 180px; object-fit: cover; border-radius: 6px; margin-top: 0.25rem;" alt="Complaint">
          </div>
        ` : ''}
      </div>

      <div class="form-group">
        <label class="form-label" for="select-comp-status">Update Resolution Status *</label>
        <select id="select-comp-status" class="form-select">
          <option value="Pending" ${comp.status === 'Pending' ? 'selected' : ''}>Pending Review</option>
          <option value="Under Review" ${comp.status === 'Under Review' ? 'selected' : ''}>Under Review / Field Inspection</option>
          <option value="Assigned" ${comp.status === 'Assigned' ? 'selected' : ''}>Assigned to Sanitation Team</option>
          <option value="Resolved" ${comp.status === 'Resolved' ? 'selected' : ''}>Resolved (Site Cleaned)</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="comp-admin-notes">Administrative Action Notes</label>
        <textarea id="comp-admin-notes" class="form-textarea" rows="2" placeholder="e.g. Dispatched Tata Ace tipper team to clear overflowing market bin.">${comp.admin_notes || ''}</textarea>
      </div>
    `;

    showModal('⚠️ Manage Grievance', modalContent, [
      { text: 'Cancel', class: 'btn-outline', onClick: closeModal },
      {
        text: 'Save Resolution Update',
        class: 'btn-primary',
        onClick: async () => {
          const status = document.getElementById('select-comp-status').value;
          const adminNotes = document.getElementById('comp-admin-notes').value.trim();

          try {
            await api(`/api/complaints/${comp.id}/status`, 'PUT', { status, adminNotes });
            closeModal();
            showToast(`Complaint #${comp.id} updated to ${status}`, 'success');
            if (onSuccess) onSuccess();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      }
    ]);
  }

  renderFrame();
}
