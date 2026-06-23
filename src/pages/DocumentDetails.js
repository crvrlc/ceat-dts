import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UpdateModal from '../components/UpdateModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import documentService from '../services/documentService';
import toast from 'react-hot-toast';
import api from '../utils/api';
import '../css/DocumentDetails.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ['submitted', 'received', 'processing', 'for_signature', 'completed', 'released'];

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

const STATUS_COLORS = {
  submitted:     { bg: '#fef6e0', text: '#7a4f00', dot: '#f5a800' },
  received:      { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
  processing:    { bg: '#ede9fe', text: '#4c1d95', dot: '#8b5cf6' },
  action_required:  { bg: '#fff3cd', text: '#856404', dot: '#ffc107' },
  for_signature: { bg: '#f5e6e8', text: '#7b1113', dot: '#7b1113' },
  completed:     { bg: '#e6f2e7', text: '#1a5c1e', dot: '#236a27' },
  released:      { bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
  rejected:      { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' };
  return (
    <span className="dd-status-badge" style={{ background: c.bg, color: c.text }}>
      <span className="dd-status-badge__dot" style={{ background: c.dot }} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ currentStatus, activityLogs }) {
  const isRejected = currentStatus === 'rejected';
  const isActionRequired = currentStatus === 'action_required';

  // treat action_required as still at processing step
  const effectiveStatus = isActionRequired ? 'processing' : currentStatus;

  const rejectedAtIndex = isRejected
    ? (() => {
        const lastBeforeReject = [...(activityLogs || [])]
          .reverse()
          .find(l => l.fromStatus && l.toStatus === 'rejected');
        return lastBeforeReject
          ? Math.max(0, STEPS.indexOf(lastBeforeReject.fromStatus))
          : 0;
      })()
    : -1;

  const currentIndex = isRejected
    ? rejectedAtIndex
    : STEPS.indexOf(effectiveStatus) === -1
      ? STEPS.length - 1
      : STEPS.indexOf(effectiveStatus);
      
  const fillPct = currentIndex <= 0
    ? '0px'
    : `${(currentIndex / (STEPS.length - 1)) * 100}%`;

  const rejectionEntry = isRejected
    ? [...(activityLogs || [])].reverse().find(l => l.toStatus === 'rejected')
    : null;

  return (
    <div>
      <div className="dd-progress-wrapper">
        <div className="dd-progress-track" />
        <div
          className={`dd-progress-fill${isRejected ? ' dd-progress-fill--rejected' : ''}`}
          style={{ width: fillPct }}
        />
        {STEPS.map((step, i) => {
          const done     = isRejected ? false : i < currentIndex;
          const active   = !isRejected && i === currentIndex && !isActionRequired;
          const isActionDot = isActionRequired && step === 'processing';
          const isRejDot = isRejected && i === rejectedAtIndex;
          const faded    = isRejected && i !== rejectedAtIndex;

          let dotClass = 'dd-progress-dot';
          if (done)          dotClass += ' dd-progress-dot--done';
          if (active)        dotClass += ' dd-progress-dot--active';
          if (isRejDot)      dotClass += ' dd-progress-dot--rejected';
          if (isActionDot)   dotClass += ' dd-progress-dot--action';
          if (faded && !isRejDot) dotClass += ' dd-progress-dot--faded';

          let labelClass = 'dd-progress-label';
          if (done)          labelClass += ' dd-progress-label--done';
          if (active)        labelClass += ' dd-progress-label--active';
          if (isRejDot)      labelClass += ' dd-progress-label--rejected';
          if (isActionDot)   labelClass += ' dd-progress-label--action';
          if (faded)         labelClass += ' dd-progress-label--faded';

          return (
            <div key={step} className="dd-progress-step">
              <div className={dotClass}>
                {done && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a5c1e" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {isRejDot && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
                {isActionDot && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                )}
                {!done && !isRejDot && !isActionDot && (
                  <div className={`dd-progress-inner${active ? ' dd-progress-inner--active' : ''}`} />
                )}
              </div>
              <span className={labelClass}>{isActionDot ? 'Action Required' : STATUS_LABELS[step]}</span>
            </div>
          );
        })}
      </div>
      
      {/* action required banner */}
      {isActionRequired && (
        <div className="dd-action-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#856404" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <div className="dd-action-banner__title">Action Required</div>
            <div className="dd-action-banner__desc">This document requires action from the student before processing can continue.</div>
          </div>
        </div>
      )}

      {/* rejected banner */}
      {isRejected && rejectionEntry && (
        <div className="dd-rejected-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <div>
            <div className="dd-rejected-banner__title">Rejected</div>
            {rejectionEntry.remarks && (
              <div className="dd-rejected-banner__reason">Reason: {rejectionEntry.remarks}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Info Grid ────────────────────────────────────────────────────────────────

function InfoGrid({ items }) {
  const visible = items.filter(item => item.value !== null && item.value !== undefined && item.value !== '');
  const isOdd = visible.length % 2 !== 0;

  return (
    <div className="dd-info-grid">
      {visible.map(({ label, value }, i) => {
        const isLastOdd = isOdd && i === visible.length - 1;
        let cellClass = 'dd-info-cell';
        if (i < visible.length - (isOdd ? 1 : 2)) cellClass += ' dd-info-cell--border-bottom';
        if (i % 2 === 0 && !isLastOdd)             cellClass += ' dd-info-cell--border-right';
        if (isLastOdd)                              cellClass += ' dd-info-cell--full';

        return (
          <div key={label} className={cellClass}>
            <div className="dd-info-cell__label">{label}</div>
            <div className="dd-info-cell__value">{value}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Activity Timeline ────────────────────────────────────────────────────────

function ActivityTimeline({ logs, isStudent, releaseMethod }) {
  // console.log('releaseMethod:', releaseMethod);
  if (!logs || logs.length === 0) {
    return <p className="dd-empty-text">No activity history yet.</p>;
  }

  const studentMessages = {
    submitted:     'Your document has been submitted successfully.',
    received:      'Your document has been received at the office.',
    processing:    'Your document is currently being processed.',
    action_required:  'Action is required from you. Please check the remarks.',
    for_signature: 'Your document is being reviewed for signature.',
    completed:     releaseMethod === 'online'
      ? 'Your document has been completed and will be released shortly.'
      : 'Your document is ready for pick up at the CEAT OCS office.',
    released:      releaseMethod === 'online'
      ? 'Your document is available for download.'
      : 'Your document has been released.',
    rejected:      'Your document was not approved. See remarks below.',
  };

  const displayLogs = isStudent
    ? [...logs].reverse().filter(entry => entry.toStatus !== entry.fromStatus)
    : [...logs].reverse();

  return (
    <div className="dd-timeline">
      <div className="dd-timeline__line" />
      {displayLogs.map((entry, i, arr) => {
        const c = STATUS_COLORS[entry.toStatus] || { dot: '#9ca3af' };
        return (
          <div key={i} className={`dd-timeline__entry${i < arr.length - 1 ? ' dd-timeline__entry--spaced' : ''}`}>
            <div className="dd-timeline__dot-wrapper">
              <div className="dd-timeline__dot" style={{ background: c.dot }} />
            </div>
            <div className="dd-timeline__content">
              <div className="dd-timeline__meta">
                {entry.toStatus && <StatusBadge status={entry.toStatus} />}
                <span className="dd-timeline__date">{
                  new Date(entry.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })
                }</span>
              </div>
              {isStudent ? (
                <>
                  {entry.toStatus && (
                    <div className="dd-timeline__action">
                      {studentMessages[entry.toStatus]}
                    </div>
                  )}
                  {entry.remarks && (
                    <div className="dd-timeline__remarks">{entry.remarks}</div>
                  )}
                </>
              ) : (
                <>
                  <div className="dd-timeline__by">by {entry.performedBy?.name || 'System'}</div>
                  {entry.action && (
                    <div className="dd-timeline__action">{entry.action}</div>
                  )}
                  {entry.remarks && (
                    <div className="dd-timeline__remarks">{entry.remarks}</div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Action Required Section ────────────────────────────────────────────────────────
function ActionRequiredSection({ document, onRevisionSubmitted }) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmitRevision = async () => {
    // inform student that file is required 
    if (!file) {
      toast.error('Please attach a file before submitting.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);

      await api.patch(`/documents/${document.id}/revise`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Response submitted successfully!');
      onRevisionSubmitted();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit response');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dd-card dd-card--action-required">
      <div className="dd-card__label">Action Required</div>

      {/* Staff instructions */}
      {document.remarks && (
        <div className="dd-action-remarks">
          <div className="dd-action-remarks__label">Instructions from Staff</div>
          <p className="dd-action-remarks__text">{document.remarks}</p>
        </div>
      )}

      {/* File from staff (optional) */}
      {document.actionRequiredFileUrl && (
        <div className="dd-file-card" style={{ marginBottom: 16 }}>
          <div className="dd-file-card__left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span className="dd-file-card__name">
              {document.actionRequiredFileName || document.actionRequiredFileUrl?.split('/').pop()}
            </span>
          </div>
          <a className="dd-btn dd-btn--outline" href={document.actionRequiredFileUrl} target="_blank" rel="noreferrer">
            Download File
          </a>
        </div>
      )}

      {/* Already responded */}
        {document.hasRespondedToActionRequired ? (
          <div className="dd-action-responded">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a5c1e" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>You have already submitted a response. Waiting for staff to review.</span>
          </div>
        ) : (
          <div className="dd-action-upload">
            <div className="dd-action-upload__label">Upload your revised file <span style={{color:'#ef4444'}}>*</span></div>            <label className="dd-file-label">
              <input
                type="file"
                accept=".pdf"
                className="dd-file-input"
                onChange={e => {
                  setFile(e.target.files[0]);
                  setFileName(e.target.files[0]?.name || '');
                }}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>{fileName || 'Choose file...'}</span>
            </label>
            <button
              className="dd-btn dd-btn--update"
              onClick={handleSubmitRevision}
              disabled={uploading}
            >
              {uploading ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
        )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DocumentDetails() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const { isStudent, isAdmin, isStaff } = useAuth();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDocument(); }, [trackingNumber]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const data = await documentService.getAll({ trackingCode: trackingNumber });
      if (data.documents && data.documents.length > 0) {
        // console.log(data.documents[0]);
        setDocument(data.documents[0]);
      } else {
        setError('Document not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Document not found');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await documentService.delete(document.id);
      toast.success('Document deleted successfully.');
      navigate('/submitted-documents');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete document');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) return (
    <div className="dd-loading">Loading document details...</div>
  );

  if (error) return (
    <div className="dd-error">
      <div className="dd-error__box">{error}</div>
      <button className="dd-btn dd-btn--outline" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  if (!document) return <div className="dd-loading">Document not found</div>;

  const canUpdate = isStaff || isAdmin;
  const canDelete = isAdmin || (isStudent && document.status === 'submitted');

  const studentInfoItems = [
    { label: 'Document Type',     value: `${document.documentType?.name} (${document.documentType?.code})` },
    { label: 'Current Status',    value: <StatusBadge status={document.status} /> },
    { label: 'Submission Method', value: document.submissionMethod === 'online' ? 'Online' : 'In-Person' },
    { label: 'Release Method',    value: document.releaseMethod === 'online' ? 'Online' : 'In-Person' },
    { label: 'Date Submitted',    value: formatDate(document.createdAt) },
    { label: 'Notes',             value: document.notes || null },
  ];

  const staffInfoItems = [
    { label: 'Document Type',     value: `${document.documentType?.name} (${document.documentType?.code})` },
    { label: 'Current Status',    value: <StatusBadge status={document.status} /> },
    { label: 'Assigned Staff',    value: document.assignedStaff?.name || 'Unassigned' },
    { label: 'Date Submitted',    value: formatDate(document.createdAt) },
    { label: 'Student Name',      value: document.student?.name },
    { label: 'Student Email',     value: document.student?.email },
    { label: 'Submission Method', value: document.submissionMethod === 'online' ? 'Online' : 'In-Person' },
    { label: 'Release Method',    value: document.releaseMethod === 'online' ? 'Online' : 'In-Person' },
    { label: 'Student Notes',     value: document.notes || null },
    { label: 'Remarks',           value: document.remarks || null },
  ];

  return (
    <div className="dd-page">
      <div className="dd-inner">

        {/* Header */}
        <div className="dd-header">
          <div className="dd-header__left">
            <button className="dd-back-btn" onClick={() => navigate(-1)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <h1 className="dd-title">Document Details</h1>
              <span className="dd-subtitle">
                Tracking Code: <strong>{document.trackingCode}</strong>
              </span>
            </div>
          </div>
          <div className="dd-header__actions">
            {canUpdate && (
              <button className="dd-btn dd-btn--update" onClick={() => setShowUpdateModal(true)}>
                Update Status
              </button>
            )}
            {canDelete && (
              <button className="dd-btn dd-btn--delete" onClick={() => setShowDeleteModal(true)}>
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Request Status */}
        <div className="dd-card">
          <div className="dd-card__label">Request Status</div>
          <ProgressBar
            currentStatus={document.status}
            activityLogs={document.activityLogs || []}
          />
        </div>

        {/* Document Information */}
        <div className="dd-card">
          <div className="dd-card__label">Document Information</div>
          <InfoGrid items={isStudent ? studentInfoItems : staffInfoItems} />
        </div>

        {/* Student: their submitted file */}
        {isStudent && document.studentFileUrl && (
          <div className="dd-card">
            <div className="dd-card__label">Your Submitted File</div>
            <div className="dd-file-card">
              <div className="dd-file-card__left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span className="dd-file-card__name">
                  {document.originalFileName || document.studentFileUrl?.split('/').pop()}
                </span>
              </div>
              <a className="dd-btn dd-btn--outline" href={document.studentFileUrl} target="_blank" rel="noreferrer">
                View File
              </a>
            </div>
          </div>
        )}

        {/* Student: Action Required section */}
        {isStudent && document.status === 'action_required' && (
          <ActionRequiredSection
            document={document}
            onRevisionSubmitted={fetchDocument}
          />
        )}

        {/* Student: final document (only when completed/released) */}
        {isStudent && document.scannedFileUrl && ['completed', 'released'].includes(document.status) && (
          <div className="dd-card">
            <div className="dd-card__label">Final Document</div>
            <div className="dd-file-card">
              <div className="dd-file-card__left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span className="dd-file-card__name">
                  {document.scannedFileName || document.scannedFileUrl?.split('/').pop()}
                </span>
              </div>
              <a className="dd-btn dd-btn--outline" href={document.scannedFileUrl} target="_blank" rel="noreferrer">
                View File
              </a>
            </div>
          </div>
        )}

        {/* Staff: student's original file */}
        {!isStudent && document.studentFileUrl && (
          <div className="dd-card">
            <div className="dd-card__label">Student Submitted File</div>
            <div className="dd-file-card">
              <div className="dd-file-card__left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span className="dd-file-card__name">
                  {document.originalFileName || document.studentFileUrl?.split('/').pop()}
                </span>
              </div>
              <a className="dd-btn dd-btn--outline" href={document.studentFileUrl} target="_blank" rel="noreferrer">
                View File
              </a>
            </div>
          </div>
        )}

        {/* Staff: working/final document */}
        {!isStudent && document.scannedFileUrl && (
          <div className="dd-card">
            <div className="dd-card__label">
              {['completed', 'released'].includes(document.status) ? 'Final Document' : 'Working Document'}
            </div>
            <div className="dd-file-card">
              <div className="dd-file-card__left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span className="dd-file-card__name">
                  {document.scannedFileName || document.scannedFileUrl?.split('/').pop()}
                </span>
              </div>
              <a className="dd-btn dd-btn--outline" href={document.scannedFileUrl} target="_blank" rel="noreferrer">
                View File
              </a>
            </div>
          </div>
        )}

        {/* Staff: Student's revised file */}
        {!isStudent && document.revisedFileUrl && (
          <div className="dd-card">
            <div className="dd-card__label">
              Student Response
              <span className="dd-responded-badge">Student has responded</span>
            </div>
            <div className="dd-file-card">
              <div className="dd-file-card__left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span className="dd-file-card__name">
                  {document.revisedFileName || document.revisedFileUrl?.split('/').pop()}
                </span>
              </div>
              <a className="dd-btn dd-btn--outline" href={document.revisedFileUrl} target="_blank" rel="noreferrer">
                View File
              </a>
            </div>
          </div>
        )}

        {/* Activity History — both student and staff, different detail level */}
        <div className="dd-card">
          <div className="dd-card__label">Activity History</div>
          <ActivityTimeline
            logs={document.activityLogs}
            isStudent={isStudent}
            releaseMethod={document.releaseMethod}
          />
        </div>

      </div>

      <UpdateModal
        show={showUpdateModal}
        onHide={() => setShowUpdateModal(false)}
        document={document}
        onSuccess={fetchDocument}
      />
      <ConfirmDeleteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itemName={`document ${document.trackingCode}`}
      />
    </div>
  );
}