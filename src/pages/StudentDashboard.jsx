import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDB } from '../contexts/DBContext';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Clock, Award } from 'lucide-react';

const DashboardHome = () => {
  const { user } = useAuth();
  const { getApplicationsByStudent } = useDB();
  const apps = getApplicationsByStudent(user.id);
  
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome, {user.name}</h1>
        <p className="text-muted">Here is an overview of your internship activities.</p>
      </div>
      <div className="grid-4 mb-6">
        <div className="card glass">
          <h3>Total Applications</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{apps.length}</p>
        </div>
        <div className="card glass">
          <h3>Pending</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>
            {apps.filter(a => a.status === 'pending').length}
          </p>
        </div>
        <div className="card glass">
          <h3>Approved</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
            {apps.filter(a => a.status === 'approved').length}
          </p>
        </div>
        <div className="card glass">
          <h3>Rejected</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
            {apps.filter(a => a.status === 'rejected').length}
          </p>
        </div>
      </div>
    </div>
  );
};

const BrowseInternships = () => {
  const { user } = useAuth();
  const { getApprovedInternships, applyForInternship, getApplicationsByStudent } = useDB();
  const internships = getApprovedInternships();
  const apps = getApplicationsByStudent(user.id);

  const hasApplied = (internshipId) => {
    const normalizedInternshipId = String(internshipId);
    return apps.some(a => String(a.internshipId) === normalizedInternshipId);
  };

  const handleApply = async (internship) => {
    try {
      await applyForInternship({
        studentId: user.id,
        studentName: user.name,
        internshipId: internship._id || internship.id,
        internshipTitle: internship.title,
        companyId: internship.companyId,
      });
      window.alert('Applied successfully!');
    } catch (error) {
      window.alert(error?.message || 'Could not apply for internship.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Available Internships</h1>
      </div>
      <div className="grid-2">
        {internships.map(i => (
          <div key={i._id || i.id} className="card glass">
            <h3>{i.title}</h3>
            <p className="text-muted">{i.companyName} • {i.location}{i.duration ? ` • ${i.duration}` : ''}</p>
            <p style={{ margin: '1rem 0' }}>{i.description}</p>
            <p style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Stipend: {i.stipend}</p>
            {hasApplied(i._id || i.id) ? (
              <button className="btn btn-secondary" disabled>Already Applied</button>
            ) : (
              <button className="btn btn-primary" onClick={() => handleApply(i)}>Apply Now</button>
            )}
          </div>
        ))}
        {internships.length === 0 && <p>No internships available at the moment.</p>}
      </div>
    </div>
  );
};

const MyApplications = () => {
  const { user } = useAuth();
  const { getApplicationsByStudent } = useDB();
  const apps = getApplicationsByStudent(user.id);

  const getStatusText = (status) => {
    if (status === 'pending') return 'Under review';
    if (status === 'shortlisted') return 'You have been shortlisted';
    if (status === 'selected') return 'You have been selected';
    if (status === 'approved') return 'Approved by company';
    if (status === 'rejected') return 'Application rejected';
    return status;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Track Application Status</h1>
        <p className="text-muted">Track all your internship applications and their latest review status.</p>
      </div>
      <div className="card glass">
        {apps.length === 0 ? <p>You haven't applied to any internships yet.</p> : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>Internship</th>
                <th>Applied On</th>
                <th>Status</th>
                <th>Tracking</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(a => (
                <tr key={a._id || a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>{a.internshipTitle}</td>
                  <td>{new Date(a.appliedAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${a.status}`}>
                      {a.status === 'pending' && <Clock size={12} style={{ marginRight: 4 }} />}
                      {a.status === 'approved' && <CheckCircle size={12} style={{ marginRight: 4 }} />}
                      {a.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{getStatusText(a.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const SubmitReports = () => {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Submit Reports</h1>
        <p className="text-muted">Upload your weekly/monthly internship progress reports.</p>
      </div>
      <div className="card glass" style={{ maxWidth: 600 }}>
        <div className="form-group">
          <label className="form-label">Report Title</label>
          <input type="text" className="form-input" placeholder="e.g. Week 1 Progress" />
        </div>
        <div className="form-group">
          <label className="form-label">Description / Summary</label>
          <textarea className="form-input" rows="4" placeholder="Briefly describe what you worked on."></textarea>
        </div>
        <div className="form-group">
          <label className="form-label">Attachment (PDF/Doc)</label>
          <input type="file" className="form-input" />
        </div>
        <button className="btn btn-primary" onClick={() => alert('Report submitted!')}>Submit Report</button>
      </div>
    </div>
  );
};


const MyCertificates = () => {
  const { user } = useAuth();
  const { getCertificatesByStudent } = useDB();
  const certs = getCertificatesByStudent(user.id);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Certificates</h1>
        <p className="text-muted">Certificates earned from your internships.</p>
      </div>
      <div className="grid-2">
        {certs.length === 0 ? <p>You haven't earned any certificates yet.</p> : (
          certs.map(c => (
            <div key={c.id} className="card glass" style={{ border: '2px solid var(--primary)' }}>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <Award size={48} style={{ color: 'var(--primary)' }} />
              </div>
              <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Certificate of Completion</h2>
              <h3 style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '1rem' }}>{c.studentName}</h3>
              <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
                For successfully completing the internship requirement as<br/>
                <strong>{c.internshipTitle}</strong><br/>
                at <strong>{c.companyName}</strong>.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                <div>
                  <span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Grade</span>
                  <strong>{c.grade}</strong>
                </div>
                <div>
                  <span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Issued On</span>
                  <strong>{new Date(c.issuedAt).toLocaleDateString()}</strong>
                </div>
              </div>
              {c.remarks && (
                <div style={{ marginTop: '1rem', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center' }}>
                  "{c.remarks}"
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const AcademicProfile = () => {
  const { user } = useAuth();
  const { studentProfile, getStudentProfile, upsertStudentProfile, uploadProfileCv, deleteStudentProfile } = useDB();
  const [profile, setProfile] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    degree: '',
    branch: '',
    collegeName: '',
    universityName: '',
    passingYear: '',
    cgpa: '',
    skills: '',
    cvUrl: '',
    updatedAt: null
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const data = await getStudentProfile();
        if (data) {
          setProfile({
            fullName: data.fullName || user.name || '',
            email: data.email || user.email || '',
            degree: data.degree || '',
            branch: data.branch || '',
            collegeName: data.collegeName || '',
            universityName: data.universityName || '',
            passingYear: data.passingYear || '',
            cgpa: data.cgpa || '',
            skills: (data.skills || []).join(', '),
            cvUrl: data.cvUrl || '',
            updatedAt: data.updatedAt || null
          });
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    };
    loadProfile();
  }, [getStudentProfile, user]);

  const onChange = (field) => (e) => {
  setProfile(prev => ({
    ...prev,
    [field]: e.target.value
  }));
};

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const savedProfile = await upsertStudentProfile({
        fullName: profile.fullName,
        email: profile.email,
        degree: profile.degree,
        branch: profile.branch,
        collegeName: profile.collegeName,
        universityName: profile.universityName,
        passingYear: profile.passingYear,
        cgpa: profile.cgpa,
        skills: profile.skills.split(',').map(x => x.trim()).filter(Boolean),
        cvUrl: profile.cvUrl
      });
      if (savedProfile?.updatedAt) {
        setProfile(prev => ({ ...prev, updatedAt: savedProfile.updatedAt }));
      }
      window.alert('Academic profile updated successfully');
    } catch (err) {
      console.error(err);
      window.alert('Could not save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      window.alert('Please upload a PDF file.');
      return;
    }

    try {
      const result = await uploadProfileCv(file);
      const cvUrl = result?.cvUrl || result?.profile?.cvUrl;
      if (cvUrl) {
        setProfile(prev => ({ ...prev, cvUrl }));
        window.alert('CV uploaded successfully');
      }
    } catch (err) {
      console.error(err);
      window.alert('CV upload failed');
    }
  };

  const handleDeleteProfile = async () => {
    const confirmed = window.confirm('Are you sure you want to permanently delete your academic profile? This cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteStudentProfile();
      setProfile({
        fullName: user?.name || '',
        email: user?.email || '',
        degree: '',
        branch: '',
        collegeName: '',
        universityName: '',
        passingYear: '',
        cgpa: '',
        skills: '',
        cvUrl: '',
        updatedAt: null
      });
      window.alert('Academic profile deleted successfully');
    } catch (err) {
      console.error(err);
      window.alert('Could not delete profile. Please try again.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Academic Profile</h1>
        <p className="text-muted">Edit and save your academic details. These are loaded on each login.</p>
        {profile.updatedAt && (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Last saved: {new Date(profile.updatedAt).toLocaleString()}
          </p>
        )}
      </div>
      <div className="card glass" style={{ maxWidth: 800 }}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" value={profile.fullName} disabled />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={profile.email} disabled />
        </div>
        <div className="form-group">
          <label className="form-label">Degree</label>
          <input className="form-input" value={profile.degree} onChange={onChange('degree')} placeholder="e.g. B.Tech" />
        </div>
        <div className="form-group">
          <label className="form-label">Branch</label>
          <input className="form-input" value={profile.branch} onChange={onChange('branch')} placeholder="e.g. Computer Science" />
        </div>
        <div className="form-group">
          <label className="form-label">College Name</label>
          <input className="form-input" value={profile.collegeName} onChange={onChange('collegeName')} placeholder="College Name" />
        </div>
        <div className="form-group">
          <label className="form-label">University Name</label>
          <input className="form-input" value={profile.universityName} onChange={onChange('universityName')} placeholder="University Name" />
        </div>
        <div className="form-group">
          <label className="form-label">Passing Year</label>
          <input className="form-input" value={profile.passingYear} onChange={onChange('passingYear')} placeholder="2025" />
        </div>
        <div className="form-group">
          <label className="form-label">CGPA</label>
          <input className="form-input" value={profile.cgpa} onChange={onChange('cgpa')} placeholder="8.5" />
        </div>
        <div className="form-group">
          <label className="form-label">Skills (comma separated)</label>
          <input className="form-input" value={profile.skills} onChange={onChange('skills')} placeholder="React, Node.js" />
        </div>
        <div className="form-group">
          <label className="form-label">CV (PDF)</label>
          <input type="file" className="form-input" accept="application/pdf" onChange={handleCvUpload} />
          {profile.cvUrl && (
            <p style={{ marginTop: 8 }}>
              <a href={profile.cvUrl} target="_blank" rel="noreferrer">View uploaded CV</a>
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Update and Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function StudentDashboard() {
  return (
    <Routes>
      <Route path="dashboard" element={<DashboardHome />} />
      <Route path="internships" element={<BrowseInternships />} />
      <Route path="applications" element={<MyApplications />} />
      <Route path="profile" element={<AcademicProfile />} />
      <Route path="reports" element={<SubmitReports />} />
      <Route path="certificates" element={<MyCertificates />} />
    </Routes>
  );
}
