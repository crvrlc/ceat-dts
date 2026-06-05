import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import UpdateModal from '../components/UpdateModal';
import documentService from '../services/documentService';
import documentTypeService from '../services/documentTypeService';
import '../css/MyAssignments.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const STATUS_STYLES = {
  submitted:      { bg: '#fef6e0', text: '#7a4f00', dot: '#f5a800' },
  received:       { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
  processing:     { bg: '#ede9fe', text: '#4c1d95', dot: '#8b5cf6' },
  for_signature:  { bg: '#f5e6e8', text: '#7b1113', dot: '#7b1113' },
  completed:      { bg: '#e6f2e7', text: '#1a5c1e', dot: '#236a27' },
  released:       { bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
  rejected:       { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
};

const STATUS_LABELS = {
  submitted:     'Submitted',
  received:      'Received',
  processing:    'Processing',
  for_signature: 'For Signature',
  completed:     'Completed',
  released:      'Released',
  rejected:      'Rejected',
};

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({ documents }) {
  const stats = {
    total:      documents.length,
    pending:    documents.filter(d => ['submitted', 'received'].includes(d.status)).length,
    inProgress: documents.filter(d => ['processing', 'for_signature'].includes(d.status)).length,
    completed:  documents.filter(d => ['completed', 'released'].includes(d.status)).length,
  };

  const cards = [
    {
      label: 'Total Assigned',
      value: stats.total,
      iconClass: 'ma-summary-card__icon--total',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    },
    {
      label: 'Pending',
      value: stats.pending,
      iconClass: 'ma-summary-card__icon--pending',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      iconClass: 'ma-summary-card__icon--progress',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    },
    {
      label: 'Completed',
      value: stats.completed,
      iconClass: 'ma-summary-card__icon--done',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
    },
  ];

  return (
    <div className="ma-summary-grid">
      {cards.map(card => (
        <div className="ma-summary-card" key={card.label}>
          <div className={`ma-summary-card__icon ${card.iconClass}`}>{card.icon}</div>
          <div className="ma-summary-card__body">
            <div className="ma-summary-card__value">{card.value}</div>
            <div className="ma-summary-card__label">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Small Components ─────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' };
  return (
    <span className="ma-status-badge" style={{ background: s.bg, color: s.text }}>
      <span className="ma-status-badge__dot" style={{ background: s.dot }} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function TypeBadge({ type }) {
  return <span className="ma-type-badge">{type === 'in_person' ? 'In-Person' : 'Online'}</span>;
}

function EmptyState({ hasFilters, isActiveOnly }) {
  return (
    <div className="ma-empty">
      <div className="ma-empty__icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
          <line x1="9" y1="12" x2="15" y2="12"/>
          <line x1="9" y1="16" x2="12" y2="16"/>
        </svg>
      </div>
       <p className="ma-empty__title">
        {hasFilters
          ? 'No documents match your filters'
          : isActiveOnly
            ? 'No active assignments'
            : 'No assignments yet'
        }
      </p>
      <p className="ma-empty__sub">
        {hasFilters
          ? 'Try adjusting or clearing your filters.'
          : isActiveOnly
            ? 'All caught up! Select "All Documents" to see completed assignments.'
            : 'Documents assigned to you will appear here.'
        }
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
    <div className="ma-pagination">
      <button className="ma-page-btn ma-page-btn--nav" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>← Prev</button>
      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="ma-page-ellipsis">…</span>
        ) : (
          <button key={p} className={`ma-page-btn${p === currentPage ? ' ma-page-btn--active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
        )
      )}
      <button className="ma-page-btn ma-page-btn--nav" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next →</button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MyAssignments() {
  const navigate = useNavigate();

  const [allDocuments, setAllDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [filters, setFilters] = useState({
    status: '', documentTypeId: '', submissionMethod: '', releaseMethod: '',
  });
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => { fetchDocumentTypes(); }, []);
  useEffect(() => { fetchAllDocuments(); }, []);

  // ─── Client-side filtering ─────────────────────────────────────────────────
  const filteredDocuments = useMemo(() => {
    let result = [...allDocuments];

    if (filters.status === 'all') {
      // show everything
    } else if (!filters.status) {
      // default — only hide released
      result = result.filter(d => d.status !== 'released');
    } else {
      result = result.filter(d => d.status === filters.status);
    }

    if (filters.documentTypeId)
      result = result.filter(d => String(d.documentTypeId) === String(filters.documentTypeId));
    if (filters.submissionMethod)
      result = result.filter(d => d.submissionMethod === filters.submissionMethod);
    if (filters.releaseMethod)
      result = result.filter(d => d.releaseMethod === filters.releaseMethod);
    if (searchInput)
      result = result.filter(d =>
        d.trackingCode?.toLowerCase().includes(searchInput.toLowerCase())
      );

    return result;
  }, [allDocuments, filters, searchInput]);

  useEffect(() => { setCurrentPage(1); }, [filters, searchInput]);

  const totalPages = Math.ceil(filteredDocuments.length / PAGE_SIZE);
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ─── Fetchers ──────────────────────────────────────────────────────────────
  const fetchDocumentTypes = async () => {
    try {
      const data = await documentTypeService.getAll();
      setDocumentTypes(data.documentTypes);
    } catch (err) {
      console.error('Error fetching document types:', err);
    }
  };

  const fetchAllDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentService.getAll({ assignedOnly: 'true', limit: 1000 });
      setAllDocuments(data.documents);
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
  };

  const handleClearFilters = () => {
    setFilters({ status: '', documentTypeId: '', submissionMethod: '', releaseMethod: '' });
    setSearchInput('');
    setCurrentPage(1);
  };

  const handleViewDetails = (trackingCode) => navigate(`/documents/${trackingCode}`);
  const handleUpdateStatus = (doc) => { setSelectedDocument(doc); setShowUpdateModal(true); };

  const hasFilters = Object.values(filters).some(v => v !== '') || searchInput !== '';
  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="ma-page">

      {/* Header */}
      <div className="ma-header">
        <h2 className="ma-title">My Assignments</h2>
      </div>

      {/* Summary Cards */}
      <SummaryCards documents={allDocuments} />

      {/* Filters */}
      <div className="ma-filters">
        <div className="ma-filters__row">
          <input
            type="text"
            className="ma-filter-input ma-filter-input--search"
            placeholder="Search tracking code..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <select className="ma-filter-input" name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">Active Only</option>
            <option value="all">All Documents</option>
            <option value="submitted">Submitted</option>
            <option value="received">Received</option>
            <option value="processing">Processing</option>
            <option value="for_signature">For Signature</option>
            <option value="completed">Completed</option>
            <option value="released">Released</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="ma-filter-input ma-filter-input--type" name="documentTypeId" value={filters.documentTypeId} onChange={handleFilterChange}>
            <option value="">All Document Types</option>
            {documentTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          <select className="ma-filter-input" name="submissionMethod" value={filters.submissionMethod} onChange={handleFilterChange}>
            <option value="">All Submission</option>
            <option value="online">Online</option>
            <option value="in_person">In-Person</option>
          </select>
          <select className="ma-filter-input" name="releaseMethod" value={filters.releaseMethod} onChange={handleFilterChange}>
            <option value="">All Release</option>
            <option value="online">Online</option>
            <option value="in_person">In-Person</option>
          </select>
          <button className={`ma-clear-btn${hasFilters ? ' ma-clear-btn--active' : ''}`} onClick={handleClearFilters} disabled={!hasFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="ma-table-card">
        {loading ? (
          <div className="ma-loading">Loading assignments...</div>
        ) : paginatedDocuments.length === 0 ? (
          <EmptyState hasFilters={hasFilters} isActiveOnly={!filters.status} />
        ) : (
          <>
            <div className="ma-table-wrapper">
              <table className="ma-table">
                <thead>
                  <tr>
                    <th>Tracking Code</th>
                    <th>Document Type</th>
                    <th>Status</th>
                    <th>Date Submitted</th>
                    <th>Submission</th>
                    <th>Release</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDocuments.map((doc, i) => (
                  <tr
                    key={doc.id}
                    className={`${i % 2 === 0 ? 'ma-table__row--even' : ''} ${doc.status === 'submitted' ? 'ma-table__row--new' : ''}`}
                    onClick={() => handleViewDetails(doc.trackingCode)}
                  >
                    <td>
                      <div className="ma-tracking-code-cell">
                        <span className="ma-tracking-code">{doc.trackingCode}</span>
                        {doc.status === 'submitted' && (
                          <span className="ma-new-badge">New</span>
                        )}
                      </div>
                    </td>
                      <td>{doc.documentType?.name}</td>
                      <td><StatusBadge status={doc.status} /></td>
                      <td className="ma-date">{formatDate(doc.createdAt)}</td>
                      <td><TypeBadge type={doc.submissionMethod} /></td>
                      <td><TypeBadge type={doc.releaseMethod} /></td>
                      <td>
                        <div className="ma-actions" onClick={e => e.stopPropagation()}>
                          <button className="ma-btn-view" onClick={() => handleViewDetails(doc.trackingCode)}>View</button>
                          <button className="ma-btn-update" onClick={() => handleUpdateStatus(doc)}>Update</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ma-pagination-wrapper">
              <span className="ma-pagination-info">
                Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredDocuments.length)} of {filteredDocuments.length}
              </span>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </>
        )}
      </div>

      <UpdateModal
        show={showUpdateModal}
        onHide={() => setShowUpdateModal(false)}
        document={selectedDocument}
        onSuccess={fetchAllDocuments}
      />
    </div>
  );
}