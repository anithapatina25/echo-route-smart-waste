import React from 'react';
import { 
  Leaf, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Camera, 
  Users, 
  TrendingUp, 
  FileText 
} from 'lucide-react';

export function LandingPage({ onNavigate }) {
  return (
    <div>
      {/* 2. Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-tag">
            <Leaf size={16} />
            <span>Gram Panchayat Smart Sanitation Platform</span>
          </div>
          <h1 className="hero-title">
            ECHO ROUTE SMART WASTE
          </h1>
          <p className="hero-tagline">
            "Smarter Routes. Cleaner Communities."
          </p>
          <p className="hero-desc">
            A specialized full-stack public service system designed for rural Gram Panchayats. 
            Empowering existing sanitation vehicles, drivers, and local staff with dynamic route optimization, 
            instant citizen requests, and transparent photographic completion proof.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('/login')} className="btn btn-primary btn-lg">
              <span>Access Dedicated Portals</span>
              <ArrowRight size={18} />
            </button>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">
              <span>Explore How It Works</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. Problem Section */}
      <section style={{ padding: '4rem 0', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3rem auto' }}>
            <span className="badge badge-warning" style={{ marginBottom: '0.75rem' }}>Operational Bottlenecks</span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem' }}>
              The Rural Waste-Collection Challenge
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Traditional rural sanitation systems face severe coordination friction that strains Panchayat budgets and leaves citizens underserved.
            </p>
          </div>

          <div className="grid-4">
            <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #b45309' }}>
              <div style={{ color: '#b45309', marginBottom: '0.75rem' }}>
                <AlertCircle size={26} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
                Unorganized Requests
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' }}>
                Citizens lack a formal channel to schedule waste pickups, leading to unattended roadside dumps and informal burning.
              </p>
            </div>

            <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #b45309' }}>
              <div style={{ color: '#b45309', marginBottom: '0.75rem' }}>
                <Truck size={26} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
                Uncoordinated Fleets
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' }}>
                Panchayat tippers and tractors drive unplanned circuits, wasting 25%+ in diesel and missing critical rural wards.
              </p>
            </div>

            <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #b45309' }}>
              <div style={{ color: '#b45309', marginBottom: '0.75rem' }}>
                <Clock size={26} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
                Zero Pickup Visibility
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' }}>
                Households never know when collection vehicles will arrive, causing frustration and missed scheduled handoffs.
              </p>
            </div>

            <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #b45309' }}>
              <div style={{ color: '#b45309', marginBottom: '0.75rem' }}>
                <FileText size={26} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
                No Digital Records
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' }}>
                Paper logs and verbal reports lack verification, making it impossible to audit driver completion or resolve grievances.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Solution Section */}
      <section style={{ padding: '4rem 0', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3rem auto' }}>
            <span className="badge badge-success" style={{ marginBottom: '0.75rem' }}>The Echo Route Solution</span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#122b20', marginBottom: '0.75rem' }}>
              A Unified Closed-Loop Civic Network
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Echo Route seamlessly bridges the three vital stakeholders of rural municipal sanitation without replacing human workers.
            </p>
          </div>

          <div className="grid-3" style={{ textAlign: 'center' }}>
            <div className="card" style={{ padding: '2rem 1.5rem', borderTop: '4px solid #16a34a' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dcfce7',
                color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto'
              }}>
                <Users size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>1. Citizen</h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: '1.5' }}>
                Books categorized waste pickups, uploads photos, tracks driver arrival in real time, and rates service.
              </p>
            </div>

            <div className="card" style={{ padding: '2rem 1.5rem', borderTop: '4px solid #6b21a8' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#f3e8ff',
                color: '#6b21a8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto'
              }}>
                <ShieldCheck size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>2. Admin (Rural & Gram Panchayat)</h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: '1.5' }}>
                Verifies requests, auto-clusters stops into optimized routes, assigns fleet drivers, and monitors telemetry.
              </p>
            </div>

            <div className="card" style={{ padding: '2rem 1.5rem', borderTop: '4px solid #b45309' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fef3c7',
                color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto'
              }}>
                <Truck size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>3. Driver</h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: '1.5' }}>
                Follows optimized stop sequences, updates one-touch progress, and uploads mandatory photographic completion proof.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works (6-Step Lifecycle) */}
      <section id="how-it-works" style={{ padding: '4.5rem 0', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem auto' }}>
            <span className="badge badge-info" style={{ marginBottom: '0.75rem' }}>Operational Workflow</span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem' }}>
              End-to-End 6-Step Waste Collection Lifecycle
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Every pickup follows a transparent, tamper-resistant digital chain of custody.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '1rem',
            position: 'relative'
          }}>
            {[
              { step: '1', title: 'Citizen Requests', desc: 'Household books pickup & attaches photo' },
              { step: '2', title: 'Admin Verifies', desc: 'Panchayat approves volume & ward' },
              { step: '3', title: 'Driver Assigned', desc: 'Stops clustered into optimal route' },
              { step: '4', title: 'Driver Collects', desc: 'Driver navigates & collects at doorstep' },
              { step: '5', title: 'Proof Uploaded', desc: 'Driver snaps clean site photo & weight' },
              { step: '6', title: 'Verified Closed', desc: 'Citizen & Admin confirm completion' }
            ].map((item, idx) => (
              <div key={idx} className="card" style={{ padding: '1.25rem 1rem', textAlign: 'center', position: 'relative' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1b4332',
                  color: '#fff', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 0.75rem auto'
                }}>
                  {item.step}
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: '1.4' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Key Features & 7. Role Overviews */}
      <section style={{ padding: '4rem 0', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3rem auto' }}>
            <span className="badge badge-success" style={{ marginBottom: '0.75rem' }}>Role-Based Architecture</span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem' }}>
              Built Specifically for Rural Ground Realities
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Three isolated, purpose-built interfaces designed for low bandwidth and high usability.
            </p>
          </div>

          <div className="grid-3">
            <div className="card">
              <div className="card-header" style={{ backgroundColor: '#f0fdf4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={20} style={{ color: '#16a34a' }} />
                  <span className="card-title" style={{ fontSize: '1.05rem', color: '#166534' }}>Citizen Portal</span>
                </div>
                <span className="badge badge-success">Mobile First</span>
              </div>
              <div className="card-body">
                <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.88rem', color: '#475569', lineHeight: '1.8' }}>
                  <li>✓ 1-click pickup scheduling (Dry, Wet, E-Waste)</li>
                  <li>✓ Camera photo upload of waste piles</li>
                  <li>✓ Real-time 7-stage visual timeline</li>
                  <li>✓ Grievance reporting with token tracking</li>
                </ul>
              </div>
              <div className="card-footer">
                <button onClick={() => onNavigate('/login')} className="btn btn-outline btn-sm btn-block">
                  Open Citizen Portal
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-header" style={{ backgroundColor: '#fffbeb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Truck size={20} style={{ color: '#b45309' }} />
                  <span className="card-title" style={{ fontSize: '1.05rem', color: '#92400e' }}>Driver Portal</span>
                </div>
                <span className="badge badge-warning">Task Focused</span>
              </div>
              <div className="card-body">
                <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.88rem', color: '#475569', lineHeight: '1.8' }}>
                  <li>✓ Sequenced daily stop queue for Ward tractor</li>
                  <li>✓ Turn-by-turn waypoint routing guidance</li>
                  <li>✓ One-tap status updates (En Route / Arrived)</li>
                  <li>✓ Mandatory camera completion proof upload</li>
                </ul>
              </div>
              <div className="card-footer">
                <button onClick={() => onNavigate('/login')} className="btn btn-outline btn-sm btn-block">
                  Open Driver Portal
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-header" style={{ backgroundColor: '#faf5ff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={20} style={{ color: '#6b21a8' }} />
                  <span className="card-title" style={{ fontSize: '1.05rem', color: '#581c87' }}>Admin Command Center</span>
                </div>
                <span className="badge badge-purple" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8' }}>Official</span>
              </div>
              <div className="card-body">
                <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.88rem', color: '#475569', lineHeight: '1.8' }}>
                  <li>✓ Central operational pickup queue oversight</li>
                  <li>✓ Dynamic vehicle & driver roster management</li>
                  <li>✓ Route clustering with fuel optimization metrics</li>
                  <li>✓ Gram Panchayat Swachh Bharat analytics</li>
                </ul>
              </div>
              <div className="card-footer">
                <button onClick={() => onNavigate('/login')} className="btn btn-outline btn-sm btn-block">
                  Open Admin Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Benefits Section */}
      <section style={{ padding: '4rem 0', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
            borderRadius: '16px',
            padding: '3rem 2.5rem',
            color: '#fff'
          }}>
            <div className="grid-2" style={{ alignItems: 'center' }}>
              <div>
                <span style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Public Service Impact
                </span>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '1rem 0', lineHeight: '1.2' }}>
                  Empowering Existing Rural Sanitation Workers
                </h2>
                <p style={{ color: '#d8f3dc', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  Echo Route does not replace Panchayat drivers or sanitation staff. Instead, it provides them with modern tools to eliminate wasted fuel, organize chaotic collection routes, and document their diligent service with indisputable photographic records.
                </p>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#86efac' }}>+25%</div>
                    <div style={{ fontSize: '0.8rem', color: '#d8f3dc' }}>Fuel & Route Efficiency</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#86efac' }}>100%</div>
                    <div style={{ fontSize: '0.8rem', color: '#d8f3dc' }}>Digital Verification</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#86efac' }}>0</div>
                    <div style={{ fontSize: '0.8rem', color: '#d8f3dc' }}>Worker Displacement</div>
                  </div>
                </div>
              </div>

              {/* 9. Login Action Card */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '2rem',
                color: '#1e293b',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#122b20', marginBottom: '0.5rem' }}>
                  Ready to access the platform?
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  Choose your dedicated Gram Panchayat role and log in with pre-configured demo credentials.
                </p>
                <button onClick={() => onNavigate('/login')} className="btn btn-primary btn-block btn-lg">
                  <span>Enter Central Login Portal</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
