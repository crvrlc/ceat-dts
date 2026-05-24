import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../utils/api';
import '../css/Reports.css';

const PIE_PALETTE = ['#7b1113', '#236a27', '#f5a800', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'];
const METHOD_LABELS = { online: 'Online', in_person: 'In-Person' };
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const getMonthName = (m) => MONTH_NAMES[(m ?? 1) - 1] ?? m;

const STATUS_CONFIG = {
  submitted:     { label: 'Submitted',     bg: '#fef6e0', text: '#7a4f00', dot: '#f5a800' },
  received:      { label: 'Received',      bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
  processing:    { label: 'Processing',    bg: '#ede9fe', text: '#4c1d95', dot: '#8b5cf6' },
  for_signature: { label: 'For Signature', bg: '#f5e6e8', text: '#7b1113', dot: '#7b1113' },
  completed:     { label: 'Completed',     bg: '#e6f2e7', text: '#1a5c1e', dot: '#236a27' },
  released:      { label: 'Released',      bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
  rejected:      { label: 'Rejected',      bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rp-tooltip">
      {label && <p className="rp-tooltip__label">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="rp-tooltip__item" style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="rp-donut">
      <div className="rp-donut__chart-wrapper">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={80} dataKey="value" paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="rp-donut__center">
          <div className="rp-donut__total">{total}</div>
          <div className="rp-donut__label">total</div>
        </div>
      </div>
      <div className="rp-donut__legend">
        {data.map((d, i) => (
          <div key={i} className="rp-donut__legend-item">
            <div className="rp-donut__legend-dot" style={{ background: PIE_PALETTE[i % PIE_PALETTE.length] }} />
            <span className="rp-donut__legend-name">{d.name}</span>
            <strong className="rp-donut__legend-value">{d.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartEmpty() {
  return (
    <div className="rp-chart-empty">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
      <p>No data for this period</p>
    </div>
  );
}

export default function Reports() {
  const [loading, setLoading]                     = useState(true);
  const [overview, setOverview]                   = useState(null);
  const [monthlyTrend, setMonthlyTrend]           = useState([]);
  const [documentTypes, setDocumentTypes]         = useState([]);
  const [submissionMethods, setSubmissionMethods] = useState([]);
  const [releaseMethods, setReleaseMethods]       = useState([]);
  const [staffPerformance, setStaffPerformance]   = useState([]);
  const [studentStats, setStudentStats]           = useState({ active: 0, pending: 0 });
  const [semesters, setSemesters]                 = useState([]);
  const [filters, setFilters]                     = useState({
    semesterId: '', startDate: '', endDate: ''
  });

  useEffect(() => {
    const init = async () => {
      try {
        const res  = await api.get('/semesters');
        const sems = res.data.semesters ?? [];
        setSemesters(sems);
        const active = sems.find(s => s.isCurrent) ?? sems[0];
        if (active) setFilters({ semesterId: active.id, startDate: '', endDate: '' });
      } catch (err) {
        console.error('Init error:', err);
      }
    };
    init();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (filters.semesterId !== undefined) fetchReports();
  }, [filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.semesterId) params.semesterId = filters.semesterId;
      if (!filters.semesterId && filters.startDate) params.startDate = filters.startDate;
      if (!filters.semesterId && filters.endDate)   params.endDate   = filters.endDate;

      const [overviewRes, trendRes, typesRes, subRes, relRes, staffRes, studentsRes] = await Promise.allSettled([
        api.get('/reports/overview',           { params }),
        api.get('/reports/monthly-trend',      { params }),
        api.get('/reports/document-types',     { params }),
        api.get('/reports/submission-methods', { params }),
        api.get('/reports/release-methods',    { params }),
        api.get('/reports/staff-performance',  { params }),
        api.get('/student-registrations',      { params: { limit: 1000 } }),
      ]);

      const get = (r) => r.status === 'fulfilled' ? r.value.data.data : null;
      if (get(overviewRes)) setOverview(get(overviewRes));
      if (get(trendRes))    setMonthlyTrend(get(trendRes));
      if (get(typesRes))    setDocumentTypes(get(typesRes));
      if (get(subRes))      setSubmissionMethods(get(subRes));
      if (get(relRes))      setReleaseMethods(get(relRes));
      if (get(staffRes))    setStaffPerformance(get(staffRes));

      if (studentsRes.status === 'fulfilled') {
        const regs = studentsRes.value.data.registrations ?? [];
        setStudentStats({
          active:  regs.filter(r => r.isUsed).length,
          pending: regs.filter(r => !r.isUsed).length,
        });
      }
    } catch (err) {
      console.error('fetchReports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'semesterId' && value) {
        next.startDate = '';
        next.endDate = '';
      }
      return next;
    });
  };

  const handleReset = () => {
    const active = semesters.find(s => s.isCurrent) ?? semesters[0];
    setFilters({ semesterId: active?.id ?? '', startDate: '', endDate: '' });
  };

  const trendData = (monthlyTrend ?? []).map(item => ({
    month:     `${getMonthName(item.month)} '${String(item.year ?? '').slice(-2)}`,
    Submitted: item.submitted ?? 0,
    Released:  item.released  ?? 0,
  }));

  const subMethodData = (submissionMethods ?? []).map(d => ({
    name: METHOD_LABELS[d.method] || d.method, value: d.count
  }));

  const relMethodData = (releaseMethods ?? []).map(d => ({
    name: METHOD_LABELS[d.method] || d.method, value: d.count
  }));

  const totalDocs = overview?.totalDocuments ?? 0;
  const totalStudents = studentStats.active + studentStats.pending;

  if (loading && !overview) {
    return (
      <div className="rp-page">
        <div className="rp-loading">
          <div className="rp-spinner" />
          <p>Loading reports…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rp-page">

      {/* Header */}
      <div className="rp-header">
        <div>
          <h2 className="rp-title">Reports</h2>
          <p className="rp-subtitle">Overview of document submissions and processing</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rp-filters">
        <div className="rp-filters__row">
          <div className="rp-filter-group">
            <label className="rp-filter-label">Semester</label>
            <select
              className="rp-filter-input"
              name="semesterId"
              value={filters.semesterId}
              onChange={handleFilterChange}
            >
              <option value="">All Time</option>
              {semesters.map(sem => (
                <option key={sem.id} value={sem.id}>
                  {sem.code} — {sem.name}, {sem.schoolYear}
                </option>
              ))}
            </select>
          </div>
          <div className="rp-filter-group">
            <label className="rp-filter-label">Start Date</label>
            <input
              type="date"
              className="rp-filter-input"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              disabled={!!filters.semesterId}
            />
          </div>
          <div className="rp-filter-group">
            <label className="rp-filter-label">End Date</label>
            <input
              type="date"
              className="rp-filter-input"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              disabled={!!filters.semesterId}
            />
          </div>
          <div className="rp-filter-group rp-filter-group--btn">
            <button className="rp-clear-btn rp-clear-btn--active" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
        {filters.semesterId && (
          <p className="rp-filter-hint">Date range is disabled when a semester is selected.</p>
        )}
      </div>

      {/* Status Grid */}
      {overview && (
        <div className="rp-status-grid">
          <div className="rp-status-card rp-status-card--total">
            <div className="rp-status-card__value">{totalDocs}</div>
            <div className="rp-status-card__label">Total Documents</div>
          </div>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = overview.byStatus?.find(s => s.status === key)?.count ?? 0;
            return (
              <div key={key} className="rp-status-card" style={{ background: cfg.bg, borderColor: cfg.dot + '33' }}>
                {/* <div className="rp-status-card__dot" style={{ background: cfg.dot }} /> */}
                <div className="rp-status-card__value" style={{ color: cfg.text }}>{count}</div>
                <div className="rp-status-card__label" style={{ color: cfg.text }}>{cfg.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Monthly Trend */}
      <div className="rp-card">
        <div className="rp-card__header">
          <div className="rp-card__title">Submitted vs Released per Month</div>
          <div className="rp-card__sub">When the lines are close, your office is keeping up with demand</div>
        </div>
        <div className="rp-card__body">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData} margin={{ top: 10, right: 24, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Poppins' }} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'Poppins' }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Poppins' }} />
                <Line type="monotone" dataKey="Submitted" stroke="#7b1113" strokeWidth={2.5} dot={{ fill: '#7b1113', r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Released" stroke="#236a27" strokeWidth={2.5} dot={{ fill: '#236a27', r: 4 }} activeDot={{ r: 6 }} strokeDasharray="5 4" />
              </LineChart>
            </ResponsiveContainer>
          ) : <ChartEmpty />}
        </div>
      </div>

      {/* Document Types */}
      <div className="rp-card">
        <div className="rp-card__header">
          <div className="rp-card__title">Document Types</div>
          <div className="rp-card__sub">All document types sorted by request volume</div>
        </div>
        <div className="rp-card__body">
          {documentTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={documentTypes} margin={{ top: 10, right: 24, left: -10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="code" tick={{ fontSize: 11, fontFamily: 'Poppins' }} angle={-35} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'Poppins' }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rp-tooltip">
                        <p className="rp-tooltip__label">{d.name}</p>
                        <p className="rp-tooltip__item" style={{ color: '#6b7280', fontSize: 12 }}>Code: {d.code}</p>
                        <p className="rp-tooltip__item" style={{ color: payload[0].fill }}>Documents: <strong>{d.count}</strong></p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" name="Documents" radius={[6, 6, 0, 0]}>
                  {documentTypes.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <ChartEmpty />}
        </div>
      </div>

      {/* Submission & Release Methods */}
      <div className="rp-two-col">
        <div className="rp-card">
          <div className="rp-card__header">
            <div className="rp-card__title">Submission Methods</div>
            <div className="rp-card__sub">Online vs In-Person submissions</div>
          </div>
          <div className="rp-card__body">
            {subMethodData.length > 0 ? <DonutChart data={subMethodData} /> : <ChartEmpty />}
          </div>
        </div>
        <div className="rp-card">
          <div className="rp-card__header">
            <div className="rp-card__title">Release Methods</div>
            <div className="rp-card__sub">Online vs In-Person releases</div>
          </div>
          <div className="rp-card__body">
            {relMethodData.length > 0 ? <DonutChart data={relMethodData} /> : <ChartEmpty />}
          </div>
        </div>
      </div>

      {/* Staff Workload */}
      <div className="rp-card">
        <div className="rp-card__header">
          <div className="rp-card__title">Staff Workload</div>
          <div className="rp-card__sub">Current active assignments and completed documents per staff</div>
        </div>
        <div className="rp-card__body rp-card__body--no-pad">
          {staffPerformance.length === 0 ? <ChartEmpty /> : (
            <table className="rp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Role</th>
                  <th>Current Queue</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {staffPerformance.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'rp-table__row--even' : ''}>
                    <td className="rp-table__name">{item.staff.name}</td>
                    <td className="rp-table__sub">{item.staff.position || <span className="rp-unassigned">—</span>}</td>
                    <td>
                      <span className={`rp-role-badge ${item.staff.role === 'admin' ? 'rp-role-badge--admin' : 'rp-role-badge--staff'}`}>
                        {item.staff.role === 'admin' ? 'Admin' : 'Staff'}
                      </span>
                    </td>
                    <td>
                      <div className="rp-workload">
                        <span className="rp-workload__count">{item.workload}</span>
                        <div className="rp-workload__bar">
                          <div
                            className="rp-workload__fill"
                            style={{ width: `${Math.min(100, (item.workload / Math.max(...staffPerformance.map(s => s.workload), 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="rp-table__completed">{item.processed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Student Stats */}
      <div className="rp-card">
        <div className="rp-card__header">
          <div className="rp-card__title">Student Registrations</div>
          <div className="rp-card__sub">Students registered in the system</div>
        </div>
        <div className="rp-card__body">
          <div className="rp-student-stats">
            <div className="rp-student-stat-cards">
              <div className="rp-student-stat-card">
                <div className="rp-student-stat-card__value">{totalStudents}</div>
                <div className="rp-student-stat-card__label">Total Registered</div>
              </div>
              <div className="rp-student-stat-card rp-student-stat-card--active">
                <div className="rp-student-stat-card__value">{studentStats.active}</div>
                <div className="rp-student-stat-card__label">Active</div>
                <div className="rp-student-stat-card__hint">Logged in at least once</div>
              </div>
              <div className="rp-student-stat-card rp-student-stat-card--pending">
                <div className="rp-student-stat-card__value">{studentStats.pending}</div>
                <div className="rp-student-stat-card__label">Pending</div>
                <div className="rp-student-stat-card__hint">Never logged in</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}