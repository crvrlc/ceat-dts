import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import '../css/ConfirmDeleteModal.css';

export default function ConfirmDeleteModal({ show, onHide, onConfirm, itemName }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const handleHide = () => {
    if (loading) return;
    onHide();
  };

  return (
    <Modal show={show} onHide={handleHide} centered>
      <Modal.Header closeButton className="cdm-header">
        <h5 className="cdm-title">Confirm Delete</h5>
      </Modal.Header>

      <Modal.Body className="cdm-body">
        <div className="cdm-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>
        <p className="cdm-message">
          Are you sure you want to delete <strong>{itemName}</strong>?
        </p>
        <p className="cdm-sub">This action cannot be undone.</p>
      </Modal.Body>

      <Modal.Footer className="cdm-footer">
        <button className="cdm-btn cdm-btn--cancel" onClick={handleHide} disabled={loading}>
          Cancel
        </button>
        <button className="cdm-btn cdm-btn--delete" onClick={handleConfirm} disabled={loading}>
          {loading
            ? <><span className="cdm-spinner" /> Deleting...</>
            : 'Delete'
          }
        </button>
      </Modal.Footer>
    </Modal>
  );
}