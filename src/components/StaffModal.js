import { useState, useEffect } from 'react';
import { Modal, Form } from 'react-bootstrap';
import '../css/StaffModal.css';

export default function StaffModal({ show, onHide, onSave, staff }) {
  const [formData, setFormData] = useState({ role: 'staff', position: '' });

  useEffect(() => {
    if (staff) {
      setFormData({ role: staff.role, position: staff.position || '' });
    }
  }, [staff, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!staff) return null;

  return (
    <Modal show={show} onHide={onHide} centered scrollable>
      <Modal.Header closeButton className="stm-modal-header">
        <div className="stm-modal-title">Edit Staff</div>
      </Modal.Header>

      <Modal.Body className="stm-modal-body">
        <form onSubmit={handleSubmit} noValidate>
          <div className="stm-row">
            <div className="stm-field">
              <label className="stm-label">Name</label>
              <div className="stm-readonly">{staff.name}</div>
            </div>
            <div className="stm-field">
              <label className="stm-label">Email</label>
              <div className="stm-readonly">{staff.email}</div>
            </div>
          </div>

          <div className="stm-field">
            <label className="stm-label">Position <span className="stm-required">*</span></label>
            <input
              type="text"
              className="stm-input"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="e.g., Junior Office Assistant"
              required
            />
          </div>

          <div className="stm-field">
            <label className="stm-label">Role <span className="stm-required">*</span></label>
            <Form.Select
              className="stm-select"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </Form.Select>
          </div>

          <div className="stm-actions">
            <button type="button" className="stm-btn stm-btn--cancel" onClick={onHide}>
              Cancel
            </button>
            <button type="submit" className="stm-btn stm-btn--submit">
              Save Changes
            </button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
}