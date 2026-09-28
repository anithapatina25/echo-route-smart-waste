import React from 'react';
import { 
  Compass, 
  Map, 
  BarChart3, 
  Settings, 
  ArrowLeft, 
  Radio, 
  Route, 
  FileSpreadsheet, 
  SlidersHorizontal,
  CheckCircle2,
  Clock
} from 'lucide-react';

export function AdminPlaceholdersView({ activeTab, onReturnToOverview }) {
  const configs = {
    tracking: {
      title: 'Real-Time Fleet GIS Live Tracking',
      subtitle: 'Vehicle GPS Telemetry, Ward Geofencing & Real-Time Driver Locations',
      icon: Radio,
      stage: 'Scheduled for Stage 6: Real-Time GIS Tracking & Waypoint Optimization',
      color: '#0284c7',
      bg: '#e0f2fe',
      features: [
        'Live driver telemetry and real-time GPS coordinates stream',
        'Interactive Panchayat ward boundaries and geofenced collection zones',
        'Active vehicle speed, turn-by-turn tracking, and halt detection',
        'Direct dispatcher alerts for off-route deviations and delayed stops'
      ]
    },
    routes: {
      title: 'Panchayat Waste Collection Routes & Clustering',
      subtitle: 'Route Optimization, Fuel Economy & Segregated Waste Transfer Centers',
      icon: Route,
      stage: 'Scheduled for Stage 5 & 6: Smart Route Engine & Cluster Dispatch',
      color: '#2d6a4f',
      bg: '#d8f3dc',
      features: [
        'Automated TSP (Traveling Salesperson) route optimization for rural roads',
        'Ward-level collection schedules (Wet waste, Dry waste, Hazardous waste)',
        'Designated rural dump yard and compost pit transit corridors',
        'Turn-by-turn navigational directions exportable to driver devices'
      ]
    },
    reports: {
      title: 'Swachh Bharat Analytics & Compliance Reports',
      subtitle: 'Monthly Waste Tonnage, Citizen Participation & Ward Performance Scorecards',
      icon: FileSpreadsheet,
      stage: 'Scheduled for Stage 7: Analytics, Audit Logs & Compliance Reporting',
      color: '#b45309',
      bg: '#fef3c7',
      features: [
        'Swachh Bharat Gramin annual and monthly audit logs generation',
        'Weight metrics by waste category (Biodegradable, Recyclable, Hazardous)',
        'Driver efficiency ratings, on-time collection percentages, and fuel usage',
        'Instant export to PDF reports, Excel spreadsheets, and State portal feeds'
      ]
    },
    settings: {
      title: 'Gram Panchayat System Settings & Configuration',
      subtitle: 'Ward Boundary Parameters, User Access Controls & Notification Webhooks',
      icon: SlidersHorizontal,
      stage: 'Scheduled for Stage 7: Administrative Configuration & Custom Rules',
      color: '#6b21a8',
      bg: '#f3e8ff',
      features: [
        'Gram Panchayat profile, official seal, and designation management',
        'Ward demarcations, population density maps, and sanitation supervisor assignees',
        'SMS gateway, WhatsApp notifications, and citizen grievance escalation timers',
        'System backup policies and automated database maintenance schedules'
      ]
    }
  };

  const config = configs[activeTab] || configs.tracking;
  const IconComponent = config.icon;

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '1rem 0 3rem' }}>
      <div className="card" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
        {/* Module Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '16px',
          backgroundColor: config.bg,
          color: config.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}>
          <IconComponent size={36} />
        </div>

        {/* Badge & Stage */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#f1f5f9', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '1rem' }}>
          <Clock size={14} />
          {config.stage}
        </div>

        {/* Title & Subtitle */}
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          {config.title}
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#64748b', maxWidth: '620px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          {config.subtitle}. The backend schema and foundation hooks are ready in the database. This module will activate during the upcoming release phase.
        </p>

        {/* Feature Roadmap Checklist */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'left',
          marginBottom: '2rem'
        }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.04em' }}>
            Planned Capabilities for this Module:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {config.features.map((feat, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <CheckCircle2 size={18} color={config.color} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.88rem', color: '#1e293b', lineHeight: 1.5 }}>
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={onReturnToOverview}
          className="btn btn-primary"
          style={{ backgroundColor: '#6b21a8', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} />
          <span>Return to Central Command Center</span>
        </button>
      </div>
    </div>
  );
}
