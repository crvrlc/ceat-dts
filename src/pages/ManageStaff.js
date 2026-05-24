import { useState, useEffect } from 'react';
import StaffModal from '../components/StaffModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import api from '../utils/api';
import toast from 'react-hot-toast';
import '../css/ManageStaff.css';

export default function ManageStaff() {
  const [staff, setStaff] = useState([]);
  const [preRegistered, setPreRegistered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPosition, setNewStaffPosition] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('staff');
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, regRes] = await Promise.all([
        api.get('/users/staff-and-admin?showAll=true'),
        api.get('/staff-registrations')
      ]);
      setStaff(staffRes.data.users);
      setPreRegistered(regRes.data.registrations);
      setError('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaffEmail = async (e) => {
    e.preventDefault();
    if (!newStaffEmail.trim()) { toast.error('Please enter an email address'); return; }
    setAddLoading(true);
    try {
      await api.post('/staff-registrations', {
        email: newStaffEmail.trim(),
        position: newStaffPosition,
        role: newStaffRole
      });
      toast.success('Staff email registered successfully!');
      setNewStaffEmail('');
      setNewStaffPosition('');
      setNewStaffRole('staff');
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register staff email');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteRegistration = async (registration) => {
    try {
      await api.delete(`/staff-registrations/${registration.id}`);
      toast.success('Pre-registration removed.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete registration');
    }
  };

  const handleEdit = (staffMember) => { setSelectedStaff(staffMember); setShowModal(true); };
  const handleDelete = (staffMember) => { setSelectedStaff(staffMember); setShowDeleteModal(true); };

  const handleSave = async (formData) => {
    try {
      await api.patch(`/users/${selectedStaff.id}/role`, {
        role: formData.role,
        position: formData.position
      });
      toast.success('Staff updated successfully!');
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save staff');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/users/${selectedStaff.id}`);
      setShowDeleteModal(false);
      toast.success('Staff deleted successfully.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete staff');
    }
  };

  const handleToggleStatus = async (member) => {
    try {
      await api.patch(`/users/${member.id}/status`);
      toast.success(`${member.name} ${member.isActive ? 'deactivated' : 'activated'} successfully.`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const pendingRegistrations = preRegistered.filter(r => !r.isUsed);
  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="mst-page">

      {/* Header */}
      <div className="mst-header">
        <div>
          <h2 className="mst-title">Manage Staff</h2>
          <p className="mst-subtitle">{staff.length} staff member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          className={`mst-btn ${showAddForm ? 'mst-btn--cancel' : 'mst-btn--primary'}`}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Staff'}
        </button>
      </div>

      {/* Add Staff Form */}
      {showAddForm && (
        <div className="mst-form-card">
          <div className="mst-form-card__label">Pre-Register Staff Email</div>
          <p className="mst-form-card__desc">
            Add an email address to the system. When this person logs in with UP Mail, they will automatically be assigned as staff.
          </p>
          <form onSubmit={handleAddStaffEmail} noValidate>
            <div className="mst-form-grid">
              <div className="mst-field">
                <label className="mst-label">Email Address <span className="mst-required">*</span></label>
                <input
                  type="email"
                  className="mst-input"
                  placeholder="e.g., jdcruz@up.edu.ph"
                  value={newStaffEmail}
                  onChange={e => setNewStaffEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mst-field">
                <label className="mst-label">Position <span className="mst-required">*</span></label>
                <input
                  type="text"
                  className="mst-input"
                  placeholder="e.g., Junior Office Assistant"
                  value={newStaffPosition}
                  onChange={e => setNewStaffPosition(e.target.value)}
                  required
                />
              </div>
              <div className="mst-field">
                <label className="mst-label">Role <span className="mst-required">*</span></label>
                <select
                  className="mst-select"
                  value={newStaffRole}
                  onChange={e => setNewStaffRole(e.target.value)}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="mst-field mst-field--btn">
                <button type="submit" className="mst-btn mst-btn--primary mst-btn--full" disabled={addLoading}>
                  {addLoading ? <><span className="mst-spinner" /> Registering...</> : 'Register'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Pending Registrations */}
      {pendingRegistrations.length > 0 && (
        <div className="mst-table-card">
          <div className="mst-table-card__header">
            <span className="mst-table-card__title">Pending Registrations</span>
            <span className="mst-table-card__sub">Not yet logged in</span>
          </div>
          <div className="mst-table-wrapper">
            <table className="mst-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Position</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRegistrations.map((reg, i) => (
                  <tr key={reg.id} className={i % 2 === 0 ? 'mst-table__row--even' : ''}>
                    <td>{reg.email}</td>
                    <td>{reg.position}</td>
                    <td>
                      <span className={`mst-role-badge ${reg.role === 'admin' ? 'mst-role-badge--admin' : 'mst-role-badge--staff'}`}>
                        {reg.role === 'admin' ? 'Admin' : 'Staff'}
                      </span>
                    </td>
                    <td>
                      <div className="mst-actions">
                        <button className="mst-btn-remove" onClick={() => handleDeleteRegistration(reg)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Current Staff */}
      <div className="mst-table-card">
        <div className="mst-table-card__header">
          <span className="mst-table-card__title">Current Staff Members</span>
        </div>
        {loading ? (
          <div className="mst-loading">Loading staff...</div>
        ) : staff.length === 0 ? (
          <div className="mst-empty">
            <div className="mst-empty__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p className="mst-empty__title">No staff members yet</p>
            <p className="mst-empty__sub">Add a staff member to get started.</p>
          </div>
        ) : (
          <div className="mst-table-wrapper">
            <table className="mst-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member, i) => (
                  <tr key={member.id} className={i % 2 === 0 ? 'mst-table__row--even' : ''}>
                    <td>
                      <div className="mst-staff-info">
                        {member.photo
                          ? <img src={member.photo} alt={member.name} className="mst-avatar" />
                          : <div className="mst-avatar mst-avatar--placeholder">{member.name?.charAt(0)}</div>
                        }
                        <span>{member.name}</span>
                      </div>
                    </td>
                    <td className="mst-email">{member.email}</td>
                    <td>
                      <span className={`mst-role-badge ${member.role === 'admin' ? 'mst-role-badge--admin' : 'mst-role-badge--staff'}`}>
                        {member.role === 'admin' ? 'Admin' : 'Staff'}
                      </span>
                    </td>
                    <td>{member.position || <span className="mst-unassigned">—</span>}</td>
                    <td>
                      <span className={`mst-status-badge ${member.isActive ? 'mst-status-badge--active' : 'mst-status-badge--inactive'}`}>
                        <span className="mst-status-badge__dot" />
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="mst-actions">
                        <button
                          className={`mst-btn-action ${member.isActive ? 'mst-btn-action--deactivate' : 'mst-btn-action--activate'}`}
                          onClick={() => handleToggleStatus(member)}
                        >
                          {member.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="mst-btn-action mst-btn-action--edit" onClick={() => handleEdit(member)}>Edit</button>
                        <button className="mst-btn-action mst-btn-action--delete" onClick={() => handleDelete(member)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StaffModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={handleSave}
        staff={selectedStaff}
      />
      <ConfirmDeleteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        itemName={selectedStaff?.name}
      />
    </div>
  );
}