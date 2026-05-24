import { useState, useEffect, useCallback } from 'react';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import api from '../utils/api';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import '../css/ManageStudents.css';

export default function ManageStudents() {
  const [registrations, setRegistrations] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const [showBulkForm, setShowBulkForm] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchData = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/student-registrations', {
        params: { page, limit: 20, search: searchInput }
      });
      setRegistrations(res.data.registrations);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [searchInput]);

  useEffect(() => {
    const delay = setTimeout(() => { fetchData(1); }, 300);
    return () => clearTimeout(delay);
  }, [fetchData, searchInput]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await api.post('/student-registrations', { email: newEmail.trim() });
      toast.success('Student registered successfully!');
      setNewEmail('');
      setShowAddForm(false);
      fetchData(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register student');
    } finally {
      setAddLoading(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile) { toast.error('Please select a CSV file'); return; }
    setBulkLoading(true);
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
    try {
      let students = [];

      // Try with header first
      students = results.data
        .map(row => ({ email: (row.email || row.Email || row.EMAIL || '').trim() }))
        .filter(s => s.email !== '');

      // If no emails found, try treating first column as email (no header)
      if (students.length === 0 && results.data.length > 0) {
        const firstKey = Object.keys(results.data[0])[0];
        students = results.data
          .map(row => ({ email: (row[firstKey] || '').trim() }))
          .filter(s => s.email !== '' && s.email.includes('@'));
      }

      if (students.length === 0) {
        toast.error('No valid emails found. Make sure your CSV has an "email" column or contains emails in the first column.');
        setBulkLoading(false);
        return;
      }

      const res = await api.post('/student-registrations/bulk', { students });
      setCsvFile(null);
      setCsvFileName('');
      document.getElementById('csv-file-input').value = '';
      setShowBulkForm(false);
      toast.success(`Upload complete: ${res.data.added} added, ${res.data.skipped} skipped.`, { duration: 5000 });
      fetchData(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk upload failed');
    } finally {
      setBulkLoading(false);
    }
  },
        error: () => { toast.error('Failed to parse CSV file.'); setBulkLoading(false); }
      });
    };

  const handleDelete = (reg) => { setSelectedStudent(reg); setShowDeleteModal(true); };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/student-registrations/${selectedStudent.id}`);
      setShowDeleteModal(false);
      toast.success('Student removed successfully.');
      fetchData(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const handleToggleBulk = () => { setShowBulkForm(!showBulkForm); setShowAddForm(false); };
  const handleToggleAdd  = () => { setShowAddForm(!showAddForm); setShowBulkForm(false); };

  return (
    <div className="ms-page">

      {/* Header */}
      <div className="ms-header">
        <div>
          <h2 className="ms-title">Manage Students</h2>
          <p className="ms-subtitle">{pagination.total} student{pagination.total !== 1 ? 's' : ''} registered</p>
        </div>
        <div className="ms-header__actions">
          <button className={`ms-btn ${showBulkForm ? 'ms-btn--cancel' : 'ms-btn--outline'}`} onClick={handleToggleBulk}>
            {showBulkForm ? 'Cancel' : 'Bulk Upload'}
          </button>
          <button className={`ms-btn ${showAddForm ? 'ms-btn--cancel' : 'ms-btn--primary'}`} onClick={handleToggleAdd}>
            {showAddForm ? 'Cancel' : '+ Add Student'}
          </button>
        </div>
      </div>

    {/* Add Single Student */}
    {showAddForm && (
      <div className="ms-form-card">
        <div className="ms-form-card__label">Add Single Student</div>
        <p className="ms-form-card__desc">Register a student's UP Mail. They will be able to log in once added.</p>
        <form onSubmit={handleAddStudent} noValidate>
          <div className="ms-form-row">
            <div className="ms-field">
              <label className="ms-label">Email Address <span className="ms-required">*</span></label>
              <input
                type="email"
                className="ms-input"
                placeholder="e.g., jdcruz@up.edu.ph"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="ms-btn-wrapper">
              <button type="submit" className="ms-btn ms-btn--primary" disabled={addLoading}>
                {addLoading ? <><span className="ms-spinner" /> Registering...</> : 'Register'}
              </button>
            </div>
          </div>
        </form>
      </div>
    )}

      {/* Bulk Upload */}
      {showBulkForm && (
        <div className="ms-form-card">
          <div className="ms-form-card__label">Bulk Upload Students</div>
          <p className="ms-form-card__desc">
            Upload a CSV file with an <code>email</code> column.{' '}
            <a
              href="data:text/csv;charset=utf-8,email%0Ajdcruz@up.edu.ph%0Amreyes@up.edu.ph"
              download="students_template.csv"
              className="ms-link"
            >
              Download template
            </a>
          </p>
          <form onSubmit={handleBulkSubmit} noValidate>
            <div className="ms-form-row">
              <div className="ms-field">
                <label className="ms-file-label">
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    className="ms-file-input"
                    onChange={e => {
                      setCsvFile(e.target.files[0]);
                      setCsvFileName(e.target.files[0]?.name || '');
                    }}
                  />
                  <span className="ms-file-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </span>
                  <span className="ms-file-text">{csvFileName || 'Choose CSV file...'}</span>
                </label>
              </div>
              <div className="ms-btn-wrapper">
                <button type="submit" className="ms-btn ms-btn--primary" disabled={bulkLoading}>
                  {bulkLoading ? <><span className="ms-spinner" /> Uploading...</> : 'Upload'}
                </button>
              </div>
            </div>
            <p className="ms-hint">Accepted format: .csv</p>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="ms-filters">
        <div className="ms-filters__row">
          <input
            type="text"
            className="ms-filter-input ms-filter-input--search"
            placeholder="Search by email..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button
            className={`ms-clear-btn${searchInput ? ' ms-clear-btn--active' : ''}`}
            onClick={() => setSearchInput('')}
            disabled={!searchInput}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="ms-table-card">
        {loading ? (
          <div className="ms-loading">Loading students...</div>
        ) : registrations.length === 0 ? (
          <div className="ms-empty">
            <div className="ms-empty__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p className="ms-empty__title">{searchInput ? 'No students match your search' : 'No students registered yet'}</p>
            <p className="ms-empty__sub">{searchInput ? 'Try a different email.' : 'Add a student to get started.'}</p>
          </div>
        ) : (
          <>
            <div className="ms-table-wrapper">
              <table className="ms-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg, i) => (
                    <tr key={reg.id} className={i % 2 === 0 ? 'ms-table__row--even' : ''}>
                      <td>{reg.email}</td>
                      <td>
                        <span className={`ms-status-badge ${reg.isUsed ? 'ms-status-badge--active' : 'ms-status-badge--pending'}`}>
                          <span className="ms-status-badge__dot" />
                          {reg.isUsed ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div className="ms-actions">
                          <button className="ms-btn-remove" onClick={() => handleDelete(reg)}>Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="ms-pagination-wrapper">
                <span className="ms-pagination-info">
                  Page {pagination.page} of {pagination.pages} · {pagination.total} total
                </span>
                <div className="ms-pagination">
                  <button className="ms-page-btn ms-page-btn--nav" onClick={() => fetchData(pagination.page - 1)} disabled={pagination.page <= 1}>← Prev</button>
                  <button className="ms-page-btn ms-page-btn--nav" onClick={() => fetchData(pagination.page + 1)} disabled={pagination.page >= pagination.pages}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDeleteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        itemName={selectedStudent?.email}
      />
    </div>
  );
}