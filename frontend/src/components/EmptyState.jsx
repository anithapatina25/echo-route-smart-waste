import React from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({
  title = 'No Records Found',
  message = 'There are currently no active records or assignments to display.',
  actionLabel = null,
  onAction = null,
  icon: Icon = Inbox
}) {
  return (
    <div style={{
      padding: '3rem 1.5rem',
      textAlign: 'center',
      border: '2px dashed #cbd5e1',
      borderRadius: '12px',
      backgroundColor: '#f8fafc',
      margin: '1.5rem 0'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: '#f1f5f9',
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1rem auto'
      }}>
        <Icon size={24} />
      </div>
      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
        {title}
      </h4>
      <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.25rem auto' }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-sm btn-outline">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
