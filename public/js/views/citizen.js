// citizen.js - Citizen Portal views and workflow
import { createImagePicker } from '../components/imagePicker.js';

export function renderCitizen(container, subRoute = 'dashboard', state, api, showToast, onNavigate) {
  const { currentUser } = state;

  let activeTab = subRoute;
  let selectedPickupId = null;

  // Check if subRoute has tracking parameter e.g. "track:ER-2026-0001"
  if (subRoute.startsWith('track')) {
    const parts = subRoute.split(':');
    activeTab = 'track';
    if (parts[1]) selectedPickupId = parts[1];
  }

  function renderFrame() {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Citizen Waste Services</h1>
          <div class="page-subtitle">
            Welcome back, <strong>${currentUser.name}</strong> &bull; ${currentUser.profile ? currentUser.profile.village_ward : 'Gram Panchayat Shanti Nagar'}
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-primary" id="btn-quick-book">
            ➕ Book New Pickup
          </button>
          <button class="btn btn-outline" id="btn-quick-complaint">
            ⚠️ Report Waste Issue
          </button>
        </div>
      </div>

      <!-- Citizen Navigation Tabs -->
      <div style="display: flex; gap: 0.5rem; border-bottom: 2px solid var(--border-color); margin-bottom: 1.5rem; overflow-x: auto;">
        <button class="btn btn-outline btn-sm citizen-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
          📊 Dashboard
        </button>
        <button class="btn btn-outline btn-sm citizen-nav-btn ${activeTab === 'book' ? 'active' : ''}" data-tab="book">
          📦 Book Pickup
        </button>
        <button class="btn btn-outline btn-sm citizen-nav-btn ${activeTab === 'pickups' ? 'active' : ''}" data-tab="pickups">
          📋 My Pickups
        </button>
        <button class="btn btn-outline btn-sm citizen-nav-btn ${activeTab === 'track' ? 'active' : ''}" data-tab="track">
          📍 Track Pickup
        </button>
        <button class="btn btn-outline btn-sm citizen-nav-btn ${activeTab === 'complaints' ? 'active' : ''}" data-tab="complaints">
          ⚠️ Report Issue
        </button>
        <button class="btn btn-outline btn-sm citizen-nav-btn ${activeTab === 'profile' ? 'active' : ''}" data-tab="profile">
          👤 Profile
        </button>
      </div>

      <div id="citizen-tab-content">
        <div style="text-align: center; padding: 2rem;">
          <div class="loading-spinner"></div>
        </div>
      </div>
    `;

    // Tab event bindings
    container.querySelectorAll('.citizen-nav-btn').forEach(btn => {
      btn.onclick = () => {
        activeTab = btn.getAttribute('data-tab');
        container.querySelectorAll('.citizen-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadTabContent();
      };
    });

    const qb = container.querySelector('#btn-quick-book');
    if (qb) qb.onclick = () => { activeTab = 'book'; renderFrame(); loadTabContent(); };

    const qc = container.querySelector('#btn-quick-complaint');
    if (qc) qc.onclick = () => { activeTab = 'complaints'; renderFrame(); loadTabContent(); };

    loadTabContent();
  }

  async function loadTabContent() {
    const content = container.querySelector('#citizen-tab-content');
    if (!content) return;

    if (activeTab === 'dashboard') {
      await loadDashboard(content);
    } else if (activeTab === 'book') {
      loadBookPickup(content);
    } else if (activeTab === 'pickups') {
      await loadMyPickups(content);
    } else if (activeTab === 'track') {
      await loadTrackPickup(content, selectedPickupId);
    } else if (activeTab === 'complaints') {
      await loadComplaints(content);
    } else if (activeTab === 'profile') {
      loadProfile(content);
    }
  }

  // ==========================================
  // CITIZEN DASHBOARD
  // ==========================================
  async function loadDashboard(target) {
    try {
      const res = await api('/api/pickups');
      const pickups = res.pickups || [];

      const totalRequests = pickups.length;
      const pendingRequests = pickups.filter(p => p.status === 'Requested' || p.status === 'Verified').length;
      const scheduledPickups = pickups.filter(p => p.status === 'Driver Assigned' || p.status === 'Driver On The Way' || p.status === 'Arrived').length;
      const completedPickups = pickups.filter(p => p.status === 'Completed').length;

      // Active pickup
      const activePickup = pickups.find(p => p.status !== 'Completed' && p.status !== 'Cancelled');

      target.innerHTML = `
        <!-- Metrics Cards -->
        <div class="grid-cards">
          <div class="stat-card">
            <div>
              <div class="stat-label">Total Requests</div>
              <div class="stat-val">${totalRequests}</div>
            </div>
            <div class="stat-icon-wrapper stat-icon-blue">📦</div>
          </div>

          <div class="stat-card">
            <div>
              <div class="stat-label">Pending Requests</div>
              <div class="stat-val">${pendingRequests}</div>
            </div>
            <div class="stat-icon-wrapper stat-icon-amber">⏳</div>
          </div>

          <div class="stat-card">
            <div>
              <div class="stat-label">In-Transit / Scheduled</div>
              <div class="stat-val">${scheduledPickups}</div>
            </div>
            <div class="stat-icon-wrapper stat-icon-purple">🚛</div>
          </div>

          <div class="stat-card">
            <div>
              <div class="stat-label">Completed Pickups</div>
              <div class="stat-val">${completedPickups}</div>
            </div>
            <div class="stat-icon-wrapper stat-icon-green">✅</div>
          </div>
        </div>

        <!-- Active Pickup Status Highlight -->
        ${activePickup ? `
          <div class="card" style="border-left: 4px solid var(--accent); background: linear-gradient(135deg, #fffbeb, #ffffff);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
              <div>
                <span class="badge badge-${activePickup.status.toLowerCase().replace(/ /g, '-')}">
                  ${activePickup.status}
                </span>
                <h3 style="font-size: 1.15rem; font-weight: 700; margin-top: 0.35rem; color: #0f172a;">
                  Active Collection: Request #${activePickup.id}
                </h3>
              </div>
              <button class="btn btn-warning btn-sm" id="btn-view-active-track">
                📍 Track Live Progress
              </button>
            </div>
            <div style="font-size: 0.875rem; color: #475569; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; margin-top: 0.5rem;">
              <div><strong>Waste Type:</strong> ${activePickup.waste_type} (${activePickup.quantity})</div>
              <div><strong>Scheduled:</strong> ${activePickup.scheduled_date} &bull; ${activePickup.preferred_time}</div>
              <div><strong>Assigned Vehicle:</strong> ${activePickup.driver_name ? `${activePickup.driver_name} (${activePickup.vehicle_type || 'Tipper'})` : 'Panchayat Verification in progress'}</div>
              <div><strong>Address:</strong> ${activePickup.address}</div>
            </div>
          </div>
        ` : `
          <div class="card" style="text-align: center; padding: 2rem;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎉</div>
            <div style="font-weight: 600; color: #0f172a;">No Active Pickups In Progress</div>
            <p style="font-size: 0.85rem; color: #64748b; margin: 0.25rem 0 1rem 0;">
              All your previous waste collection requests have been fulfilled.
            </p>
            <button class="btn btn-primary btn-sm" id="btn-book-from-empty">
              Book a Waste Pickup Now
            </button>
          </div>
        `}

        <!-- Recent Requests Section -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent Pickup Requests</h3>
            <button class="btn btn-outline btn-sm" id="btn-see-all-pickups">View All Pickups</button>
          </div>
          ${pickups.length > 0 ? `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Waste Type</th>
                    <th>Quantity</th>
                    <th>Date / Slot</th>
                    <th>Status</th>
                    <th>Driver</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${pickups.slice(0, 5).map(p => `
                    <tr>
                      <td><strong>#${p.id}</strong></td>
                      <td>${p.waste_type}</td>
                      <td>${p.quantity}</td>
                      <td>${p.scheduled_date}<br><small style="color: #64748b;">${p.preferred_time}</small></td>
                      <td><span class="badge badge-${p.status.toLowerCase().replace(/ /g, '-')}">${p.status}</span></td>
                      <td>${p.driver_name || '<em style="color:#94a3b8">Pending Assignment</em>'}</td>
                      <td>
                        <button class="btn btn-outline btn-sm btn-track-item" data-id="${p.id}">
                          Track
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-icon">📭</div>
              <p>You haven't made any pickup requests yet.</p>
            </div>
          `}
        </div>
      `;

      const viewActiveBtn = target.querySelector('#btn-view-active-track');
      if (viewActiveBtn && activePickup) {
        viewActiveBtn.onclick = () => {
          selectedPickupId = activePickup.id;
          activeTab = 'track';
          renderFrame();
        };
      }

      const bookEmptyBtn = target.querySelector('#btn-book-from-empty');
      if (bookEmptyBtn) {
        bookEmptyBtn.onclick = () => {
          activeTab = 'book';
          renderFrame();
        };
      }

      const seeAllBtn = target.querySelector('#btn-see-all-pickups');
      if (seeAllBtn) {
        seeAllBtn.onclick = () => {
          activeTab = 'pickups';
          renderFrame();
        };
      }

      target.querySelectorAll('.btn-track-item').forEach(btn => {
        btn.onclick = () => {
          selectedPickupId = btn.getAttribute('data-id');
          activeTab = 'track';
          renderFrame();
        };
      });

    } catch (err) {
      target.innerHTML = `<div class="card" style="color: red;">Error loading dashboard: ${err.message}</div>`;
    }
  }

  // ==========================================
  // CITIZEN BOOK PICKUP
  // ==========================================
  function loadBookPickup(target) {
    const today = new Date().toISOString().split('T')[0];
    const defaultAddress = currentUser.profile ? currentUser.profile.address : 'House 14, Near Shiv Mandir, Ward 4';

    target.innerHTML = `
      <div class="card" style="max-width: 800px; margin: 0 auto;">
        <div class="card-header">
          <h2 class="card-title">📦 Book a Waste Pickup Request</h2>
        </div>

        <form id="book-pickup-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="waste-type">Waste Type *</label>
              <select id="waste-type" class="form-select" required>
                <option value="Household Waste">Household Waste (Dry/Wet Segregated)</option>
                <option value="Plastic Waste" selected>Plastic Waste (Bottles, Packets, Sacks)</option>
                <option value="E-Waste">E-Waste (Old Appliances, Electronics, Batteries)</option>
                <option value="Bulky Waste">Bulky Waste (Furniture, Mattresses, Wood Scrap)</option>
                <option value="Other">Other Agricultural / Rural Waste</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="waste-quantity">Waste Quantity / Bags *</label>
              <select id="waste-quantity" class="form-select" required>
                <option value="1-2 Bags (~10kg)">1-2 Bags (~10kg)</option>
                <option value="3-5 Bags (~25kg)" selected>3-5 Bags (~25kg)</option>
                <option value="Cartload (~50kg+)">Cartload (~50kg+)</option>
                <option value="Bulky Single Unit">Bulky Single Unit</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="pickup-date">Pickup Date *</label>
              <input type="date" id="pickup-date" class="form-control" value="${today}" min="${today}" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="preferred-time">Preferred Time Window *</label>
              <select id="preferred-time" class="form-select" required>
                <option value="Morning (08:00 - 11:00 AM)" selected>Morning (08:00 - 11:00 AM)</option>
                <option value="Afternoon (01:00 - 04:00 PM)">Afternoon (01:00 - 04:00 PM)</option>
                <option value="Evening (04:00 - 07:00 PM)">Evening (04:00 - 07:00 PM)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="pickup-address">Pickup Address / Doorstep Location *</label>
            <input type="text" id="pickup-address" class="form-control" value="${defaultAddress}" required>
            <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.25rem;">
              Specify your Ward number and nearest landmark so the driver can locate you easily.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="pickup-description">Additional Description / Notes</label>
            <textarea id="pickup-description" class="form-textarea" rows="2" placeholder="e.g. Segregated cardboard cartons and clean plastic bottles stacked beside the main iron gate."></textarea>
          </div>

          <!-- Photo Uploader Component -->
          <div class="form-group" id="waste-photo-picker-container"></div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
            <button type="button" class="btn btn-outline" id="btn-cancel-book">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-submit-pickup" style="padding: 0.75rem 1.5rem;">
              Submit Pickup Request
            </button>
          </div>
        </form>
      </div>
    `;

    // Initialize Image Picker
    let uploadedPhotoUrl = null;
    createImagePicker({
      containerId: 'waste-photo-picker-container',
      label: 'Waste Photo (Recommended for verification)',
      sampleType: 'waste',
      onChange: (url) => {
        uploadedPhotoUrl = url;
      }
    });

    target.querySelector('#btn-cancel-book').onclick = () => {
      activeTab = 'dashboard';
      renderFrame();
    };

    const form = target.querySelector('#book-pickup-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = target.querySelector('#btn-submit-pickup');
      submitBtn.disabled = true;
      submitBtn.innerText = 'Submitting...';

      try {
        const wasteType = target.querySelector('#waste-type').value;
        const quantity = target.querySelector('#waste-quantity').value;
        const scheduledDate = target.querySelector('#pickup-date').value;
        const preferredTime = target.querySelector('#preferred-time').value;
        const address = target.querySelector('#pickup-address').value.trim();
        const description = target.querySelector('#pickup-description').value.trim();

        // If photo was chosen and is a local base64 data URL, upload it
        let finalPhotoUrl = uploadedPhotoUrl;
        if (uploadedPhotoUrl && uploadedPhotoUrl.startsWith('data:image')) {
          const upRes = await api('/api/upload', 'POST', { dataUrl: uploadedPhotoUrl });
          if (upRes.url) finalPhotoUrl = upRes.url;
        }

        const res = await api('/api/pickups', 'POST', {
          wasteType,
          quantity,
          scheduledDate,
          preferredTime,
          address,
          description,
          wastePhotoUrl: finalPhotoUrl
        });

        showToast(`Request #${res.pickup.id} submitted successfully!`, 'success');
        selectedPickupId = res.pickup.id;
        activeTab = 'track';
        renderFrame();

      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = 'Submit Pickup Request';
      }
    };
  }

  // ==========================================
  // CITIZEN MY PICKUPS
  // ==========================================
  async function loadMyPickups(target) {
    try {
      const res = await api('/api/pickups');
      const pickups = res.pickups || [];

      target.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">📋 My Waste Pickup History</h2>
            <button class="btn btn-primary btn-sm" id="btn-new-from-history">
              ➕ Book New
            </button>
          </div>

          ${pickups.length > 0 ? `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Waste Type</th>
                    <th>Quantity</th>
                    <th>Date &amp; Slot</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Driver Assigned</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${pickups.map(p => `
                    <tr>
                      <td><strong>#${p.id}</strong></td>
                      <td>${p.waste_type}</td>
                      <td>${p.quantity}</td>
                      <td>${p.scheduled_date}<br><small style="color: #64748b;">${p.preferred_time}</small></td>
                      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.address}</td>
                      <td><span class="badge badge-${p.status.toLowerCase().replace(/ /g, '-')}">${p.status}</span></td>
                      <td>${p.driver_name ? `${p.driver_name} (${p.vehicle_number || ''})` : '<span style="color:#94a3b8;">Pending</span>'}</td>
                      <td>
                        <button class="btn btn-outline btn-sm btn-track-specific" data-id="${p.id}">
                          📍 View Status
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-icon">🗑️</div>
              <p>No pickup records found in your account.</p>
            </div>
          `}
        </div>
      `;

      const newBtn = target.querySelector('#btn-new-from-history');
      if (newBtn) {
        newBtn.onclick = () => {
          activeTab = 'book';
          renderFrame();
        };
      }

      target.querySelectorAll('.btn-track-specific').forEach(btn => {
        btn.onclick = () => {
          selectedPickupId = btn.getAttribute('data-id');
          activeTab = 'track';
          renderFrame();
        };
      });

    } catch (err) {
      target.innerHTML = `<div class="card" style="color: red;">Failed to load pickups: ${err.message}</div>`;
    }
  }

  // ==========================================
  // CITIZEN TRACK PICKUP (7-Step Timeline)
  // ==========================================
  async function loadTrackPickup(target, pickupId) {
    try {
      const res = await api('/api/pickups');
      const pickups = res.pickups || [];

      if (pickups.length === 0) {
        target.innerHTML = `
          <div class="card empty-state">
            <div class="empty-icon">📍</div>
            <h3>No Active Pickups to Track</h3>
            <p>You have not submitted any pickup requests yet.</p>
            <button class="btn btn-primary btn-sm" id="btn-track-to-book" style="margin-top: 1rem;">
              Book Your First Pickup
            </button>
          </div>
        `;
        target.querySelector('#btn-track-to-book').onclick = () => { activeTab = 'book'; renderFrame(); };
        return;
      }

      let activePickup = pickupId ? pickups.find(p => p.id === pickupId) : null;
      if (!activePickup) activePickup = pickups[0];

      // Define 7-step timeline
      const steps = [
        { key: 'Requested', title: '1. Requested', desc: 'Citizen submitted pickup request with waste photos' },
        { key: 'Verified', title: '2. Verified', desc: 'Panchayat officials verified request and queued for fleet assignment' },
        { key: 'Driver Assigned', title: '3. Driver Assigned', desc: 'Collection vehicle and local driver allocated to this route' },
        { key: 'Driver On The Way', title: '4. Driver On The Way', desc: 'Driver is navigating towards your pickup address' },
        { key: 'Arrived', title: '5. Arrived', desc: 'Panchayat vehicle has arrived at your doorstep' },
        { key: 'Picked Up', title: '6. Picked Up', desc: 'Waste segregated and loaded onto vehicle' },
        { key: 'Completed', title: '7. Completed', desc: 'Pickup verified with photographic proof and digitally archived' }
      ];

      const statusOrder = ['Requested', 'Verified', 'Driver Assigned', 'Driver On The Way', 'Arrived', 'Picked Up', 'Completed'];
      const currentIdx = statusOrder.indexOf(activePickup.status);

      target.innerHTML = `
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
          <div style="flex: 1; min-width: 250px;">
            <label class="form-label" style="font-size: 0.8rem;">Select Pickup to Track:</label>
            <select id="select-tracked-pickup" class="form-select">
              ${pickups.map(p => `
                <option value="${p.id}" ${p.id === activePickup.id ? 'selected' : ''}>
                  #${p.id} - ${p.waste_type} (${p.status}) - ${p.scheduled_date}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
          <!-- Visual Timeline Card -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">📍 Live Status Timeline</h3>
              <span class="badge badge-${activePickup.status.toLowerCase().replace(/ /g, '-')}">
                ${activePickup.status}
              </span>
            </div>

            <div class="tracking-timeline">
              ${steps.map((s, idx) => {
                const isDone = currentIdx > idx || (activePickup.status === 'Completed');
                const isActive = currentIdx === idx && activePickup.status !== 'Completed';
                const stepClass = isDone ? 'done' : (isActive ? 'active' : '');
                return `
                  <div class="timeline-step ${stepClass}">
                    <div class="timeline-title">${s.title}</div>
                    <div class="timeline-desc">${s.desc}</div>
                  </div>
                `;
              }).join('')}
            </div>

            <div style="margin-top: 1.5rem; padding: 0.75rem; background-color: #f1f5f9; border-radius: var(--radius-sm); font-size: 0.8rem; color: #475569;">
              🔒 <em>Note: Citizens cannot modify official or driver statuses. Status updates are verified in real time by Panchayat sanitation personnel.</em>
            </div>
          </div>

          <!-- Pickup Details & Photos Card -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Request Specifications</h3>
              <small style="color: #64748b;">Created: ${new Date(activePickup.created_at).toLocaleString()}</small>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.875rem;">
              <div><strong>Request ID:</strong> #${activePickup.id}</div>
              <div><strong>Waste Type:</strong> ${activePickup.waste_type}</div>
              <div><strong>Quantity:</strong> ${activePickup.quantity}</div>
              <div><strong>Scheduled Date &amp; Slot:</strong> ${activePickup.scheduled_date} &bull; ${activePickup.preferred_time}</div>
              <div><strong>Address:</strong> ${activePickup.address}</div>
              <div><strong>Instructions:</strong> ${activePickup.description || 'None provided'}</div>
              <hr style="border: none; border-top: 1px solid var(--border-color);">
              <div>
                <strong>Assigned Driver:</strong>
                ${activePickup.driver_name ? `
                  <div style="margin-top: 0.25rem; padding: 0.5rem; background-color: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <div>👤 <strong>${activePickup.driver_name}</strong> (${activePickup.driver_phone || 'Contact via PDO'})</div>
                    <div>🚛 <strong>Vehicle:</strong> ${activePickup.vehicle_type || 'Tipper'} &bull; <code>${activePickup.vehicle_number || 'N/A'}</code></div>
                  </div>
                ` : '<span style="color:#94a3b8">Pending Driver Assignment by Panchayat</span>'}
              </div>
            </div>

            <!-- Photos Section: Citizen Photo & Driver Proof -->
            <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
              <!-- Citizen Waste Photo -->
              <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 0.75rem;">
                <div style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.5rem; color: #0f172a;">
                  📸 Citizen Uploaded Waste Photo
                </div>
                ${activePickup.citizen_photo_url ? `
                  <img src="${activePickup.citizen_photo_url}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 6px;" alt="Citizen Waste Photo">
                ` : '<div style="font-size: 0.8rem; color: #94a3b8;">No citizen photo attached to this request.</div>'}
              </div>

              <!-- Driver Completion Proof Photo -->
              <div style="border: 1px solid ${activePickup.status === 'Completed' ? '#86efac' : 'var(--border-color)'}; background-color: ${activePickup.status === 'Completed' ? '#f0fdf4' : '#fafbfc'}; border-radius: 8px; padding: 0.75rem;">
                <div style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.5rem; color: ${activePickup.status === 'Completed' ? '#166534' : '#64748b'}; display: flex; justify-content: space-between;">
                  <span>✅ Driver Completion Proof Photo</span>
                  ${activePickup.status === 'Completed' ? '<span class="badge badge-completed">Verified</span>' : ''}
                </div>
                ${activePickup.completion_proof_url ? `
                  <img src="${activePickup.completion_proof_url}" style="width: 100%; max-height: 220px; object-fit: cover; border-radius: 6px;" alt="Driver Completion Proof">
                  <div style="font-size: 0.8rem; color: #166534; margin-top: 0.5rem;">
                    <strong>Driver Notes:</strong> ${activePickup.completion_notes || 'Waste safely collected and loaded.'}<br>
                    <small>Completed at: ${new Date(activePickup.completed_at || activePickup.updated_at).toLocaleString()}</small>
                  </div>
                ` : `
                  <div style="font-size: 0.8rem; color: #94a3b8; padding: 1rem 0; text-align: center;">
                    ⏳ Driver completion proof photo will appear here once the driver completes pickup on site.
                  </div>
                `}
              </div>
            </div>
          </div>
        </div>
      `;

      target.querySelector('#select-tracked-pickup').onchange = (e) => {
        selectedPickupId = e.target.value;
        loadTrackPickup(target, selectedPickupId);
      };

    } catch (err) {
      target.innerHTML = `<div class="card" style="color: red;">Error tracking pickup: ${err.message}</div>`;
    }
  }

  // ==========================================
  // CITIZEN COMPLAINTS / ISSUE REPORTING
  // ==========================================
  async function loadComplaints(target) {
    try {
      const res = await api('/api/complaints');
      const complaints = res.complaints || [];

      target.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
          <!-- Lodge Complaint Form -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">⚠️ Report a Waste Grievance</h3>
            </div>
            <form id="lodge-complaint-form">
              <div class="form-group">
                <label class="form-label" for="complaint-type">Grievance / Issue Type *</label>
                <select id="complaint-type" class="form-select" required>
                  <option value="Missed Pickup">Missed Scheduled Pickup</option>
                  <option value="Overflowing Waste" selected>Overflowing Community Waste Bin</option>
                  <option value="Illegal Dumping">Illegal Dumping on Roadside / Drain</option>
                  <option value="Other">Other Sanitation Complaint</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="complaint-location">Location / Ward Landmark *</label>
                <input type="text" id="complaint-location" class="form-control" placeholder="e.g. Ward 4, Near Mandir Chowk Bazaar" required>
              </div>

              <div class="form-group">
                <label class="form-label" for="complaint-desc">Detailed Description *</label>
                <textarea id="complaint-desc" class="form-textarea" rows="3" placeholder="Describe the issue in detail..." required></textarea>
              </div>

              <!-- Complaint Photo Picker -->
              <div class="form-group" id="complaint-photo-container"></div>

              <button type="submit" class="btn btn-warning w-100" id="btn-submit-complaint" style="padding: 0.65rem;">
                Submit Grievance to Gram Panchayat
              </button>
            </form>
          </div>

          <!-- My Complaints History -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">📋 My Reported Grievances</h3>
            </div>
            ${complaints.length > 0 ? `
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${complaints.map(c => `
                  <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 0.85rem; background: #fafbfc;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                      <strong style="font-size: 0.9rem;">#${c.id} - ${c.type}</strong>
                      <span class="badge badge-${c.status.toLowerCase().replace(/ /g, '-')}">${c.status}</span>
                    </div>
                    <div style="font-size: 0.8rem; color: #475569; margin-bottom: 0.25rem;">
                      📍 ${c.location} &bull; <small>${new Date(c.created_at).toLocaleDateString()}</small>
                    </div>
                    <div style="font-size: 0.85rem; color: #0f172a; margin-bottom: 0.5rem;">
                      ${c.description}
                    </div>
                    ${c.admin_notes ? `
                      <div style="font-size: 0.8rem; background: #f0fdf4; border-left: 3px solid #16a34a; padding: 0.4rem 0.6rem; color: #166534;">
                        <strong>Panchayat Note:</strong> ${c.admin_notes}
                      </div>
                    ` : '<div style="font-size: 0.75rem; color: #94a3b8;">Awaiting official review</div>'}
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="empty-state">
                <div class="empty-icon">🤝</div>
                <p>No grievances filed. Your neighborhood is clean!</p>
              </div>
            `}
          </div>
        </div>
      `;

      let complaintPhotoUrl = null;
      createImagePicker({
        containerId: 'complaint-photo-container',
        label: 'Complaint Photo (Optional)',
        sampleType: 'waste',
        onChange: (url) => { complaintPhotoUrl = url; }
      });

      const compForm = target.querySelector('#lodge-complaint-form');
      compForm.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = target.querySelector('#btn-submit-complaint');
        submitBtn.disabled = true;

        try {
          const type = target.querySelector('#complaint-type').value;
          const location = target.querySelector('#complaint-location').value.trim();
          const description = target.querySelector('#complaint-desc').value.trim();

          let photoUrl = complaintPhotoUrl;
          if (photoUrl && photoUrl.startsWith('data:image')) {
            const upRes = await api('/api/upload', 'POST', { dataUrl: photoUrl });
            if (upRes.url) photoUrl = upRes.url;
          }

          const res = await api('/api/complaints', 'POST', {
            type,
            location,
            description,
            photoUrl
          });

          showToast(`Grievance #${res.complaintId} lodged successfully`, 'success');
          loadComplaints(target);

        } catch (err) {
          showToast(err.message, 'error');
          submitBtn.disabled = false;
        }
      };

    } catch (err) {
      target.innerHTML = `<div class="card" style="color: red;">Error loading complaints: ${err.message}</div>`;
    }
  }

  // ==========================================
  // CITIZEN PROFILE
  // ==========================================
  function loadProfile(target) {
    target.innerHTML = `
      <div class="card" style="max-width: 600px; margin: 0 auto;">
        <div class="card-header">
          <h2 class="card-title">👤 Citizen Profile</h2>
        </div>
        <div style="display: flex; flex-direction: column; gap: 1rem; font-size: 0.95rem;">
          <div><strong>Full Name:</strong> ${currentUser.name}</div>
          <div><strong>Role:</strong> <span class="role-badge citizen">Citizen</span></div>
          <div><strong>Email Address:</strong> ${currentUser.email}</div>
          <div><strong>Phone Number:</strong> ${currentUser.phone || '+91 98111 22334'}</div>
          <div><strong>Village / Ward:</strong> ${currentUser.profile ? currentUser.profile.village_ward : 'Ward 4 - Mandir Mohalla'}</div>
          <div><strong>Residential Address:</strong> ${currentUser.profile ? currentUser.profile.address : 'House 14, Near Shiv Mandir, Shanti Nagar'}</div>
          <div><strong>Panchayat:</strong> Shanti Nagar Gram Panchayat</div>
          <div><strong>Account Status:</strong> <span class="badge badge-completed">Active Verified Resident</span></div>
        </div>
      </div>
    `;
  }

  renderFrame();
}
