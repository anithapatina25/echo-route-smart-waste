// landing.js - Public landing page view
export function renderLanding(container, onNavigate) {
  container.innerHTML = `
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-tag">GRAM PANCHAYAT SMART CIVIC PLATFORM</div>
      <h1 class="hero-title">ECHO ROUTE SMART WASTE</h1>
      <p class="hero-subtitle">
        Smarter Routes. Cleaner Communities. Transforming rural waste management by empowering existing Gram Panchayat vehicles, drivers, and local sanitation workers with precision routing and digital transparency.
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <button class="btn btn-primary btn-lg" id="hero-btn-login" style="background-color: #22c55e; color: #064e3b; font-weight: 700; border: none; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);">
          Access Portal (Citizen / Driver / Admin)
        </button>
        <button class="btn btn-outline btn-lg" id="hero-btn-how" style="color: white; border-color: rgba(255,255,255,0.4);">
          See How It Works
        </button>
      </div>
    </section>

    <!-- Problem vs Solution -->
    <section style="margin-bottom: 3.5rem;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h2 style="font-size: 1.75rem; font-weight: 700; color: #0f172a;">The Rural Waste Challenge &amp; Our Solution</h2>
        <p style="color: #64748b; max-width: 680px; margin: 0.5rem auto 0 auto;">
          Bridging the gap between rural citizens and municipal waste collection services.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
        <!-- The Problem -->
        <div class="card" style="border-left: 4px solid #ef4444;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
            <div style="width: 40px; height: 40px; background-color: #fee2e2; color: #b91c1c; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              ⚠️
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: #991b1b;">The Problem</h3>
          </div>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.75rem; color: #475569; font-size: 0.95rem;">
            <li style="display: flex; gap: 0.5rem;">
              <span style="color: #ef4444; font-weight: bold;">✕</span>
              Uncoordinated collection schedules lead to trash piling up in public ditches and drains.
            </li>
            <li style="display: flex; gap: 0.5rem;">
              <span style="color: #ef4444; font-weight: bold;">✕</span>
              Citizens lack a direct, reliable channel to request pickups for segregated plastics, bulky items, or e-waste.
            </li>
            <li style="display: flex; gap: 0.5rem;">
              <span style="color: #ef4444; font-weight: bold;">✕</span>
              Panchayat drivers waste fuel driving arbitrary routes with no visibility into demand.
            </li>
            <li style="display: flex; gap: 0.5rem;">
              <span style="color: #ef4444; font-weight: bold;">✕</span>
              No digital proof or verification of whether waste was actually picked up and properly disposed.
            </li>
          </ul>
        </div>

        <!-- The Solution -->
        <div class="card" style="border-left: 4px solid #16a34a;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
            <div style="width: 40px; height: 40px; background-color: #dcfce7; color: #166534; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              🌿
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: #166534;">The Solution</h3>
          </div>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.75rem; color: #475569; font-size: 0.95rem;">
            <li style="display: flex; gap: 0.5rem;">
              <span style="color: #16a34a; font-weight: bold;">✓</span>
              Empowers existing Panchayat tippers, tractors, and e-loaders without replacing local workers.
            </li>
            <li style="display: flex; gap: 0.5rem;">
              <span style="color: #16a34a; font-weight: bold;">✓</span>
              On-demand pickup bookings for rural households with photo upload and scheduled timeslots.
            </li>
            <li style="display: flex; gap: 0.5rem;">
              <span style="color: #16a34a; font-weight: bold;">✓</span>
              Intelligent route sequencing groups stops logically to cut fuel consumption by up to 24%.
            </li>
            <li style="display: flex; gap: 0.5rem;">
              <span style="color: #16a34a; font-weight: bold;">✓</span>
              Mandatory driver photographic proof upon completion guarantees operational accountability.
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- How the System Works -->
    <section id="how-it-works" style="margin-bottom: 3.5rem;">
      <div style="text-align: center; margin-bottom: 2.5rem;">
        <h2 style="font-size: 1.75rem; font-weight: 700; color: #0f172a;">How The 5-Step System Works</h2>
        <p style="color: #64748b; max-width: 600px; margin: 0.5rem auto 0 auto;">
          A connected, closed-loop workflow uniting citizens, officials, and field drivers.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="card" style="text-align: center; position: relative;">
          <div style="width: 44px; height: 44px; margin: 0 auto 0.75rem; background: #e0f2fe; color: #0284c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">1</div>
          <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.35rem;">Request Pickup</h4>
          <p style="font-size: 0.825rem; color: #64748b;">Citizen books waste type, quantity, preferred time and uploads waste photo.</p>
        </div>

        <div class="card" style="text-align: center; position: relative;">
          <div style="width: 44px; height: 44px; margin: 0 auto 0.75rem; background: #fef3c7; color: #d97706; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">2</div>
          <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.35rem;">Admin Verifies</h4>
          <p style="font-size: 0.825rem; color: #64748b;">Panchayat official reviews request and assigns an available driver in the ward.</p>
        </div>

        <div class="card" style="text-align: center; position: relative;">
          <div style="width: 44px; height: 44px; margin: 0 auto 0.75rem; background: #dbeafe; color: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">3</div>
          <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.35rem;">Optimized Route</h4>
          <p style="font-size: 0.825rem; color: #64748b;">Driver receives sequenced stops and follows the route to citizen's door.</p>
        </div>

        <div class="card" style="text-align: center; position: relative;">
          <div style="width: 44px; height: 44px; margin: 0 auto 0.75rem; background: #f3e8ff; color: #7e22ce; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">4</div>
          <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.35rem;">Proof Upload</h4>
          <p style="font-size: 0.825rem; color: #64748b;">Driver loads waste and takes a mandatory completion photo on site.</p>
        </div>

        <div class="card" style="text-align: center; position: relative;">
          <div style="width: 44px; height: 44px; margin: 0 auto 0.75rem; background: #dcfce7; color: #166534; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">5</div>
          <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.35rem;">Verified Close</h4>
          <p style="font-size: 0.825rem; color: #64748b;">Citizen and Admin inspect completion photo. Record is permanently archived.</p>
        </div>
      </div>
    </section>

    <!-- Three User Roles Overview -->
    <section style="margin-bottom: 3.5rem;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h2 style="font-size: 1.75rem; font-weight: 700; color: #0f172a;">Three Dedicated Portals</h2>
        <p style="color: #64748b;">Tailored interfaces designed specifically for each role's requirements.</p>
      </div>

      <div class="features-grid">
        <div class="feature-box" style="border-top: 4px solid #2563eb;">
          <div style="font-size: 2rem; margin-bottom: 0.75rem;">🏡</div>
          <h3>1. Citizen Portal</h3>
          <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1rem;">
            Designed mobile-first for rural families. Submit pickup requests in seconds, track vehicle arrival on a live 7-step timeline, and file grievance complaints.
          </p>
          <ul style="font-size: 0.85rem; color: #475569; margin-left: 1.25rem; margin-bottom: 1.25rem;">
            <li>Book household, plastic, and e-waste</li>
            <li>Live step-by-step progress tracking</li>
            <li>Inspect driver completion proof</li>
            <li>Grievance redressal desk</li>
          </ul>
          <button class="btn btn-outline btn-sm w-100 role-preview-btn" data-role="citizen">Open Citizen Portal</button>
        </div>

        <div class="feature-box" style="border-top: 4px solid #d97706;">
          <div style="font-size: 2rem; margin-bottom: 0.75rem;">🚛</div>
          <h3>2. Driver Portal</h3>
          <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1rem;">
            Streamlined for waste collection operators. View assigned stops, see citizen waste photos before arrival, follow route waypoints, and upload completion proof.
          </p>
          <ul style="font-size: 0.85rem; color: #475569; margin-left: 1.25rem; margin-bottom: 1.25rem;">
            <li>Strictly isolated to assigned pickups</li>
            <li>One-tap status updates (On the way, Arrived)</li>
            <li>Mandatory completion proof camera upload</li>
            <li>Today's sequenced route map</li>
          </ul>
          <button class="btn btn-outline btn-sm w-100 role-preview-btn" data-role="driver">Open Driver Portal</button>
        </div>

        <div class="feature-box" style="border-top: 4px solid #166534;">
          <div style="font-size: 2rem; margin-bottom: 0.75rem;">🏛️</div>
          <h3>3. Admin / Panchayat Official</h3>
          <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1rem;">
            Full command center for Panchayat Development Officers and Sarpanch. Verify requests, assign drivers based on capacity, track live fleet, and resolve complaints.
          </p>
          <ul style="font-size: 0.85rem; color: #475569; margin-left: 1.25rem; margin-bottom: 1.25rem;">
            <li>Central pickup request management</li>
            <li>Fleet &amp; Driver roster control</li>
            <li>Simulated GPS Live Tracking map</li>
            <li>Automated route waypoint optimization</li>
          </ul>
          <button class="btn btn-outline btn-sm w-100 role-preview-btn" data-role="admin">Open Admin Portal</button>
        </div>
      </div>
    </section>

    <!-- Call to Action -->
    <section id="benefits" class="card" style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1px solid #bbf7d0; text-align: center; padding: 3rem 1.5rem;">
      <h2 style="font-size: 1.75rem; font-weight: 700; color: #166534; margin-bottom: 0.75rem;">
        Ready to Clean Our Communities Together?
      </h2>
      <p style="color: #15803d; max-width: 600px; margin: 0 auto 1.5rem auto; font-size: 1rem;">
        Experience the live working prototype with pre-loaded Gram Panchayat accounts and test the full 24-step waste collection lifecycle.
      </p>
      <button class="btn btn-primary btn-lg" id="cta-btn-login" style="box-shadow: var(--shadow-md);">
        Enter Demonstration Portal
      </button>
    </section>
  `;

  // Attach event handlers
  container.querySelector('#hero-btn-login').onclick = () => onNavigate('login');
  container.querySelector('#cta-btn-login').onclick = () => onNavigate('login');

  const howBtn = container.querySelector('#hero-btn-how');
  if (howBtn) {
    howBtn.onclick = () => {
      const section = container.querySelector('#how-it-works');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    };
  }

  container.querySelectorAll('.role-preview-btn').forEach(btn => {
    btn.onclick = () => {
      const role = btn.getAttribute('data-role');
      onNavigate(`login?role=${role}`);
    };
  });
}
