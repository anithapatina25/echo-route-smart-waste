// driver.js - Driver Portal views, assignments, route map, and photo completion workflow
import { createImagePicker } from '../components/imagePicker.js';

export function renderDriver(container, subRoute = 'dashboard', state, api, showToast, showModal, closeModal, onNavigate) {
  const { currentUser } = state;

  let activeTab = subRoute;
  let selectedPickupId = null;

  if (subRoute.startsWith('pickup')) {
    const parts = subRoute.split(':');
    activeTab = 'details';
    if (parts[1]) selectedPickupId = parts[1];
  }

  function renderFrame() {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Driver Operations Console</h1>
          <div class="page-subtitle">
            Driver: <strong>${currentUser.name}</strong> &bull; Vehicle: <strong>${currentUser.profile ? currentUser.profile.vehicle_type : 'Tata Ace'}</strong> (${currentUser.profile ? currentUser.profile.vehicle_number : 'DL-04-E-1024'})
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <span class="badge badge-completed" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">
            🟢 On Duty &bull; GPS Simulated Active
          </span>
        </div>
      </div>

      <!-- Driver Navigation -->
      <div style="display: flex; gap: 0.5rem; border-bottom: 2px solid var(--border-color); margin-bottom: 1.5rem; overflow-x: auto;">
        <button class="btn btn-outline btn-sm driver-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
          📊 Dashboard
        </button>
        <button class="btn btn-outline btn-sm driver-nav-btn ${activeTab === 'assignments' ? 'active' : ''}" data-tab="assignments">
          🚛 My Assignments
        </button>
        <button class="btn btn-outline btn-sm driver-nav-btn ${activeTab === 'route' ? 'active' : ''}" data-tab="route">
          🗺️ Today's Route
        </button>
        <button class="btn btn-outline btn-sm driver-nav-btn ${activeTab === 'details' ? 'active' : ''}" data-tab="details">
          📋 Pickup Details
        </button>
        <button class="btn btn-outline btn-sm driver-nav-btn ${activeTab === 'completed' ? 'active' : ''}" data-tab="completed">
          ✅ Completed Pickups
        </button>
        <button class="btn btn-outline btn-sm driver-nav-btn ${activeTab === 'profile' ? 'active' : ''}" data-tab="profile">
          👤 Vehicle &amp; Profile
        </button>
      </div>

      <div id="driver-tab-content">
        <div style="text-align: center; padding: 2rem;">
          <div class="loading-spinner"></div>
        </div>
      </div>
    `;

    container.querySelectorAll('.driver-nav-btn').forEach(btn => {
      btn.onclick = () => {
        activeTab = btn.getAttribute('data-tab');
        container.querySelectorAll('.driver-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadTabContent();
      };
    });

    loadTabContent();
  }

  async function loadTabContent() {
    const content = container.querySelector('#driver-tab-content');
    if (!content) return;

    if (activeTab === 'dashboard') {
      await loadDashboard(content);
    } else if (activeTab === 'assignments') {
      await loadAssignments(content);
    } else if (activeTab === 'route') {
      await loadRouteMap(content);
    } else if (activeTab === 'details') {
      await loadPickupDetails(content, selectedPickupId);
    } else if (activeTab === 'completed') {
      await loadCompleted(content);
    } else if (activeTab === 'profile') {
      loadProfile(content);
    }
  }

  // ==========================================
  // DRIVER DASHBOARD
  // ==========================================
  async function loadDashboard(target) {
    try {
      const res = await api('/api/pickups');
      const myPickups = res.pickups || [];

      // Security check: confirm strictly no unassigned or other driver's pickups
      const todayAssignments = myPickups.length;
      const pendingPickups = myPickups.filter(p => p.status === 'Driver Assigned').length;
      const activeInTransit = myPickups.filter(p => p.status === 'Driver On The Way' || p.status === 'Arrived' || p.status === 'Picked Up');
      const completedCount = myPickups.filter(p => p.status === 'Completed').length;

      target.innerHTML = `
        <!-- Metrics Cards -->
        <div class="grid-cards">
          <div class="stat-card">
            <div>
              <div class="stat-label">Today's Assignments</div>
              <div class="stat-val">${todayAssignments}</div>
            </div>
            <div class="stat-icon-wrapper stat-icon-blue">📦</div>
          </div>

          <div class="stat-card">
            <div>
              <div class="stat-label">Pending Acceptance</div>
              <div class="stat-val">${pendingPickups}</div>
            </div>
            <div class="stat-icon-wrapper stat-icon-amber">⏳</div>
          </div>

          <div class="stat-card">
            <div>
              <div class="stat-label">In-Transit Pickups</div>
              <div class="stat-val">${activeInTransit.length}</div>
            </div>
            <div class="stat-icon-wrapper stat-icon-purple">🚛</div>
          </div>

          <div class="stat-card">
            <div>
              <div class="stat-label">Completed Today</div>
              <div class="stat-val">${completedCount}</div>
            </div>
            <div class="stat-icon-wrapper stat-icon-green">✅</div>
          </div>
        </div>

        <!-- Security Badge Confirmation -->
        <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.5rem; font-size: 0.8rem; color: #334155; display: flex; align-items: center; gap: 0.5rem;">
          <span>🔒</span>
          <span><strong>Driver Role Isolation Active:</strong> You are strictly restricted to your vehicle's allocated pickups. Administrative controls and other drivers' routes are hidden.</span>
        </div>

        <!-- Actionable In-Transit Pickup -->
        ${activeInTransit.length > 0 ? `
          <div class="card" style="border-left: 4px solid var(--accent); background: linear-gradient(135deg, #fffbeb, #ffffff);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
              <div>
                <span class="badge badge-${activeInTransit[0].status.toLowerCase().replace(/ /g, '-')}">
                  ${activeInTransit[0].status}
                </span>
                <h3 style="font-size: 1.15rem; font-weight: 700; margin-top: 0.35rem; color: #0f172a;">
                  Current Stop: #${activeInTransit[0].id} &bull; ${activeInTransit[0].citizen_name}
                </h3>
              </div>
              <button class="btn btn-warning btn-sm" id="btn-resume-active" data-id="${activeInTransit[0].id}">
                👉 Resume Pickup Execution
              </button>
            </div>
            <div style="font-size: 0.875rem; color: #475569; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; margin-top: 0.5rem;">
              <div><strong>Waste:</strong> ${activeInTransit[0].waste_type} (${activeInTransit[0].quantity})</div>
              <div><strong>Doorstep Address:</strong> ${activeInTransit[0].address}</div>
              <div><strong>Phone:</strong> ${activeInTransit[0].citizen_phone || '+91 98111 22334'}</div>
            </div>
          </div>
        ` : ''}

        <!-- Queue of Assigned Pickups -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">My Assigned Pickups Queue</h3>
            <button class="btn btn-outline btn-sm" id="btn-view-route-map">
              🗺️ Open Route Map
            </button>
          </div>

          ${myPickups.length > 0 ? `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Stop #</th>
                    <th>Request ID</th>
                    <th>Citizen</th>
                    <th>Waste Type</th>
                    <th>Quantity</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${myPickups.map((p, idx) => `
                    <tr>
                      <td><strong>#${idx + 1}</strong></td>
                      <td><strong>#${p.id}</strong></td>
                      <td>${p.citizen_name}<br><small style="color: #64748b;">${p.citizen_phone || ''}</small></td>
                      <td>${p.waste_type}</td>
                      <td>${p.quantity}</td>
                      <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.address}</td>
                      <td><span class="badge badge-${p.status.toLowerCase().replace(/ /g, '-')}">${p.status}</span></td>
                      <td>
                        <button class="btn btn-primary btn-sm btn-open-pickup" data-id="${p.id}">
                          Open &bull; Update
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-icon">🚛</div>
              <p>No pickups currently assigned to your vehicle.</p>
            </div>
          `}
        </div>
      `;

      target.querySelectorAll('.btn-open-pickup').forEach(btn => {
        btn.onclick = () => {
          selectedPickupId = btn.getAttribute('data-id');
          activeTab = 'details';
          renderFrame();
        };
      });

      const resumeBtn = target.querySelector('#btn-resume-active');
      if (resumeBtn) {
        resumeBtn.onclick = () => {
          selectedPickupId = resumeBtn.getAttribute('data-id');
          activeTab = 'details';
          renderFrame();
        };
      }

      const routeBtn = target.querySelector('#btn-view-route-map');
      if (routeBtn) {
        routeBtn.onclick = () => {
          activeTab = 'route';
          renderFrame();
        };
      }

    } catch (err) {
      target.innerHTML = `<div class="card" style="color: red;">Error: ${err.message}</div>`;
    }
  }

  // ==========================================
  // DRIVER MY ASSIGNMENTS
  // ==========================================
  async function loadAssignments(target) {
    try {
      const res = await api('/api/pickups');
      const pickups = res.pickups || [];

      target.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">🚛 My Assigned Pickups</h2>
            <button class="btn btn-outline btn-sm" id="btn-driver-refresh">🔄 Refresh</button>
          </div>

          ${pickups.length > 0 ? `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem;">
              ${pickups.map(p => `
                <div class="card" style="margin-bottom: 0; border: 1px solid var(--border-color); display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                      <strong style="font-size: 1.05rem;">#${p.id}</strong>
                      <span class="badge badge-${p.status.toLowerCase().replace(/ /g, '-')}">${p.status}</span>
                    </div>

                    <div style="font-size: 0.875rem; color: #0f172a; margin-bottom: 0.35rem;">
                      👤 <strong>${p.citizen_name}</strong> &bull; ${p.citizen_phone || '+91 98111 22334'}
                    </div>

                    <div style="font-size: 0.825rem; color: #475569; margin-bottom: 0.5rem;">
                      📍 ${p.address}
                    </div>

                    <div style="background: #f8fafc; padding: 0.5rem; border-radius: 6px; font-size: 0.825rem; margin-bottom: 0.75rem;">
                      <div><strong>Waste:</strong> ${p.waste_type} (${p.quantity})</div>
                      <div><strong>Slot:</strong> ${p.scheduled_date} &bull; ${p.preferred_time}</div>
                    </div>

                    ${p.citizen_photo_url ? `
                      <div style="margin-bottom: 0.75rem;">
                        <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.2rem; font-weight: 600;">Citizen Waste Photo:</div>
                        <img src="${p.citizen_photo_url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px;" alt="Citizen waste">
                      </div>
                    ` : ''}
                  </div>

                  <button class="btn btn-primary btn-sm btn-open-assigned" data-id="${p.id}" style="margin-top: 0.5rem;">
                    Manage &amp; Update Status &rarr;
                  </button>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-icon">📭</div>
              <p>No pickups currently assigned to you.</p>
            </div>
          `}
        </div>
      `;

      target.querySelector('#btn-driver-refresh').onclick = () => loadAssignments(target);

      target.querySelectorAll('.btn-open-assigned').forEach(btn => {
        btn.onclick = () => {
          selectedPickupId = btn.getAttribute('data-id');
          activeTab = 'details';
          renderFrame();
        };
      });

    } catch (err) {
      target.innerHTML = `<div class="card" style="color: red;">Error: ${err.message}</div>`;
    }
  }

  // ==========================================
  // DRIVER PICKUP DETAILS & WORKFLOW BUTTONS
  // ==========================================
  async function loadPickupDetails(target, pickupId) {
    try {
      const res = await api('/api/pickups');
      const pickups = res.pickups || [];

      if (pickups.length === 0) {
        target.innerHTML = `<div class="card empty-state"><p>No pickups assigned to you.</p></div>`;
        return;
      }

      let pickup = pickupId ? pickups.find(p => p.id === pickupId) : pickups[0];
      if (!pickup) pickup = pickups[0];

      target.innerHTML = `
        <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.25rem;">
          <button class="btn btn-outline btn-sm" id="btn-back-to-assignments">&larr; Back to Assignments</button>
          <div style="flex: 1;">
            <select id="select-active-detail-pickup" class="form-select" style="max-width: 350px;">
              ${pickups.map(p => `
                <option value="${p.id}" ${p.id === pickup.id ? 'selected' : ''}>
                  #${p.id} - ${p.citizen_name} (${p.status})
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
          <!-- Left: Information Card -->
          <div class="card">
            <div class="card-header">
              <div>
                <span class="badge badge-${pickup.status.toLowerCase().replace(/ /g, '-')}">
                  ${pickup.status}
                </span>
                <h2 class="card-title" style="margin-top: 0.35rem;">Pickup Request #${pickup.id}</h2>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem;">
              <div>👤 <strong>Citizen Name:</strong> ${pickup.citizen_name}</div>
              <div>📞 <strong>Citizen Phone:</strong> <a href="tel:${pickup.citizen_phone || ''}" style="color: var(--primary); font-weight: 600;">${pickup.citizen_phone || '+91 98111 22334'}</a></div>
              <div>📍 <strong>Address:</strong> ${pickup.address}</div>
              <div>🗑️ <strong>Waste Type:</strong> ${pickup.waste_type}</div>
              <div>⚖️ <strong>Quantity:</strong> ${pickup.quantity}</div>
              <div>📅 <strong>Scheduled Date:</strong> ${pickup.scheduled_date} &bull; ${pickup.preferred_time}</div>
              <div>📝 <strong>Citizen Instructions:</strong> ${pickup.description || 'None provided'}</div>
            </div>

            <!-- Citizen Uploaded Waste Photo -->
            <div style="margin-top: 1.5rem; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.75rem;">
              <div style="font-weight: 600; font-size: 0.85rem; color: #0f172a; margin-bottom: 0.5rem;">
                📸 Citizen Uploaded Waste Photo (Check before arrival)
              </div>
              ${pickup.citizen_photo_url ? `
                <img src="${pickup.citizen_photo_url}" style="width: 100%; max-height: 220px; object-fit: cover; border-radius: 6px;" alt="Citizen waste photo">
              ` : '<div style="font-size: 0.8rem; color: #94a3b8;">No photo uploaded by citizen.</div>'}
            </div>
          </div>

          <!-- Right: Action Workflow & Completion -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">⚡ Collection Workflow Actions</h3>
            </div>

            ${pickup.status === 'Completed' ? `
              <div style="text-align: center; padding: 1.5rem; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">✅</div>
                <h3 style="color: #166534; font-size: 1.2rem; font-weight: 700;">Pickup Completed</h3>
                <p style="color: #15803d; font-size: 0.85rem; margin-top: 0.25rem;">
                  Completed at: ${new Date(pickup.completed_at || pickup.updated_at).toLocaleString()}
                </p>
                <div style="margin-top: 1rem; text-align: left;">
                  <strong style="font-size: 0.85rem; color: #166534;">Your Uploaded Completion Proof:</strong>
                  <img src="${pickup.completion_proof_url}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 6px; margin-top: 0.35rem;" alt="Proof">
                  <div style="font-size: 0.8rem; color: #166534; margin-top: 0.35rem;">
                    <strong>Notes:</strong> ${pickup.completion_notes || 'None'}
                  </div>
                </div>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div style="font-size: 0.85rem; color: #64748b;">
                  Current Phase: <strong>${pickup.status}</strong>.<br>
                  Advance the collection state as you progress through this stop:
                </div>

                <!-- Step 1: Accept Assignment -->
                <button class="btn ${pickup.accepted_at ? 'btn-success' : 'btn-outline'} w-100" id="btn-wf-accept" ${pickup.status !== 'Driver Assigned' || pickup.accepted_at ? 'disabled' : ''}>
                  ${pickup.accepted_at ? '✓ 1. Assignment Accepted' : '1. Accept Assignment'}
                </button>

                <!-- Step 2: Start Pickup (Driver On The Way) -->
                <button class="btn btn-warning w-100" id="btn-wf-ontheway" ${pickup.status !== 'Driver Assigned' ? 'disabled' : ''}>
                  2. Start Pickup (On The Way)
                </button>

                <!-- Step 3: Arrived -->
                <button class="btn btn-outline w-100" id="btn-wf-arrived" ${pickup.status !== 'Driver On The Way' ? 'disabled' : ''}>
                  3. Arrived at Citizen Address
                </button>

                <!-- Step 4: Picked Up & Loaded -->
                <button class="btn btn-outline w-100" id="btn-wf-pickedup" ${pickup.status !== 'Arrived' ? 'disabled' : ''}>
                  4. Mark Waste Picked Up &amp; Loaded
                </button>

                <!-- Step 5: Complete Pickup (Requires Proof Photo) -->
                <button class="btn btn-success btn-lg w-100" id="btn-wf-complete" ${pickup.status !== 'Picked Up' && pickup.status !== 'Arrived' ? 'disabled' : ''} style="box-shadow: var(--shadow-md);">
                  5. Complete Pickup &amp; Upload Proof 📸
                </button>
              </div>
            `}
          </div>
        </div>
      `;

      target.querySelector('#btn-back-to-assignments').onclick = () => {
        activeTab = 'assignments';
        renderFrame();
      };

      target.querySelector('#select-active-detail-pickup').onchange = (e) => {
        selectedPickupId = e.target.value;
        loadPickupDetails(target, selectedPickupId);
      };

      // Action Handlers
      const acceptBtn = target.querySelector('#btn-wf-accept');
      if (acceptBtn) {
        acceptBtn.onclick = async () => {
          try {
            await api(`/api/pickups/${pickup.id}/accept`, 'PUT');
            showToast('Assignment formally accepted and acknowledged.', 'success');
            loadPickupDetails(target, pickup.id);
          } catch (err) {
            showToast(err.message, 'error');
          }
        };
      }

      const onTheWayBtn = target.querySelector('#btn-wf-ontheway');
      if (onTheWayBtn) {
        onTheWayBtn.onclick = async () => {
          try {
            await api(`/api/pickups/${pickup.id}/driver-status`, 'PUT', { status: 'Driver On The Way' });
            showToast('Status updated: Driver On The Way', 'success');
            loadPickupDetails(target, pickup.id);
          } catch (err) {
            showToast(err.message, 'error');
          }
        };
      }

      const arrivedBtn = target.querySelector('#btn-wf-arrived');
      if (arrivedBtn) {
        arrivedBtn.onclick = async () => {
          try {
            await api(`/api/pickups/${pickup.id}/driver-status`, 'PUT', { status: 'Arrived' });
            showToast('Status updated: Arrived at doorstep', 'success');
            loadPickupDetails(target, pickup.id);
          } catch (err) {
            showToast(err.message, 'error');
          }
        };
      }

      const pickedUpBtn = target.querySelector('#btn-wf-pickedup');
      if (pickedUpBtn) {
        pickedUpBtn.onclick = async () => {
          try {
            await api(`/api/pickups/${pickup.id}/driver-status`, 'PUT', { status: 'Picked Up' });
            showToast('Status updated: Waste Picked Up & Loaded into vehicle', 'success');
            loadPickupDetails(target, pickup.id);
          } catch (err) {
            showToast(err.message, 'error');
          }
        };
      }

      const completeBtn = target.querySelector('#btn-wf-complete');
      if (completeBtn) {
        completeBtn.onclick = () => {
          openCompletionModal(pickup);
        };
      }

    } catch (err) {
      target.innerHTML = `<div class="card" style="color: red;">Error: ${err.message}</div>`;
    }
  }

  // ==========================================
  // COMPLETION PROOF MODAL (REQUIREMENT 9 & 17)
  // ==========================================
  function openCompletionModal(pickup) {
    let proofDataUrl = null;

    const modalContent = `
      <div style="font-size: 0.9rem; color: #475569; margin-bottom: 1rem;">
        Completing pickup <strong>#${pickup.id}</strong> for <strong>${pickup.citizen_name}</strong> (${pickup.waste_type}).
        <br>
        <span style="color: #b91c1c; font-weight: 600;">
          * Mandatory: You must upload a photographic proof of the collected and loaded waste.
        </span>
      </div>

      <div id="modal-proof-picker-container" style="margin-bottom: 1rem;"></div>

      <div class="form-group">
        <label class="form-label" for="modal-proof-notes">Driver Collection Remarks</label>
        <input type="text" id="modal-proof-notes" class="form-control" value="Waste safely segregated, weighed, and vehicle loaded. Doorstep site clean." required>
      </div>
    `;

    showModal(
      '📸 Complete Pickup Verification',
      modalContent,
      [
        {
          text: 'Cancel',
          class: 'btn-outline',
          onClick: closeModal
        },
        {
          text: 'Confirm & Complete Pickup',
          class: 'btn-success',
          id: 'btn-modal-confirm-complete',
          onClick: async () => {
            if (!proofDataUrl) {
              showToast('Completion proof photo is required!', 'error');
              return;
            }

            const notes = document.getElementById('modal-proof-notes').value.trim();
            const confirmBtn = document.getElementById('btn-modal-confirm-complete');
            if (confirmBtn) {
              confirmBtn.disabled = true;
              confirmBtn.innerText = 'Uploading & Completing...';
            }

            try {
              // Upload photo if dataUrl
              let finalProofUrl = proofDataUrl;
              if (proofDataUrl.startsWith('data:image')) {
                const upRes = await api('/api/upload', 'POST', { dataUrl: proofDataUrl });
                if (upRes.url) finalProofUrl = upRes.url;
              }

              const res = await api(`/api/pickups/${pickup.id}/complete`, 'POST', {
                proofPhotoUrl: finalProofUrl,
                notes: notes || 'Collected and vehicle loaded.'
              });

              closeModal();
              showToast('Pickup completed! Proof photo digitally attached.', 'success');
              activeTab = 'details';
              selectedPickupId = pickup.id;
              renderFrame();

            } catch (err) {
              showToast(err.message, 'error');
              if (confirmBtn) confirmBtn.disabled = false;
            }
          }
        }
      ]
    );

    // Initialize Image Picker inside modal
    createImagePicker({
      containerId: 'modal-proof-picker-container',
      label: 'Vehicle Loaded Proof Photo *',
      sampleType: 'proof',
      onChange: (url) => {
        proofDataUrl = url;
      }
    });
  }

  // ==========================================
  // DRIVER TODAY'S ROUTE & MAP
  // ==========================================
  async function loadRouteMap(target) {
    try {
      target.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">🗺️ Sequenced Pickup Route</h2>
              <p style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">
                Optimized waypoint navigation to minimize unnecessary travel across Gram Panchayat wards.
              </p>
            </div>
            <span class="badge badge-verified" style="font-size: 0.75rem; text-align: right;">
              Illustrative route-efficiency estimate: ~24% (Prototype Simulation)
            </span>
          </div>

          <div id="driver-map" class="map-frame"></div>

          <div id="route-stops-list" style="margin-top: 1.5rem;">
            <div class="loading-spinner"></div>
          </div>
        </div>
      `;

      // Fetch route calculation
      const routeData = await api('/api/routes/optimize');

      // Initialize Leaflet Map
      setTimeout(() => {
        if (typeof L === 'undefined') {
          target.querySelector('#driver-map').innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #64748b;">
              Map engine is offline. Waypoint coordinates listed below.
            </div>
          `;
          return;
        }

        const depot = routeData.depot || { latitude: 28.5355, longitude: 77.3910 };
        const map = L.map('driver-map').setView([depot.latitude, depot.longitude], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Depot Marker
        L.marker([depot.latitude, depot.longitude])
          .addTo(map)
          .bindPopup(`<b>🏢 Gram Panchayat MRF Yard</b><br>Base Depot &amp; Sorting Facility`)
          .openPopup();

        // Pickup waypoints
        const latlngs = [[depot.latitude, depot.longitude]];

        if (routeData.stops && routeData.stops.length > 0) {
          routeData.stops.forEach((s) => {
            const p = s.pickup;
            latlngs.push([p.latitude, p.longitude]);
            const marker = L.marker([p.latitude, p.longitude]).addTo(map);
            marker.bindPopup(`
              <b>Stop #${s.stopNumber}: Request #${p.id}</b><br>
              ${p.waste_type} (${p.quantity})<br>
              📍 ${p.address}<br>
              Status: <b>${p.status}</b>
            `);
          });

          // Polyline route
          latlngs.push([depot.latitude, depot.longitude]);
          const polyline = L.polyline(latlngs, { color: '#16a34a', weight: 4, dashArray: '6, 8' }).addTo(map);
          map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
        }
      }, 100);

      // Render stops table
      const stopsList = target.querySelector('#route-stops-list');
      stopsList.innerHTML = `
        <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; color: #0f172a;">
          Turn-by-Turn Waypoint Sequence (${routeData.totalPickups || 0} Stops &bull; Est. Distance: ${routeData.totalDistanceKm || 0} km)
        </h3>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Sequence</th>
                <th>Request ID</th>
                <th>Waste Type</th>
                <th>Quantity</th>
                <th>Address</th>
                <th>Distance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${routeData.stops && routeData.stops.length > 0 ? routeData.stops.map(s => `
                <tr>
                  <td><strong>Stop #${s.stopNumber}</strong></td>
                  <td>#${s.pickup.id}</td>
                  <td>${s.pickup.waste_type}</td>
                  <td>${s.pickup.quantity}</td>
                  <td>${s.pickup.address}</td>
                  <td>${s.estimatedDistanceKm} km</td>
                  <td><span class="badge badge-${s.pickup.status.toLowerCase().replace(/ /g, '-')}">${s.pickup.status}</span></td>
                  <td>
                    <button class="btn btn-outline btn-sm btn-open-waypoint" data-id="${s.pickup.id}">
                      Manage
                    </button>
                  </td>
                </tr>
              `).join('') : `
                <tr><td colspan="8" style="text-align: center; padding: 1.5rem; color: #64748b;">No assigned stops for today.</td></tr>
              `}
            </tbody>
          </table>
        </div>
      `;

      stopsList.querySelectorAll('.btn-open-waypoint').forEach(btn => {
        btn.onclick = () => {
          selectedPickupId = btn.getAttribute('data-id');
          activeTab = 'details';
          renderFrame();
        };
      });

    } catch (err) {
      target.innerHTML = `<div class="card" style="color: red;">Error loading route map: ${err.message}</div>`;
    }
  }

  // ==========================================
  // DRIVER COMPLETED PICKUPS
  // ==========================================
  async function loadCompleted(target) {
    try {
      const res = await api('/api/pickups');
      const completed = (res.pickups || []).filter(p => p.status === 'Completed');

      target.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">✅ Completed Pickups (${completed.length})</h2>
          </div>

          ${completed.length > 0 ? `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Citizen</th>
                    <th>Waste Type</th>
                    <th>Quantity</th>
                    <th>Completed At</th>
                    <th>Proof Attached</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${completed.map(p => `
                    <tr>
                      <td><strong>#${p.id}</strong></td>
                      <td>${p.citizen_name}</td>
                      <td>${p.waste_type}</td>
                      <td>${p.quantity}</td>
                      <td>${new Date(p.completed_at || p.updated_at).toLocaleString()}</td>
                      <td>
                        ${p.completion_proof_url ? `
                          <span class="badge badge-completed">✓ Photo Attached</span>
                        ` : '<span style="color:#dc2626;">Missing</span>'}
                      </td>
                      <td>
                        <button class="btn btn-outline btn-sm btn-view-completed-details" data-id="${p.id}">
                          View Details
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-icon">📂</div>
              <p>No completed pickups yet today.</p>
            </div>
          `}
        </div>
      `;

      target.querySelectorAll('.btn-view-completed-details').forEach(btn => {
        btn.onclick = () => {
          selectedPickupId = btn.getAttribute('data-id');
          activeTab = 'details';
          renderFrame();
        };
      });

    } catch (err) {
      target.innerHTML = `<div class="card" style="color: red;">Error: ${err.message}</div>`;
    }
  }

  // ==========================================
  // DRIVER PROFILE
  // ==========================================
  function loadProfile(target) {
    const prof = currentUser.profile || {};
    target.innerHTML = `
      <div class="card" style="max-width: 600px; margin: 0 auto;">
        <div class="card-header">
          <h2 class="card-title">👤 Driver &amp; Vehicle Roster Details</h2>
        </div>
        <div style="display: flex; flex-direction: column; gap: 1rem; font-size: 0.95rem;">
          <div><strong>Driver Name:</strong> ${currentUser.name}</div>
          <div><strong>Role:</strong> <span class="role-badge driver">Driver</span></div>
          <div><strong>Official Email:</strong> ${currentUser.email}</div>
          <div><strong>Contact Mobile:</strong> ${currentUser.phone || '+91 94123 45678'}</div>
          <hr style="border: none; border-top: 1px solid var(--border-color);">
          <div><strong>Allocated Vehicle:</strong> ${prof.vehicle_type || 'Tata Ace Tipper (1.5 Ton)'}</div>
          <div><strong>Vehicle Number Plate:</strong> <code>${prof.vehicle_number || 'DL-04-E-1024'}</code></div>
          <div><strong>Driving License:</strong> <code>${prof.license_number || 'DL-2018-098231'}</code></div>
          <div><strong>Depot Base:</strong> Shanti Nagar Gram Panchayat MRF Yard</div>
          <div><strong>Active Duty Status:</strong> <span class="badge badge-completed">Active on Fleet Duty</span></div>
        </div>
      </div>
    `;
  }

  renderFrame();
}
