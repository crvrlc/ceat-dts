import { useState, useEffect } from 'react';
import { Modal, Form } from 'react-bootstrap';
import documentTypeService from '../services/documentTypeService';
import documentService from '../services/documentService';
import '../css/SubmitModal.css';
import toast from 'react-hot-toast';

export default function SubmitDocumentModal({ show, onHide, onSuccess }) {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [formData, setFormData] = useState({
    documentTypeId: '',
    submissionMethod: 'online',
    releaseMethod: 'online',
    notes: '',
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (show) fetchDocumentTypes();
  }, [show]);

  const fetchDocumentTypes = async () => {
    try {
      const data = await documentTypeService.getAll();
      setDocumentTypes(data.documentTypes.filter(dt => dt.isActive));
    } catch (err) {
      console.error('Error fetching document types:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'submissionMethod' && value === 'in_person' ? { file: null } : {}),
    }));
    if (name === 'submissionMethod' && value === 'in_person') setFileName('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.documentTypeId) { setError('Please select a document type.'); return; }
    if (formData.submissionMethod === 'online' && !formData.file) { setError('Please select a file to upload.'); return; }

    setLoading(true);
    try {
      const submitData = new FormData();
      if (formData.file) {
        submitData.append('file', formData.file);
        submitData.append('originalFileName', formData.file.name); 
      }
      submitData.append('documentTypeId', formData.documentTypeId);
      submitData.append('submissionMethod', formData.submissionMethod);
      submitData.append('releaseMethod', formData.releaseMethod);
      submitData.append('notes', formData.notes);

      const response = await documentService.submit(submitData);

      toast.success(`Document submitted! Tracking code: ${response.trackingCode}`, { duration: 5000 });
      resetForm();
      if (onSuccess) onSuccess();
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ documentTypeId: '', submissionMethod: 'online', releaseMethod: 'online', notes: '', file: null });
    setFileName('');
    setError('');
  };

  const handleClose = () => { resetForm(); onHide(); };

  return (
    <Modal show={show} onHide={handleClose} centered scrollable>
      <Modal.Header closeButton className="sm-modal-header">
        <Modal.Title className="sm-modal-title">Submit New Document</Modal.Title>
      </Modal.Header>

      <Modal.Body className="sm-modal-body">

        {/* OCS Guidelines hint */}
        <div className="sm-guidelines-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          View procedure & requirements:{' '}
          <a href="https://ceatocs.uplb.edu.ph/ceat-downloadable-forms/" target="_blank" rel="noreferrer">
          here
          </a>
        </div>
        {error && (
          <div className="sm-alert sm-alert--error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <Form onSubmit={handleSubmit} noValidate>

          {/* Document Type */}
          <div className="sm-field">
            <label className="sm-label">Document Type <span className="sm-required">*</span></label>
            <Form.Select className="sm-select" name="documentTypeId" value={formData.documentTypeId} onChange={handleChange}>
              <option value="">Select document type...</option>
              {documentTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </Form.Select>
          </div>

          {/* Submission + Release */}
          <div className="sm-row">
            <div className="sm-field">
              <label className="sm-label">Submission Method <span className="sm-required">*</span></label>
              <Form.Select className="sm-select" name="submissionMethod" value={formData.submissionMethod} onChange={handleChange}>
                <option value="online">Online</option>
                <option value="in_person">In-Person</option>
              </Form.Select>
              {formData.submissionMethod === 'in_person' && (
                <p className="sm-hint">Please bring your documents to the CEAT OCS.</p>
              )}
            </div>

            <div className="sm-field">
              <label className="sm-label">Release Preference <span className="sm-required">*</span></label>
              <Form.Select className="sm-select" name="releaseMethod" value={formData.releaseMethod} onChange={handleChange}>
                <option value="online">Online</option>
                <option value="in_person">In-Person</option>
              </Form.Select>
              {formData.releaseMethod === 'online' && (
                <p className="sm-hint">Document will be sent via email.</p>
              )}
              {formData.releaseMethod === 'in_person' && (
                <p className="sm-hint">Pick-up document at CEAT OCS.</p>
              )}
            </div>
          </div>

          {/* File Upload (Online only) */}
          {formData.submissionMethod === 'online' && (
            <div className="sm-field">
              <label className="sm-label">Upload File <span className="sm-required">*</span></label>
              <label className="sm-file-label">
                <input type="file" className="sm-file-input" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                <span className="sm-file-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </span>
                <span className="sm-file-text">{fileName || 'Choose file...'}</span>
              </label>
              <p className="sm-hint">Accepted: PDF, JPG, PNG · Max 10MB</p>
            </div>
          )}

          {/* Notes */}
          <div className="sm-field">
            <label className="sm-label">Notes <span className="sm-optional">(optional)</span></label>
            <textarea
              className="sm-textarea"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Add any special instructions or additional information here."
            />
          </div>

          {/* Actions */}
          <div className="sm-actions">
            <button type="button" className="sm-btn sm-btn--cancel" onClick={handleClose}>Cancel</button>
            <button type="submit" className="sm-btn sm-btn--submit" disabled={loading}>
              {loading ? <><span className="sm-spinner" />Submitting...</> : 'Submit Document'}
            </button>
          </div>

        </Form>
      </Modal.Body>
    </Modal>
  );
}