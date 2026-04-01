import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDB } from '../contexts/DBContext';
import { useAuth } from '../contexts/AuthContext';

const INDUSTRY_OPTIONS = [
  'Technology', 'Finance & Banking', 'Healthcare', 'Education',
  'E-commerce & Retail', 'Manufacturing', 'Media & Entertainment',
  'Consulting', 'Non-Profit', 'Government', 'Other',
];

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Other'];

const Field = ({ label, id, children, error }) => (
  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
    <label htmlFor={id} className="form-label" style={{ fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
      {label}
    </label>
    {children}
    {error && (
      <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{error}</p>
    )}
  </div>
);

const CompanyDetails = () => {
  const { user } = useAuth();
  const { companyProfile, upsertCompanyProfile } = useDB();

  const [profile, setProfile] = useState({
    companyName: companyProfile?.companyName || user?.name || '',
    industryType: companyProfile?.industryType || '',
    description: companyProfile?.description || '',
    email: companyProfile?.email || user?.email || '',
    country: companyProfile?.country || '',
    state: companyProfile?.state || '',
    city: companyProfile?.city || '',
  });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // When companyProfile loads (after login), populate the form.
    if (!companyProfile) return;
    setProfile({
      companyName: companyProfile.companyName || user?.name || '',
      industryType: companyProfile.industryType || '',
      description: companyProfile.description || '',
      email: companyProfile.email || user?.email || '',
      country: companyProfile.country || '',
      state: companyProfile.state || '',
      city: companyProfile.city || '',
    });
    setSaved(false);
    setErrors({});
  }, [companyProfile, user?.name, user?.email]);

  const validate = () => {
    const e = {};
    if (!profile.companyName.trim()) e.companyName = 'Company name is required.';
    if (!profile.industryType) e.industryType = 'Please select an industry.';
    if (!profile.email.trim() || !/\S+@\S+\.\S+/.test(profile.email))
      e.email = 'A valid email is required.';
    if (!profile.country) e.country = 'Please select a country.';
    if (!profile.state.trim()) e.state = 'State / Province is required.';
    if (!profile.city.trim()) e.city = 'City is required.';
    return e;
  };

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    setSaved(false);
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    upsertCompanyProfile(profile)
      .then(() => {
        setSaved(true);
        window.alert('Company details saved successfully!');
      })
      .catch((err) => setErrors({ form: err?.message || 'Failed to save details.' }))
      .finally(() => setSaving(false));
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Company Details</h1>
        <p className="text-muted">Manage your company profile and contact information.</p>
      </div>

      <div className="card glass" style={{ maxWidth: '760px' }}>
        {/* ── Basic Info ── */}
        <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          Basic Information
        </h3>

        <Field label="Company Name *" id="companyName" error={errors.companyName}>
          <input
            id="companyName"
            className="form-input"
            // placeholder="e.g. Acme Corp"
            value={profile.companyName}
            onChange={e => handleChange('companyName', e.target.value)}
          />
        </Field>

        <Field label="Industry Type *" id="industryType" error={errors.industryType}>
          <select
            id="industryType"
            className="form-input"
            value={profile.industryType}
            onChange={e => handleChange('industryType', e.target.value)}
          >
            <option value="">-- Select Industry --</option>
            {INDUSTRY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </Field>

        <Field label="Company Description" id="description">
          
          <textarea
            id="description"
            className="form-input"
            rows="4"
            // placeholder="Example: ABC Technologies is a software company focused on web and AI solutions. We offer interns hands-on experience, mentoring, and project ownership in a collaborative environment."
            value={profile.description}
            onChange={e => handleChange('description', e.target.value)}
            style={{ resize: 'vertical' }}
          />
          
        </Field>

        {/* ── Contact ── */}
        <h3 style={{ margin: '1.5rem 0 1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          Contact Information
        </h3>

        <Field label="Email Address *" id="email" error={errors.email}>
          <input
            id="email"
            type="email"
            className="form-input"
            // placeholder="hr@yourcompany.com"
            value={profile.email}
            onChange={e => handleChange('email', e.target.value)}
          />
        </Field>

        {/* ── Address ── */}
        <h3 style={{ margin: '1.5rem 0 1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          Address
        </h3>

        <Field label="Country *" id="country" error={errors.country}>
          <select
            id="country"
            className="form-input"
            value={profile.country}
            onChange={e => handleChange('country', e.target.value)}
          >
            <option value="">-- Select Country --</option>
            {COUNTRIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>

        <div className="grid-2">
          <Field label="State / Province *" id="state" error={errors.state}>
            <input
              id="state"
              className="form-input"
              // placeholder="e.g. Gujarat"
              value={profile.state}
              onChange={e => handleChange('state', e.target.value)}
            />
          </Field>

          <Field label="City *" id="city" error={errors.city}>
            <input
              id="city"
              className="form-input"
              // placeholder="e.g. Ahmedabad"
              value={profile.city}
              onChange={e => handleChange('city', e.target.value)}
            />
          </Field>
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            Save Details
          </button>
          {saved && (
            <span style={{ color: '#059669', fontWeight: 600, fontSize: '0.9rem' }}>
              ✓ Details saved successfully!
            </span>
          )}
          {errors.form && (
            <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.9rem' }}>
              {errors.form}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardHome = () => {
  const { user } = useAuth();
  const { getInternshipsByCompany, getApplicationsByInternship, companyPartnership, getCompanyPartnership, companyProfile } = useDB();
  const internships = getInternshipsByCompany(user.id);
  const allApplications = internships.flatMap(i => getApplicationsByInternship(i._id));

  const pendingCount = allApplications.filter(a => a.status === 'pending').length;
  const shortlistedCount = allApplications.filter(a => a.status === 'shortlisted').length;
  const selectedCount = allApplications.filter(a => a.status === 'selected').length;

  useEffect(() => {
    getCompanyPartnership().catch(() => {});
  }, [getCompanyPartnership]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Company Dashboard</h1>
        <p className="text-muted">{user.name}</p>
      </div>
      <div className="grid-3 mb-6">
        <div className="card glass">
          <h3>Total Postings</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{internships.length}</p>
        </div>
        <div className="card glass">
          <h3>Pending Applications</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>{pendingCount}</p>
        </div>
        <div className="card glass">
          <h3>Selected Interns</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>{selectedCount}</p>
        </div>
      </div>

      
    </div>
  );
};

const ManagePostings = () => {
  const { user } = useAuth();
  const { getInternshipsByCompany, addInternship, deleteInternship } = useDB();
  const internships = getInternshipsByCompany(user.id);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({ title: '', description: '', location: '', stipend: '', duration: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addInternship({
        ...formData,
        companyId: user.id,
        companyName: user.name
      });
      setShowForm(false);
      setFormData({ title: '', description: '', location: '', stipend: '', duration: '' });
    } catch (err) {
      window.alert(err?.message || 'Could not submit internship.');
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to remove this internship posting?")) {
      deleteInternship(id);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1 className="page-title">Manage Postings</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Post New Internship'}
        </button>
      </div>

      {showForm && (
        <div className="card glass" style={{ marginBottom: '2rem' }}>
          <h3>New Internship Notice</h3>
          <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Job Title</label>
              <input required className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea required className="form-input" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Location</label>
                <input required className="form-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Stipend</label>
                <input required className="form-input" value={formData.stipend} onChange={e => setFormData({...formData, stipend: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Submit for Approval</button>
          </form>
        </div>
      )}

      <div className="grid-2">
        {internships.map(i => (
          <div key={i._id} className="card glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3>{i.title}</h3>
                <p className="text-muted">
                  {i.location} • {i.stipend}
                  {i.duration ? ` • ${i.duration}` : ''}
                </p>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ color: '#dc2626', borderColor: '#f87171', padding: '0.25rem 0.5rem' }} 
                onClick={() => handleDelete(i._id || i.id)}
              >
                Remove
              </button>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <span className={`badge badge-${i.status}`}>Status: {i.status.toUpperCase()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReviewApplicants = () => {
  const { user } = useAuth();
  const { getInternshipsByCompany, getApplicationsByInternship, updateApplicationStatus } = useDB();
  const [statusFilter, setStatusFilter] = useState('all');
  const internships = getInternshipsByCompany(user.id);
  const allApps = internships.flatMap(i => getApplicationsByInternship(i._id));

  const filteredApps = statusFilter === 'all'
    ? allApps
    : allApps.filter(a => a.status === statusFilter);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Review Applicants</h1>
        <p className="text-muted">Approve, shortlist or reject incoming applications for your internships.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <label htmlFor="statusFilter" style={{ fontWeight: 600 }}>Filter by status:</label>
        <select
          id="statusFilter"
          className="form-input"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ width: '180px' }}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="selected">Selected</option>
          <option value="rejected">Rejected</option>
        </select>
        <span className="text-muted">Showing {filteredApps.length} of {allApps.length} applications</span>
      </div>

      <div className="card glass">
        {filteredApps.length === 0 ? <p>No matching applications.</p> : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>Student Name</th>
                <th>Internship Role</th>
                <th>Applied On</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map(a => (
                <tr key={a._id || a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>{a.studentName}</td>
                  <td>{a.internshipTitle}</td>
                  <td>{formatDate(a.appliedAt)}</td>
                  <td><span className={`badge badge-${a.status}`}>{a.status.toUpperCase()}</span></td>
                  <td>
                    {a.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" onClick={() => updateApplicationStatus(a._id || a.id, 'shortlisted')} style={{ color: '#0ea5e9' }}>Shortlist</button>
                        <button className="btn btn-secondary" onClick={() => updateApplicationStatus(a._id || a.id, 'rejected')} style={{ color: 'red' }}>Reject</button>
                      </div>
                    )}
                    {a.status === 'shortlisted' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" onClick={() => updateApplicationStatus(a._id || a.id, 'selected')} style={{ color: 'green' }}>Select</button>
                        <button className="btn btn-secondary" onClick={() => updateApplicationStatus(a._id || a.id, 'rejected')} style={{ color: 'red' }}>Reject</button>
                      </div>
                    )}
                    {a.status === 'selected' && <span className="text-success">Selected for internship</span>}
                    {a.status === 'rejected' && <span className="text-danger">Rejected</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const IssueCertificates = () => {
  const { user } = useAuth();
  const { getInternshipsByCompany, getApplicationsByInternship, getCertificatesByCompany, issueCertificate, companyProfile } = useDB();
  const resolvedCompanyName = companyProfile?.companyName || user?.name;
  
  const internships = getInternshipsByCompany(user.id);
  const allApps = internships.flatMap(i => getApplicationsByInternship(i._id));
  const approvedApps = allApps.filter(a => a.status === 'selected' || a.status === 'approved');
  const issuedCerts = getCertificatesByCompany(user.id);
  
  const [formData, setFormData] = useState({});

  const handleIssue = (app) => {
    const key = app._id || app.id;
    const data = formData[key] || { grade: 'A', remarks: 'Excellent performance', companyName: resolvedCompanyName };
    issueCertificate({
      studentId: app.studentId,
      studentName: app.studentName,
      companyId: user.id,
      companyName: data.companyName || resolvedCompanyName,
      internshipId: app.internshipId,
      internshipTitle: app.internshipTitle,
      grade: data.grade,
      remarks: data.remarks
    });
    alert('Certificate issued successfully!');
  };

  const handleFormChange = (appId, field, value) => {
    setFormData(prev => ({
      ...prev,
      [appId]: {
        ...(prev[appId] || { grade: 'A', remarks: '', companyName: resolvedCompanyName }),
        [field]: value
      }
    }));
  };

  const pendingCerts = approvedApps.filter(app => !issuedCerts.some(c => c.internshipId === app.internshipId && c.studentId === app.studentId));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Issue Certificates</h1>
        <p className="text-muted">Evaluate intern performance and provide certificates.</p>
      </div>
      <div className="card glass">
        {pendingCerts.length === 0 ? <p>No active interns eligible for certification at this time.</p> : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>Student Name</th>
                <th>Internship Role</th>
                <th>Company Name</th>
                <th>Grade</th>
                <th>Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingCerts.map(a => (
                <tr key={a._id || a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>{a.studentName}</td>
                  <td>{a.internshipTitle}</td>
                  <td>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Company" 
                      style={{ padding: '0.25rem', marginBottom: 0, width: '120px' }}
                      value={formData[a._id || a.id]?.companyName !== undefined ? formData[a._id || a.id].companyName : resolvedCompanyName}
                      onChange={(e) => handleFormChange(a._id || a.id, 'companyName', e.target.value)}
                    />
                  </td>
                  <td>
                    <select 
                      className="form-input" 
                      style={{ padding: '0.25rem', width: '80px', marginBottom: 0 }}
                      value={formData[a._id || a.id]?.grade || 'A'}
                      onChange={(e) => handleFormChange(a._id || a.id, 'grade', e.target.value)}
                    >
                      <option value="O">O</option>
                      <option value="A+">A+</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Remarks..." 
                      style={{ padding: '0.25rem', marginBottom: 0 }}
                      value={formData[a._id || a.id]?.remarks || ''}
                      onChange={(e) => handleFormChange(a._id || a.id, 'remarks', e.target.value)}
                    />
                  </td>
                  <td>
                    <button className="btn btn-primary" onClick={() => handleIssue(a)}>Issue</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default function CompanyDashboard() {
  return (
    <Routes>
      <Route path="dashboard" element={<DashboardHome />} />
      <Route path="details" element={<CompanyDetails />} />
      <Route path="postings" element={<ManagePostings />} />
      <Route path="applications" element={<ReviewApplicants />} />
      <Route path="certificates" element={<IssueCertificates />} />
    </Routes>
  );
}
