import { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import api from '../utils/api';
import toast from 'react-hot-toast';
import '../css/ManageSemesters.css';

export default function ManageSemesters() {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '', schoolYear: '', period: '', isCurrent: false
  });

  useEffect(() => { fetchSemesters(); }, []);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const response = await api.get('/semesters');
      setSemesters(response.data.semesters);
    } catch (err) {
      toast.error('Failed to fetch semesters');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.schoolYear) {
      toast.error('Semester name and school year are required');
      return;
    }
    setSubmitLoading(true);
    try {
      if (editingId) {
        await api.put(`/semesters/${editingId}`, formData);
        toast.success('Semester updated successfully');
      } else {
        await api.post('/semesters', formData);
        toast.success('Semester created successfully');
      }
      resetForm();
      fetchSemesters();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save semester');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (semester) => {
    setFormData({
      name: semester.name,
      schoolYear: semester.schoolYear,
      period: semester.period || '',
      isCurrent: semester.isCurrent
    });
    setEditingId(semester.id);
    setShowForm(true);
    windoe.scrollTo({ top: 0, behavior: 'smooth' });  
  };

  const handleSetCurrent = async (id) => {
    try {
      await api.patch(`/semesters/${id}/set-current`);
      toast.success('Current semester updated');
      fetchSemesters();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set current semester');
    }
  };

  const handleDeleteClick = (id) => { setDeleteId(id); setShowDeleteModal(true); };

  const confirmDelete = async () => {
    try {
      await api.delete(`/semesters/${deleteId}`);
      toast.success('Semester deleted successfully');
      fetchSemesters();
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (err) {
      setShowDeleteModal(false);
      toast.error(err.response?.data?.message || 'Failed to delete semester');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', schoolYear: '', period: '', isCurrent: false });
  };

  const deletingSemester = semesters.find(s => s.id === deleteId);

  return (
    <div className="sem-page">

      {/* Header */}
      <div className="sem-header">
        <div>
          <h2 className="sem-title">Manage Semesters</h2>
          <p className="sem-subtitle">{semesters.length} semester{semesters.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          className={`sem-btn ${showForm ? 'sem-btn--cancel' : 'sem-btn--primary'}`}
          onClick={() => showForm ? resetForm() : setShowForm(true)}
        >
          {showForm ? 'Cancel' : '+ Add Semester'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="sem-form-card">
          <div className="sem-form-card__label">
            {editingId ? 'Edit Semester' : 'Create New Semester'}
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="sem-form-grid">
              <div className="sem-field">
                <label className="sem-label">Semester Name <span className="sem-required">*</span></label>
                <Form.Select className="sem-select" name="name" value={formData.name} onChange={handleFormChange} required>
                  <option value="">Select semester...</option>
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="Midyear">Midyear</option>
                </Form.Select>
              </div>
              <div className="sem-field">
                <label className="sem-label">School Year <span className="sem-required">*</span></label>
                <input
                  type="text"
                  className="sem-input"
                  name="schoolYear"
                  placeholder="e.g., 2025-2026"
                  value={formData.schoolYear}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="sem-field">
                <label className="sem-label">Period <span className="sem-optional">(optional)</span></label>
                <input
                  type="text"
                  className="sem-input"
                  name="period"
                  placeholder="e.g., August 2025 - January 2026"
                  value={formData.period}
                  onChange={handleFormChange}
                />
              </div>
              <div className="sem-field sem-field--checkbox">
                <label className="sem-checkbox-label">
                  <input
                    type="checkbox"
                    name="isCurrent"
                    className="sem-checkbox"
                    checked={formData.isCurrent}
                    onChange={handleFormChange}
                  />
                  <span>Set as current semester</span>
                </label>
              </div>
            </div>
            <div className="sem-form-actions">
              <button type="submit" className="sem-btn sem-btn--primary" disabled={submitLoading}>
                {submitLoading
                  ? <><span className="sem-spinner" />{editingId ? 'Updating...' : 'Creating...'}</>
                  : editingId ? 'Update Semester' : 'Create Semester'
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="sem-table-card">
        {loading ? (
          <div className="sem-loading">Loading semesters...</div>
        ) : semesters.length === 0 ? (
          <div className="sem-empty">
            <div className="sem-empty__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <p className="sem-empty__title">No semesters yet</p>
            <p className="sem-empty__sub">Create a semester to get started.</p>
          </div>
        ) : (
          <div className="sem-table-wrapper">
            <table className="sem-table">
              <thead>
                <tr>
                  <th>Semester</th>
                  <th>School Year</th>
                  <th>Code</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {semesters.map((semester, i) => (
                  <tr key={semester.id} className={i % 2 === 0 ? 'sem-table__row--even' : ''}>
                    <td className="sem-name">{semester.name}</td>
                    <td>{semester.schoolYear}</td>
                    <td><span className="sem-code">{semester.code}</span></td>
                    <td className="sem-period">{semester.period || <span className="sem-unassigned">—</span>}</td>
                    <td>
                      {semester.isCurrent ? (
                        <span className="sem-status-badge sem-status-badge--current">
                          <span className="sem-status-badge__dot" />
                          Current
                        </span>
                      ) : (
                        <button className="sem-btn-set-current" onClick={() => handleSetCurrent(semester.id)}>
                          Set Current
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="sem-actions">
                        <button className="sem-btn-action sem-btn-action--edit" onClick={() => handleEdit(semester)}>
                          Edit
                        </button>
                        <button className="sem-btn-action sem-btn-action--delete" onClick={() => handleDeleteClick(semester.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        itemName={deletingSemester ? `${deletingSemester.name} ${deletingSemester.schoolYear}` : ''}
      />
    </div>
  );
}