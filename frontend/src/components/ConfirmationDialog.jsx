import React from 'react';
import { AlertCircle } from 'lucide-react';

export function ConfirmationDialog({
  isOpen,
  title = 'Please Confirm',
  message = 'Are you sure you want to perform this action?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isDanger ? (
              <div style={{ color: '#dc2626', display: 'flex' }}>
                <AlertCircle size={20} />
              </div>
            ) : null}
            <span className="card-title">{title}</span>
          </div>
        </div>
        <div className="card-body">
          <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>
        <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={onCancel} className="btn btn-secondary">
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm} 
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
