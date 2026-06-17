import { useState, useEffect } from 'react';
import { Modal, Form } from 'react-bootstrap';
import documentService from '../services/documentService';
import api from '../utils/api';
import '../css/UpdateModal.css';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  submitted:     'Submitted',
  received:      'Received',
  processing:    'Processing',
  action_required:  'Action Required',
  for_signature: 'For Signature',
  completed:     'Completed',
  released:      'Released',
  rejected:      'Rejected',
};

export default function UpdateModal({ show, onHide, document, onSuccess }) {
  const [assigneeList, setAssigneeList] = useState([]);
  const [fileName, setFileName] = useState('');
  const [formData, setFormData] = useState({
    status: '',
    reassignToStaffId: '',
    remarks: '',
    file: null,
    notifyStudent: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) fetchAssigneeList();
  }, [show]);

  useEffect(() => {
    if (document) {
      // try assignedStaffId first, then fall back to document type's default staff
      const staffId = document.assignedStaffId?.toString() 
        || document.documentType?.staffAssignments?.[0]?.staff?.id?.toString() 
        || '';
      setFormData({
        status: document.status,
        reassignToStaffId: staffId,
        remarks: '',
        file: null,
        notifyStudent: false,
      });
    }
  }, [document, assigneeList]);

  const fetchAssigneeList = async () => {
    try {
      const response = await api.get('/users/staff-and-admin');
      setAssigneeList(response.data.users);
    } catch (err) {
      console.error('Error fetching staff list:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, file });
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const statusChanged     = formData.status && formData.status !== document.status;
    const assignmentChanged = formData.reassignToStaffId !== (document.assignedStaffId?.toString() || '');
    const hasRemarks        = formData.remarks?.trim() !== '';
    const hasFile           = formData.file !== null;

    if (!statusChanged && !assignmentChanged && !hasRemarks && !hasFile) {
      setError('Please make at least one change (status, assignment, remarks, or file).');
      return;
    }

    if (formData.status === 'rejected' && !formData.remarks?.trim()) {
      setError('Please provide a reason for rejection in the remarks field.');
      return;
    }

    if (formData.status === 'action_required' && !formData.remarks?.trim()) {
      setError('Please provide instructions for the student in the remarks field.');
      return;
    }

    setLoading(true);
    try {
      const response = await documentService.updateStatus(document.id, {
        status: formData.status,
        remarks: formData.remarks || undefined,
        notifyStudent: formData.notifyStudent,
        reassignToStaffId: formData.reassignToStaffId || undefined,
        file: formData.file || undefined,
      });

      if (formData.notifyStudent) {
        const actualStatus = response.document?.status || formData.status;
        await documentService.notifyStudent(document.id, actualStatus, formData.remarks || '');
      }

      setFormData({ status: '', reassignToStaffId: '', remarks: '', file: null, notifyStudent: false });
      setFileName('');
      onHide();
      if (onSuccess) onSuccess();
      toast.success('Document updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update document.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ status: '', reassignToStaffId: '', remarks: '', file: null, notifyStudent: false });
    setFileName('');
    setError('');
    onHide();
  };

  if (!document) return null;

  const showFileUpload = formData.status !== 'submitted' && formData.status !== 'rejected';

  return (
    <Modal show={show} onHide={handleClose} centered scrollable>
      <Modal.Header closeButton className="um-modal-header">
        <Modal.Title className="um-modal-title">
          Update Document <span className="um-tracking-code">— {document.trackingCode}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="um-modal-body">
        {error && (
          <div className="um-alert um-alert--error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <Form onSubmit={handleSubmit} noValidate>

          {/* Submission + Release (read only) */}
          <div className="um-row">
            <div className="um-field">
              <label className="um-label">Submission Method</label>
              <div className="um-readonly">
                {document.submissionMethod === 'online' ? 'Online' : 'In-Person'}
              </div>
            </div>
            <div className="um-field">
              <label className="um-label">Release Method</label>
              <div className="um-readonly">
                {document.releaseMethod === 'online' ? 'Online' : 'In-Person'}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="um-field">
            <label className="um-label">Update Status <span className="um-required">*</span></label>
            <Form.Select className="um-select" name="status" value={formData.status} onChange={handleChange}>
              {Object.entries(STATUS_LABELS)
                .filter(([value]) => {
                  if (value === 'received' && document.submissionMethod === 'online') return false;
                  return true;
                })
                .map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))
              }
            </Form.Select>
          </div>

          {/* File Upload */}
          {showFileUpload && (
            <div className="um-field">
              <label className="um-label">Updated Document</label>
              <label className="um-file-label">
                <input type="file" className="um-file-input" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                <span className="um-file-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </span>
                <span className="um-file-text">{fileName || 'Choose file...'}</span>
              </label>
              <p className="um-hint">
                {formData.status === 'completed' || formData.status === 'released'
                  ? 'Upload the final processed document. This will be available to the student.'
                  : formData.status === 'action_required'
                    ? 'Attach a file requiring student action (optional).'
                    : 'Upload an updated version of the document if changes were made.'}
              </p>
            </div>
          )}

          {/* Reassign */}
          <div className="um-field">
            <label className="um-label">Assign To Staff</label>
            <Form.Select className="um-select" name="reassignToStaffId" value={formData.reassignToStaffId} onChange={handleChange}>
              <option value="">— Select Staff —</option>
                <option value="unassign">Unassign</option>
                {assigneeList.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name} ({staff.email})</option>
                ))}
            </Form.Select>
          </div>

          {/* Remarks */}
          <div className="um-field">
            <label className="um-label">
              {formData.status === 'action_required'
                ? <>Instructions for Student <span className="um-required">*</span></>
                : <>Remarks <span className="um-optional">(optional)</span></>
              }
            </label>
            <textarea
              className="um-textarea"
              name="remarks"
              rows={3}
              placeholder={
                formData.status === 'action_required'
                  ? 'Describe what the student needs to do...'
                  : formData.status === 'rejected'
                    ? 'Provide a reason for rejection...'
                    : 'Add notes, next steps, or rejection reason...'
              }
              value={formData.remarks}
              onChange={handleChange}
            />
          </div>

          {/* Notify student */}
          <div className="um-field um-field--checkbox">
            <label className="um-checkbox-label">
              <input
                type="checkbox"
                name="notifyStudent"
                checked={formData.notifyStudent}
                onChange={handleChange}
                className="um-checkbox"
              />
              <span>Notify student via email about this update</span>
            </label>
          </div>

          {/* Actions */}
          <div className="um-actions">
            <button type="button" className="um-btn um-btn--cancel" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="um-btn um-btn--submit" disabled={loading}>
              {loading ? <><span className="um-spinner" />Updating...</> : 'Update Document'}
            </button>
          </div>

        </Form>
      </Modal.Body>
    </Modal>
  );
}