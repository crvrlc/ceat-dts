import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SubmitDocumentModal from '../components/SubmitDocumentModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import documentService from '../services/documentService';
import documentTypeService from '../services/documentTypeService';
import toast from 'react-hot-toast';
import '../css/SubmittedDocuments.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const STATUS_STYLES = {
  submitted:      { bg: '#fef6e0', text: '#7a4f00', dot: '#f5a800' },
  received:       { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
  processing:     { bg: '#ede9fe', text: '#4c1d95', dot: '#8b5cf6' },
  action_required:  { bg: '#fff3cd', text: '#856404', dot: '#ffc107' },
  for_signature:  { bg: '#f5e6e8', text: '#7b1113', dot: '#7b1113' },
  completed:      { bg: '#e6f2e7', text: '#1a5c1e', dot: '#236a27' },
  released:       { bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
  rejected:       { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
};

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

// ─── Small components ─────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' };
  return (
    <span className="sd-status-badge" style={{ background: s.bg, color: s.text }}>
      <span className="sd-status-badge__dot" style={{ background: s.dot }} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function TypeBadge({ type }) {
  return <span className="sd-type-badge">{type === 'in_person' ? 'In-Person' : 'Online'}</span>;
}

function EmptyState({ hasFilters }) {
  return (
    <div className="sd-empty">
      <div className="sd-empty__icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="9" y1="13" x2="15" y2="13"/>
          <line x1="9" y1="17" x2="12" y2="17"/>
        </svg>
      </div>
      <p className="sd-empty__title">
        {hasFilters ? 'No documents match your filters' : 'No documents yet'}
      </p>
      <p className="sd-empty__sub">
        {hasFilters
          ? 'Try adjusting or clearing your filters.'
          : 'Submitted documents will appear here.'}
      </p>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <div className="sd-pagination">
      <button className="sd-page-btn sd-page-btn--nav" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>← Prev</button>
      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="sd-page-ellipsis">…</span>
        ) : (
          <button key={p} className={`sd-page-btn${p === currentPage ? ' sd-page-btn--active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
        )
      )}
      <button className="sd-page-btn sd-page-btn--nav" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next →</button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SubmittedDocuments() {
  const { isStudent } = useAuth();
  const navigate = useNavigate();

  // ── Shared state ──
  const [documentTypes, setDocumentTypes] = useState([]);
  const [uniqueStaff, setUniqueStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [filters, setFilters] = useState({
    status: '', documentTypeId: '', submissionMethod: '',
    releaseMethod: '', assignedStaff: '',
  });
  const [searchInput, setSearchInput] = useState('');

  // ── Student: client-side state ──
  const [allDocuments, setAllDocuments] = useState([]);

  // ── Staff: server-side state ──
  const [documents, setDocuments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ─── Student: client-side filtering + pagination via useMemo ──────────────
  const filteredDocuments = useMemo(() => {
    if (!isStudent) return [];
    let result = [...allDocuments];

    if (filters.status)
      result = result.filter(doc => doc.status === filters.status);
    if (filters.documentTypeId)
      result = result.filter(doc => String(doc.documentTypeId) === String(filters.documentTypeId));
    if (searchInput)
      result = result.filter(doc =>
        doc.trackingCode?.toLowerCase().includes(searchInput.toLowerCase())
      );

    return result;
  }, [allDocuments, filters, searchInput, isStudent]);

  const studentTotalPages = Math.ceil(filteredDocuments.length / PAGE_SIZE);
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => { fetchDocumentTypes(); }, []);

  // Student: fetch once on mount
  useEffect(() => {
    if (isStudent) fetchAllDocuments();
  }, [isStudent]);

  // Staff: fetch on filter/page change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isStudent) fetchDocuments();
  }, [isStudent, filters, currentPage]);

  // Reset to page 1 when student filters change
  useEffect(() => {
    if (isStudent) setCurrentPage(1);
  }, [filters, searchInput, isStudent]);

  // Staff: debounced search
  useEffect(() => {
    if (isStudent) return;
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, trackingCode: searchInput }));
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, isStudent]);

  // ─── Fetchers ─────────────────────────────────────────────────────────────
  const fetchDocumentTypes = async () => {
    try {
      const data = await documentTypeService.getAll();
      setDocumentTypes(data.documentTypes);
    } catch (err) {
      console.error('Error fetching document types:', err);
    }
  };

  // Student: fetch all at once
  const fetchAllDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentService.getAll({ limit: 1000 });
      setAllDocuments(data.documents);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  // Staff: server-side paginated fetch
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentService.getAll({ ...filters, page: currentPage, limit: PAGE_SIZE });
      setDocuments(data.documents);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);

      const staffMap = new Map();
      data.documents.forEach(doc => {
        if (doc.assignedStaff?.id && !staffMap.has(doc.assignedStaff.id)) {
          staffMap.set(doc.assignedStaff.id, doc.assignedStaff);
        }
      });
      setUniqueStaff(Array.from(staffMap.values()));
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => setSearchInput(e.target.value);
  const handleViewDetails = (trackingCode) => navigate(`/documents/${trackingCode}`);
  const handleDelete = (doc) => { setSelectedDocument(doc); setShowDeleteModal(true); };

  const handleConfirmDelete = async () => {
    try {
      await documentService.delete(selectedDocument.id);
      setShowDeleteModal(false);
      toast.success('Document deleted successfully.');
      if (isStudent) fetchAllDocuments();
      else fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete document.');
    }
  };

  const handleClearFilters = () => {
    setFilters({ status: '', documentTypeId: '', submissionMethod: '', releaseMethod: '', assignedStaff: '' });
    setSearchInput('');
    setCurrentPage(1);
  };

  const handleReceive = async (doc) => {
    try {
      const response = await documentService.receive(doc.id);
      const assignedName = response.document?.assignedStaff?.name;
      toast.success(
        assignedName
          ? `Document received and assigned to ${assignedName}.`
          : `Document ${doc.trackingCode} marked as received.`
      );
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark as received.');
    }
  };

  // ─── Derived ──────────────────────────────────────────────────────────────
  const hasFilters = Object.values(filters).some(v => v !== '') || searchInput !== '';
  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // What the table actually renders
  const displayDocuments = isStudent ? paginatedDocuments : documents;
  const displayTotalCount = isStudent ? filteredDocuments.length : totalCount;
  const displayTotalPages = isStudent ? studentTotalPages : totalPages;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`sd-page ${isStudent ? 'sd-page--student' : 'sd-page--staff'}`}>

      {/* Header */}
      <div className="sd-header">
        <div>
          <h2 className="sd-title">{isStudent ? 'My Submitted Documents' : 'All Submitted Documents'}</h2>
        </div>
        {isStudent && (
          <button className="sd-submit-btn" onClick={() => setShowSubmitModal(true)}>
            + Submit New Document
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="sd-filters">
        <div className="sd-filters__row">
          <input
            type="text"
            className="sd-filter-input sd-filter-input--search"
            placeholder="Search tracking code..."
            value={searchInput}
            onChange={handleSearchChange}
          />
          <select className="sd-filter-input" name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="received">Received</option>
            <option value="processing">Processing</option>
            <option value="for_signature">For Signature</option>
            <option value="completed">Completed</option>
            <option value="released">Released</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="sd-filter-input sd-filter-input--type" name="documentTypeId" value={filters.documentTypeId} onChange={handleFilterChange}>
            <option value="">All Document Types</option>
            {documentTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          {!isStudent && (
            <>
              <select className="sd-filter-input" name="submissionMethod" value={filters.submissionMethod} onChange={handleFilterChange}>
                <option value="">All Submission</option>
                <option value="online">Online</option>
                <option value="in_person">In-Person</option>
              </select>
              <select className="sd-filter-input" name="releaseMethod" value={filters.releaseMethod} onChange={handleFilterChange}>
                <option value="">All Release</option>
                <option value="online">Online</option>
                <option value="in_person">In-Person</option>
              </select>
              <select className="sd-filter-input sd-filter-input--staff" name="assignedStaff" value={filters.assignedStaff} onChange={handleFilterChange}>
                <option value="">All Staff</option>
                <option value="unassigned">Unassigned</option>
                {uniqueStaff.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name}</option>
                ))}
              </select>
            </>
          )}
          <button className={`sd-clear-btn${hasFilters ? ' sd-clear-btn--active' : ''}`} onClick={handleClearFilters} disabled={!hasFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="sd-table-card">
        {loading ? (
          <div className="sd-loading">Loading documents...</div>
        ) : displayDocuments.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <>
            <div className="sd-table-wrapper">
              <table className="sd-table">
                <thead>
                  <tr>
                    <th>Tracking Code</th>
                    <th>Document Type</th>
                    <th>Status</th>
                    {!isStudent && <th>Assigned To</th>}
                    <th>Date Submitted</th>
                    {!isStudent && <th>Submission</th>}
                    {!isStudent && <th>Release</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayDocuments.map((doc, i) => (
                    <tr key={doc.id} className={i % 2 === 0 ? 'sd-table__row--even' : ''} onClick={() => handleViewDetails(doc.trackingCode)}>
                      <td><span className="sd-tracking-code">{doc.trackingCode}</span></td>
                      <td>{doc.documentType?.name}</td>
                      <td><StatusBadge status={doc.status} /></td>
                      {!isStudent && (
                        <td>
                          {doc.assignedStaff?.name
                            ? <span className="sd-staff-name">{doc.assignedStaff.name}</span>
                            : <span className="sd-unassigned">Unassigned</span>
                          }
                        </td>
                      )}
                      <td className="sd-date">{formatDate(doc.createdAt)}</td>
                      {!isStudent && <td><TypeBadge type={doc.submissionMethod} /></td>}
                      {!isStudent && <td><TypeBadge type={doc.releaseMethod} /></td>}
                      <td>
                        <div className="sd-actions" onClick={e => e.stopPropagation()}>
                          <button className="sd-btn-view" onClick={() => handleViewDetails(doc.trackingCode)}>View</button>
                          {!isStudent && doc.submissionMethod === 'in_person' && doc.status === 'submitted' && (
                            <button
                              className="sd-btn-receive"
                              onClick={() => handleReceive(doc)}
                            >
                              Receive
                            </button>
                          )}
                          {isStudent && doc.status === 'submitted' && (
                            <button className="sd-btn-delete" onClick={() => handleDelete(doc)}>Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="sd-pagination-wrapper">
              <span className="sd-pagination-info">
                Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, displayTotalCount)} of {displayTotalCount}
              </span>
              <Pagination currentPage={currentPage} totalPages={displayTotalPages} onPageChange={setCurrentPage} />
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <SubmitDocumentModal
        show={showSubmitModal}
        onHide={() => setShowSubmitModal(false)}
        onSuccess={() => { if (isStudent) fetchAllDocuments(); else fetchDocuments(); }}
      />
      <ConfirmDeleteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        itemName={`document ${selectedDocument?.trackingCode}`}
      />
    </div>
  );
}