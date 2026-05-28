import { useState, useEffect } from 'react';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import documentTypeService from '../services/documentTypeService';
import api from '../utils/api';
import toast from 'react-hot-toast';
import '../css/DocumentTypes.css';

export default function DocumentTypes() {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', code: '', isActive: true, staffId: ''
  });

  useEffect(() => {
    fetchDocumentTypes();
    fetchStaff();
  }, []);

  const fetchDocumentTypes = async () => {
    try {
      setLoading(true);
      const data = await documentTypeService.getAll();
      setDocumentTypes(data.documentTypes);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch document types');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await api.get('/users/staff-and-admin');
      setStaffList(response.data.users);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  const handleAdd = () => {
    setFormData({ name: '', code: '', isActive: true, staffId: '' });
    setEditingId(null);
    setShowForm(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const handleEdit = (docType) => {
    const assignedStaffId = docType.staffAssignments?.[0]?.staff?.id || '';
    setFormData({
      name: docType.name,
      code: docType.code,
      isActive: docType.isActive,
      staffId: assignedStaffId.toString(),
    });
    setEditingId(docType.id);
    setShowForm(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const handleDelete = (docType) => { setSelectedType(docType); setShowDeleteModal(true); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      let docTypeId = editingId;

      if (editingId) {
        await documentTypeService.update(editingId, {
          name: formData.name,
          code: formData.code,
          isActive: formData.isActive,
        });
        toast.success('Document type updated successfully.');
      } else {
        const res = await documentTypeService.create({
          name: formData.name,
          code: formData.code,
          isActive: formData.isActive,
        });
        docTypeId = res.documentType.id;
        toast.success('Document type created successfully.');
      }

      // Handle staff assignment
      const currentAssignment = editingId
        ? documentTypes.find(dt => dt.id === editingId)?.staffAssignments?.[0]?.staff?.id
        : null;

      const newStaffId = formData.staffId ? parseInt(formData.staffId) : null;

      if (newStaffId && newStaffId !== currentAssignment) {
        // Remove old assignment if exists
        if (currentAssignment) {
          await documentTypeService.removeStaff(docTypeId, currentAssignment);
        }
        await documentTypeService.assignStaff(docTypeId, newStaffId);
      } else if (!newStaffId && currentAssignment) {
        // Unassign
        await documentTypeService.removeStaff(docTypeId, currentAssignment);
      }

      resetForm();
      fetchDocumentTypes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save document type');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await documentTypeService.delete(selectedType.id);
      setShowDeleteModal(false);
      toast.success('Document type deleted successfully.');
      fetchDocumentTypes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete document type');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', code: '', isActive: true, staffId: '' });
  };

  return (
    <div className="dt-page">

      {/* Header */}
      <div className="dt-header">
        <div>
          <h2 className="dt-title">Document Types</h2>
          <p className="dt-subtitle">{documentTypes.length} type{documentTypes.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          className={`dt-btn ${showForm ? 'dt-btn--cancel' : 'dt-btn--primary'}`}
          onClick={() => showForm ? resetForm() : handleAdd()}
        >
          {showForm ? 'Cancel' : '+ Add Document Type'}
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="dt-form-card">
          <div className="dt-form-card__label">
            {editingId ? 'Edit Document Type' : 'Add Document Type'}
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="dt-form-grid">
              <div className="dt-field">
                <label className="dt-label">Code <span className="dt-required">*</span></label>
                <input
                  type="text"
                  className="dt-input dt-input--upper"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g., COI"
                  maxLength={10}
                  required
                />
              </div>
              <div className="dt-field">
                <label className="dt-label">Name <span className="dt-required">*</span></label>
                <input
                  type="text"
                  className="dt-input"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Consent of Instructor"
                  required
                />
              </div>
              <div className="dt-field">
                <label className="dt-label">Assigned Staff</label>
                <select
                  className="dt-select"
                  name="staffId"
                  value={formData.staffId}
                  onChange={handleChange}
                >
                  <option value="">— Unassigned —</option>
                  {staffList.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} {staff.position ? `— ${staff.position}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="dt-field dt-field--checkbox">
                <label className="dt-checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    className="dt-checkbox"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>
            <div className="dt-form-actions">
              <button type="submit" className="dt-btn dt-btn--primary" disabled={submitLoading}>
                {submitLoading
                  ? <><span className="dt-spinner" />{editingId ? 'Updating...' : 'Creating...'}</>
                  : editingId ? 'Update Document Type' : 'Create Document Type'
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="dt-table-card">
        {loading ? (
          <div className="dt-loading">Loading document types...</div>
        ) : documentTypes.length === 0 ? (
          <div className="dt-empty">
            <div className="dt-empty__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="9" y1="13" x2="15" y2="13"/>
                <line x1="9" y1="17" x2="12" y2="17"/>
              </svg>
            </div>
            <p className="dt-empty__title">No document types yet</p>
            <p className="dt-empty__sub">Add a document type to get started.</p>
          </div>
        ) : (
          <div className="dt-table-wrapper">
            <table className="dt-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Assigned Staff</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documentTypes.map((docType, i) => {
                  const assignedStaff = docType.staffAssignments?.[0]?.staff;
                  return (
                    <tr key={docType.id} className={i % 2 === 0 ? 'dt-table__row--even' : ''}>
                      <td><span className="dt-code">{docType.code}</span></td>
                      <td className="dt-name">{docType.name}</td>
                      <td>
                        {assignedStaff
                          ? <span className="dt-staff-name">{assignedStaff.name}</span>
                          : <span className="dt-unassigned">Unassigned</span>
                        }
                      </td>
                      <td>
                        <span className={`dt-status-badge ${docType.isActive ? 'dt-status-badge--active' : 'dt-status-badge--inactive'}`}>
                          <span className="dt-status-badge__dot" />
                          {docType.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="dt-actions">
                          <button className="dt-btn-action dt-btn-action--edit" onClick={() => handleEdit(docType)}>Edit</button>
                          <button className="dt-btn-action dt-btn-action--delete" onClick={() => handleDelete(docType)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        itemName={selectedType?.name}
      />
    </div>
  );
}