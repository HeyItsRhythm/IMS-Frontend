import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDB } from '../contexts/DBContext';

const DashboardHome = () => {
  const { internships, applications } = useDB();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Placement Officer Dashboard</h1>
        <p className="text-muted">Institutional internship operations overview</p>
      </div>
      <div className="grid-3 mb-6">
        <div className="card glass">
          <h3>Internship Posts</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{internships.length}</p>
        </div>
        <div className="card glass">
          <h3>Total Applications</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{applications.length}</p>
        </div>
        <div className="card glass">
          <h3>Pending Internship Approvals</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>
            {internships.filter(i => i.status === 'pending').length}
          </p>
        </div>
      </div>
    </div>
  );
};

const ManageInternships = () => {
  const { internships, updateInternship } = useDB();
  const [actionError, setActionError] = useState('');
  const pending = internships.filter((i) => i.status === 'pending');

  const onDecision = async (id, status) => {
    setActionError('');
    try {
      await updateInternship(id, { status });
    } catch (err) {
      setActionError(err.message || 'Update failed');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Internships</h1>
        <p className="text-muted">Review company postings. Approve to show them to students, or reject to hide them.</p>
      </div>

      {actionError && <p style={{ color: '#dc2626', marginBottom: '0.75rem' }}>{actionError}</p>}

      <div className="card glass">
        <h3 style={{ marginBottom: '1rem' }}>Pending approval ({pending.length})</h3>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Title</th>
              <th>Company</th>
              <th>Stipend</th>
              <th>Duration</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((i) => (
              <tr key={i._id || i.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>{i.title}</td>
                <td>{i.companyName || '—'}</td>
                <td>{i.stipend || '—'}</td>
                <td>{i.duration || '—'}</td>
                <td style={{ maxWidth: '280px' }}>{i.description}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-primary" onClick={() => onDecision(i._id || i.id, 'approved')}>
                      Approve
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => onDecision(i._id || i.id, 'rejected')}>
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pending.length === 0 && <Empty text="No internships awaiting approval." colSpan={6} />}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Empty = ({ text, colSpan = 1 }) => (
  <tr>
    <td style={{ padding: '1rem' }} colSpan={colSpan}>{text}</td>
  </tr>
);

const ManageStudents = () => {
  const { listStudents, createStudent, updateStudent, deleteStudent } = useDB();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ q: '' });
  const [form, setForm] = useState({ name: '', email: '', password: '', course: '', year: '', skills: '', resume: '', status: 'active' });
  const [editingId, setEditingId] = useState(null);

  const loadStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listStudents(filters);
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm({ name: '', email: '', password: '', course: '', year: '', skills: '', resume: '', status: 'active' });
    setEditingId(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await updateStudent(editingId, { ...form, skills: form.skills });
      } else {
        await createStudent(form);
      }
      resetForm();
      await loadStudents();
    } catch (err) {
      setError(err.message || 'Failed to save student');
    }
  };

  const startEdit = (s) => {
    setEditingId(s._id || s.id);
    setForm({
      name: s.name || '',
      email: s.email || '',
      password: '',
      course: s.course || '',
      year: s.year || '',
      skills: Array.isArray(s.skills) ? s.skills.join(', ') : '',
      resume: s.resume || '',
      status: s.status || 'active'
    });
  };

  const removeStudent = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await deleteStudent(id);
      await loadStudents();
    } catch (err) {
      setError(err.message || 'Failed to delete student');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manage Students</h1>
        <p className="text-muted">Add, edit, remove, and search student records</p>
      </div>

      <div className="card glass" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>{editingId ? 'Edit Student' : 'Add Student'}</h3>
        <form onSubmit={onSubmit}>
          <div className="grid-2">
            <input className="form-input" placeholder="Name" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} required />
            <input className="form-input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} required />
            {!editingId && (
              <input className="form-input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))} required />
            )}
            <input className="form-input" placeholder="Course" value={form.course} onChange={(e) => setForm(prev => ({ ...prev, course: e.target.value }))} />
            <input className="form-input" placeholder="Year" value={form.year} onChange={(e) => setForm(prev => ({ ...prev, year: e.target.value }))} />
            <select className="form-input" value={form.status} onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          <input className="form-input" placeholder="Skills (comma separated)" value={form.skills} onChange={(e) => setForm(prev => ({ ...prev, skills: e.target.value }))} />

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary">{editingId ? 'Update Student' : 'Add Student'}</button>
            {editingId && <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>}
          </div>
          </div>
          
          
        </form>
      </div>

      <div className="card glass" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Search</h3>
        <input
          className="form-input"
          placeholder="Search by name, email, course, passing year, or skills"
          value={filters.q}
          onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
        />
        <button type="button" className="btn btn-secondary" style={{ marginTop: '0.75rem' }} onClick={loadStudents}>Search</button>
      </div>

      <div className="card glass">
        {error && <p style={{ color: '#dc2626', marginBottom: '0.75rem' }}>{error}</p>}
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Name</th>
              <th>Email</th>
              <th>Course</th>
              <th>Passing year</th>
              <th>Skills</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s._id || s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.course || '-'}</td>
                <td>{s.year || '-'}</td>
                <td>{Array.isArray(s.skills) && s.skills.length ? s.skills.join(', ') : '-'}</td>
                <td style={{ textTransform: 'capitalize' }}>{s.status || 'active'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" onClick={() => startEdit(s)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => removeStudent(s._id || s.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && students.length === 0 && <Empty text="No students found." colSpan={7} />}
            {loading && <Empty text="Loading students..." colSpan={7} />}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ManageCompanies = () => {
  const { listCompanies, updateCompanyApproval } = useDB();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ q: '', approvalStatus: '' });

  const loadCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listCompanies(filters);
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApproval = async (id, status) => {
    try {
      await updateCompanyApproval(id, status);
      await loadCompanies();
    } catch (err) {
      setError(err.message || 'Failed to update approval status');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manage Companies</h1>
        <p className="text-muted">View, approve, or reject company registrations</p>
      </div>

      <div className="card glass" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Filter Companies</h3>
        <div className="grid-2">
          <input className="form-input" placeholder="Search company/email/location" value={filters.q} onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))} />
          <select className="form-input" value={filters.approvalStatus} onChange={(e) => setFilters(prev => ({ ...prev, approvalStatus: e.target.value }))}>
            <option value="">All Approval Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

          <button className="btn btn-secondary" onClick={loadCompanies}>Apply Filters</button>
    
        
      </div>

      <div className="card glass">
        {error && <p style={{ color: '#dc2626', marginBottom: '0.75rem' }}>{error}</p>}
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Company</th>
              <th>Email</th>
              <th>Location</th>
              <th>Description</th>
              <th>Approval Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c._id || c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>{c.companyName || c.name}</td>
                <td>{c.email}</td>
                <td>{c.location || c.address || '-'}</td>
                <td>{c.description || '-'}</td>
                <td style={{ textTransform: 'capitalize' }}>{c.approvalStatus || 'pending'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={() => onApproval(c._id || c.id, 'active')}>Approve</button>
                    <button className="btn btn-danger" onClick={() => onApproval(c._id || c.id, 'rejected')}>Reject</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && companies.length === 0 && <Empty text="No companies found." colSpan={6} />}
            {loading && <Empty text="Loading companies..." colSpan={6} />}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MonitorProgress = () => {
  const { applications } = useDB();
  const pending = applications.filter(a => a.status === 'pending').length;
  const shortlisted = applications.filter(a => a.status === 'shortlisted').length;
  const selected = applications.filter(a => a.status === 'selected' || a.status === 'approved').length;
  const rejected = applications.filter(a => a.status === 'rejected').length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Monitor Internship Progress</h1>
        <p className="text-muted">Track applicant movement through internship stages</p>
      </div>
      <div className="grid-2">
        <div className="card glass"><h3>Pending</h3><p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>{pending}</p></div>
        <div className="card glass"><h3>Shortlisted</h3><p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0ea5e9' }}>{shortlisted}</p></div>
        <div className="card glass"><h3>Selected</h3><p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>{selected}</p></div>
        <div className="card glass"><h3>Rejected</h3><p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{rejected}</p></div>
      </div>
    </div>
  );
};

const GenerateReports = () => {
  const { internships, applications, certificates } = useDB();
  const reportRows = [
    { metric: 'Total Internship Posts', value: internships.length },
    { metric: 'Approved Internship Posts', value: internships.filter(i => i.status === 'approved').length },
    { metric: 'Total Applications', value: applications.length },
    { metric: 'Selected Interns', value: applications.filter(a => a.status === 'selected' || a.status === 'approved').length },
    { metric: 'Rejected Applications', value: applications.filter(a => a.status === 'rejected').length },
    { metric: 'Certificates Issued', value: certificates.length },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Generate Internship Reports</h1>
        <p className="text-muted">Institution-level report snapshot</p>
      </div>
      <div className="card glass">
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {reportRows.map(r => (
              <tr key={r.metric} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>{r.metric}</td>
                <td>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const InstitutionalRecords = () => {
  const { getAllUsers, listCompanies, applications, internships, listInstitutionalReports, deleteInstitutionalReport } = useDB();
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [reports, setReports] = useState([]);
  const [historyQuery, setHistoryQuery] = useState('');
  const [partnershipQuery, setPartnershipQuery] = useState('');
  const [reportQuery, setReportQuery] = useState('');
  const [recordsError, setRecordsError] = useState('');

  useEffect(() => {
    getAllUsers().then((data) => setUsers(Array.isArray(data) ? data : [])).catch(() => setUsers([]));
    listCompanies().then((data) => setCompanies(Array.isArray(data) ? data : [])).catch(() => setCompanies([]));
    listInstitutionalReports().then((data) => setReports(Array.isArray(data) ? data : [])).catch(() => setReports([]));
  }, [getAllUsers, listCompanies, listInstitutionalReports]);

  const studentHistory = useMemo(() => {
    const normalizedQuery = historyQuery.toLowerCase().trim();
    const rows = applications.map((a) => ({
      key: a._id || a.id,
      studentName: a.studentName || 'Student',
      internshipTitle: a.internshipTitle || '-',
      companyName: internships.find((i) => String(i._id || i.id) === String(a.internshipId))?.companyName || '-',
      status: a.status || '-',
      appliedAt: a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : '-'
    }));
    if (!normalizedQuery) return rows;
    return rows.filter((r) => `${r.studentName} ${r.internshipTitle} ${r.companyName} ${r.status}`.toLowerCase().includes(normalizedQuery));
  }, [applications, internships, historyQuery]);

  const companyPartnerships = useMemo(() => {
    const rows = companies.map((c) => {
      const companyName = c.companyName || c.name;
      return {
        key: c._id || c.id,
        companyName,
        email: c.email,
        industryType: c.industryType || '-',
        address: c.address || c.location || '-'
      };
    });
    const normalizedQuery = partnershipQuery.toLowerCase().trim();
    if (!normalizedQuery) return rows;
    return rows.filter((r) => `${r.companyName} ${r.email} ${r.industryType} ${r.address}`.toLowerCase().includes(normalizedQuery));
  }, [companies, partnershipQuery]);

  const filteredReports = useMemo(() => {
    const normalizedQuery = reportQuery.toLowerCase().trim();
    if (!normalizedQuery) return reports;
    return reports.filter((r) =>
      `${r.studentName} ${r.internshipTitle} ${r.companyName} ${r.reportTitle} ${r.reportContent}`.toLowerCase().includes(normalizedQuery)
    );
  }, [reports, reportQuery]);

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Delete this report from institutional records?')) return;
    setRecordsError('');
    try {
      await deleteInstitutionalReport(id);
      const data = await listInstitutionalReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setRecordsError(err.message || 'Failed to delete report');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Maintain Institutional Records</h1>
        <p className="text-muted">Student internship history and company partnerships</p>
      </div>

      {recordsError && <p style={{ color: '#dc2626', marginBottom: '0.75rem' }}>{recordsError}</p>}

      <div className="card glass" style={{ marginBottom: '1rem' }}>
        <h3>Student Internship History</h3>
        <input
          className="form-input"
          placeholder="Search student/internship/company/status"
          value={historyQuery}
          onChange={(e) => setHistoryQuery(e.target.value)}
        />
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Student</th>
              <th>Internship</th>
              <th>Company</th>
              <th>Status</th>
              <th>Applied On</th>
            </tr>
          </thead>
          <tbody>
            {studentHistory.map((r) => (
              <tr key={r.key} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>{r.studentName}</td>
                <td>{r.internshipTitle}</td>
                <td>{r.companyName}</td>
                <td style={{ textTransform: 'capitalize' }}>{r.status}</td>
                <td>{r.appliedAt}</td>
              </tr>
            ))}
            {studentHistory.length === 0 && <Empty text="No internship history records." colSpan={5} />}
          </tbody>
        </table>
      </div>

      <div className="card glass" style={{ marginBottom: '1rem' }}>
        <h3>Company Partnerships</h3>
        <input
          className="form-input"
          placeholder="Search company/industry type/location"
          value={partnershipQuery}
          onChange={(e) => setPartnershipQuery(e.target.value)}
        />
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Company</th>
              <th>Email</th>
              <th>Industry Type</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {companyPartnerships.map((r) => (
              <tr key={r.key} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>{r.companyName}</td>
                <td>{r.email}</td>
                <td>{r.industryType}</td>
                <td>{r.address}</td>
              </tr>
            ))}
            {companyPartnerships.length === 0 && <Empty text="No company partnerships found." colSpan={4} />}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  return (
    <Routes>
      <Route path="dashboard" element={<DashboardHome />} />
      <Route path="students" element={<ManageStudents />} />
      <Route path="companies" element={<ManageCompanies />} />
      <Route path="internships" element={<ManageInternships />} />
      <Route path="approvals" element={<Navigate to="/admin/internships" replace />} />
      <Route path="progress" element={<MonitorProgress />} />
      <Route path="reports" element={<GenerateReports />} />
      <Route path="records" element={<InstitutionalRecords />} />
    </Routes>
  );
}
