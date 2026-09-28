import React from 'react';
import { Leaf, ShieldCheck, MapPin } from 'lucide-react';

export function Footer({ onNavigate }) {
  return (
    <footer className="civic-footer">
      <div className="container">
        <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <div style={{ background: '#2d6a4f', padding: '0.4rem', borderRadius: '6px', color: '#fff', display: 'flex' }}>
                <Leaf size={18} />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>ECHO ROUTE SMART WASTE</h4>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6' }}>
              A public-service technology prototype empowering Gram Panchayats with precision route clustering, vehicle optimization, and citizen accountability.
            </p>
          </div>

          <div>
            <h4>Three Dedicated Portals</h4>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '2' }}>
              <li>
                <span onClick={() => onNavigate('/login')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                  Citizen Portal (Ward Pickup Booking & Tracking)
                </span>
              </li>
              <li>
                <span onClick={() => onNavigate('/login')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                  Driver Portal (Optimized Route & Photo Proof)
                </span>
              </li>
              <li>
                <span onClick={() => onNavigate('/login')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                  Admin Command Center
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4>Civic Public Commitment</h4>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #52b788' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#86efac', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <ShieldCheck size={16} />
                <span>Empowering Existing Workers</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
                This platform is engineered to maximize fuel efficiency and support existing Panchayat drivers and sanitation workers, rather than replacing them.
              </p>
            </div>
          </div>
        </div>

        <div className="civic-footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} Echo Route Smart Waste System. Gram Panchayat Technology Initiative.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Privacy Policy</span>
            <span>Citizen Charter</span>
            <span>Accessibility Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
