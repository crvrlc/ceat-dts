import { useState, useEffect } from 'react';
import api from '../utils/api';
import '../css/ActivityLogs.css';

const STATUS_COLORS = {
  submitted:     { bg: '#f3f4f6', text: '#4b5563', dot: '#9ca3af' },  
  received:      { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
  processing:    { bg: '#ede9fe', text: '#4c1d95', dot: '#8b5cf6' },
  action_required:  { bg: '#fff3cd', text: '#856404', dot: '#ffc107' },
  for_signature: { bg: '#f5e6e8', text: '#7b1113', dot: '#7b1113' },
  completed:     { bg: '#e6f2e7', text: '#1a5c1e', dot: '#236a27' },
  released:      { bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
  rejected:      { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
};

const STATUS_LABELS = {
  submitted: 'Submitted', received: 'Received', processing: 'Processing',  action_required:  'Action Required',
  for_signature: 'For Signature', completed: 'Completed', released: 'Released', rejected: 'Rejected',
};

function StatusBadge({ status }) {
  if (!status) return null;
  const s = STATUS_COLORS[status] || { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' };
  return (
    <span className="al-status-badge" style={{ background: s.bg, color: s.text }}>
      <span className="al-status-badge__dot" style={{ background: s.dot }} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default function ActivityLogs() {
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');

  const PAGE_SIZE = 20;

  // ─── single fetch function that takes all params explicitly ───────────────
  const fetchLogs = async (page = 1, search = searchInput, from = dateFrom, to = dateTo) => {
    try {
      setLoading(true);
      const res = await api.get('/activity-logs', {
        params: {
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          dateFrom:     from   || undefined,
          dateTo:       to     || undefined,
        }
      });
      setLogs(res.data.logs ?? []);
      setCurrentPage(page);
      setTotalPages(res.data.totalPages ?? 1);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // initial load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchLogs(1, '', '', ''); }, []);

  // search debounce
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const timer = setTimeout(() => { fetchLogs(1, searchInput, dateFrom, dateTo); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // date filters — fire immediately with new values
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchLogs(1, searchInput, dateFrom, dateTo);
  }, [dateFrom, dateTo]);

  const handleClear = () => {
    setSearchInput('');
    setDateFrom('');
    setDateTo('');
    fetchLogs(1, '', '', '');
  };

  const hasFilters = searchInput || dateFrom || dateTo;

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="al-page">

      {/* Header */}
      <div className="al-header">
        <div>
          <h2 className="al-title">Activity Logs</h2>
            <p className="al-subtitle">Full audit trail of all system actions</p>        </div>
      </div>

      {/* Filters */}
      <div className="al-filters">
        <div className="al-filters__row">
          <div className="al-filter-group">
            <label className="al-filter-label">Search</label>
            <input
              type="text"
              className="al-filter-input al-filter-input--search"
              placeholder="Search by tracking code or performed by..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <div className="al-filter-group">
            <label className="al-filter-label">From</label>
            <input
              type="date"
              className="al-filter-input"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <div className="al-filter-group">
            <label className="al-filter-label">To</label>
            <input
              type="date"
              className="al-filter-input"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
          <div className="al-filter-group al-filter-group--btn">
            <label className="al-filter-label">&nbsp;</label>
            <button
              className={`al-clear-btn${hasFilters ? ' al-clear-btn--active' : ''}`}
              onClick={handleClear}
              disabled={!hasFilters}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="al-table-card">
        {loading ? (
          <div className="al-loading">Loading activity logs...</div>
        ) : logs.length === 0 ? (
          <div className="al-empty">
            <div className="al-empty__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p className="al-empty__title">No activity logs found</p>
            <p className="al-empty__sub">Try adjusting your search or date range.</p>
          </div>
        ) : (
          <>
            <div className="al-table-wrapper">
              <table className="al-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Tracking Code</th>
                    <th>Action</th>
                    <th>Status</th>
                    <th>Performed By</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id} className={i % 2 === 0 ? 'al-table__row--even' : ''}>
                      <td className="al-date">{formatDate(log.createdAt)}</td>
                      <td>
                        {log.document?.trackingCode
                          ? <span className="al-tracking-code">{log.document.trackingCode}</span>
                          : log.entityType
                            ? <span className="al-entity-badge">{log.entityType.replace('_', ' ')}</span>
                            : <span className="al-unassigned">—</span>
                        }
                      </td>
                      <td className="al-action">{log.action || <span className="al-unassigned">—</span>}</td>
                      <td><StatusBadge status={log.toStatus} /></td>
                      <td>
                        <div className="al-performer">
                          <span className="al-performer__name">{log.performedBy?.name || 'System'}</span>
                          <span className="al-performer__role">{log.performedBy?.role}</span>
                        </div>
                      </td>
                      <td className="al-remarks">
                        {log.remarks || <span className="al-unassigned">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="al-pagination-wrapper">
              <span className="al-pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <div className="al-pagination">
                <button
                  className="al-page-btn al-page-btn--nav"
                  onClick={() => fetchLogs(currentPage - 1, searchInput, dateFrom, dateTo)}
                  disabled={currentPage === 1}
                >
                  ← Prev
                </button>
                <button
                  className="al-page-btn al-page-btn--nav"
                  onClick={() => fetchLogs(currentPage + 1, searchInput, dateFrom, dateTo)}
                  disabled={currentPage >= totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}