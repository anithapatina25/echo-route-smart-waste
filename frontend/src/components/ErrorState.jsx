import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

export function ErrorState({ 
  title = 'Service Encountered An Issue', 
  message = 'An unexpected error occurred while communicating with the Echo Route server.',
  onRetry = null,
  onBack = null
}) {
  return (
    <div className="card" style={{ maxWidth: '540px', margin: '2rem auto', textAlign: 'center', padding: '2.5rem 2rem' }}>
      <div style={{
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.25rem auto'
      }}>
        <AlertTriangle size={28} />
      </div>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>
        {message}
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {onRetry && (
          <button onClick={onRetry} className="btn btn-primary">
            <RefreshCw size={16} />
            <span>Try Again</span>
          </button>
        )}
        {onBack && (
          <button onClick={onBack} className="btn btn-secondary">
            <ArrowLeft size={16} />
            <span>Return</span>
          </button>
        )}
      </div>
    </div>
  );
}
