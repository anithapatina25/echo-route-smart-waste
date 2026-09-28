import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading operational data...', subtext = 'Please wait while the system securely connects' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3.5rem 1.5rem',
      textAlign: 'center'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: '#d8f3dc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem',
        color: '#1b4332'
      }}>
        <Loader2 size={26} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1b4332', marginBottom: '0.25rem' }}>
        {message}
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
        {subtext}
      </p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
