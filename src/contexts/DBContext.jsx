import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DBContext = createContext();
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export const useDB = () => useContext(DBContext);

export const DBProvider = ({ children }) => {
  const { token } = useAuth();

  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [companyPartnership, setCompanyPartnership] = useState(null);

  const getAuthHeaders = () => {
    const tokenHeader = token || localStorage.getItem('ims_token');
    return tokenHeader ? { Authorization: `Bearer ${tokenHeader}` } : {};
  };

  const fetchData = async () => {
    const rawUser = localStorage.getItem('ims_user');
    const currentUserEarly = rawUser ? JSON.parse(rawUser) : null;
    const internshipsUrl =
      currentUserEarly?.role === 'student'
        ? `${API_BASE}/api/internships/approved`
        : `${API_BASE}/api/internships`;
    const i = await fetch(internshipsUrl).then((r) => r.json());

    const token = localStorage.getItem('ims_token');
    const currentUser = currentUserEarly;
    const storedCompanyProfile = localStorage.getItem('ims_companyProfile');

    const applicationsUrl = currentUser?.role === 'company'
      ? `${API_BASE}/api/applications/company`
      : currentUser?.role === 'admin'
        ? `${API_BASE}/api/applications`
        : `${API_BASE}/api/applications/me`;

    const certificatesUrl = currentUser?.role === 'company'
      ? `${API_BASE}/api/certificates/company`
      : currentUser?.role === 'student'
        ? `${API_BASE}/api/certificates/student`
        : `${API_BASE}/api/certificates`;

    const companyProfileUrl = currentUser?.role === 'company'
      ? `${API_BASE}/api/company/profile`
      : null;
    const companyPartnershipUrl = currentUser?.role === 'company'
      ? `${API_BASE}/api/company/partnership`
      : null;

    const a = token
      ? await fetch(applicationsUrl, { headers: { Authorization: `Bearer ${token}` } }).then(r => (r.ok ? r.json() : []))
      : [];
    const c = token
      ? await fetch(certificatesUrl, { headers: { Authorization: `Bearer ${token}` } }).then(r => (r.ok ? r.json() : []))
      : [];

    let companyProf = null;
    let partnership = null;
    if (token && companyProfileUrl) {
      const profRes = await fetch(companyProfileUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (profRes.ok) {
        companyProf = await profRes.json();
        localStorage.setItem('ims_companyProfile', JSON.stringify(companyProf));
      } else if (storedCompanyProfile) {
        companyProf = JSON.parse(storedCompanyProfile);
      }
      if (companyPartnershipUrl) {
        const partnershipRes = await fetch(companyPartnershipUrl, { headers: { Authorization: `Bearer ${token}` } });
        if (partnershipRes.ok) partnership = await partnershipRes.json();
      }
    } else if (storedCompanyProfile && currentUser?.role === 'company') {
      companyProf = JSON.parse(storedCompanyProfile);
    } else if (currentUser?.role !== 'company') {
      localStorage.removeItem('ims_companyProfile');
    }

    let profile = null;
    const storedProfile = localStorage.getItem('ims_studentProfile');

    if (currentUser?.role === 'student' && token) {
      const profileRes = await fetch(`${API_BASE}/api/student/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileRes.ok) {
        profile = await profileRes.json();
        localStorage.setItem('ims_studentProfile', JSON.stringify(profile));
      }
    } else if (storedProfile) {
      profile = JSON.parse(storedProfile);
    }

    setInternships(i);
    setApplications(a);
    setCertificates(c);
    setStudentProfile(profile);
    setCompanyProfile(companyProf);
    setCompanyPartnership(partnership);
  };

  useEffect(() => { fetchData(); }, [token]);

  const addInternship = async (internship) => {
    const res = await fetch(`${API_BASE}/api/internships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ ...internship, createdAt: new Date().toISOString() })
    });
    const newItem = await res.json();
    if (!res.ok) throw new Error(newItem.message || newItem.error || 'Could not create internship');
    setInternships((prev) => [...prev, newItem]);
    return newItem;
  };

  const updateInternship = async (id, updates) => {
    const res = await fetch(`${API_BASE}/api/internships/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updates)
    });
    const item = await res.json();
    if (!res.ok) throw new Error(item.message || 'Could not update internship');
    const sid = String(item._id);
    setInternships((prev) => prev.map((i) => (String(i._id) === sid ? item : i)));
    return item;
  };

  const deleteInternship = async (id) => {
    await fetch(`${API_BASE}/api/internships/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    const sid = String(id);
    setInternships((prev) => prev.filter((i) => String(i._id) !== sid));
  };

  const getInternshipsByCompany = (companyId) => internships.filter(i => i.companyId === companyId);
  const getApprovedInternships = () => internships.filter(i => i.status === 'approved');

  const applyForInternship = async (application) => {
    const res = await fetch(`${API_BASE}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ ...application, status: 'pending', appliedAt: new Date().toISOString() })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to apply' }));
      throw new Error(err.message || 'Failed to apply');
    }

    const newApp = await res.json();
    setApplications(prev => [...prev, newApp]);
    return newApp;
  };

  const updateApplicationStatus = async (id, status) => {
    const res = await fetch(`${API_BASE}/api/applications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status })
    });
    const updated = await res.json();
    setApplications(prev => prev.map(a => a._id === updated._id ? updated : a));
    return updated;
  };

  const getApplicationsByStudent = (studentId) =>
    applications.filter(a => String(a.studentId) === String(studentId));

  const getApplicationsByInternship = (internshipId) =>
    applications.filter(a => String(a.internshipId) === String(internshipId));

  const issueCertificate = async (certificate) => {
    const res = await fetch(`${API_BASE}/api/certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ ...certificate, issuedAt: new Date().toISOString() })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to issue certificate' }));
      throw new Error(err.message || 'Failed to issue certificate');
    }
    const added = await res.json();
    setCertificates(prev => [...prev, added]);
    return added;
  };

  const getCertificatesByStudent = (studentId) => certificates.filter(c => c.studentId === studentId);
  const getCertificatesByCompany = (companyId) => certificates.filter(c => c.companyId === companyId);

  const getAllUsers = async () => {
    const res = await fetch(`${API_BASE}/api/admin/users`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  };

  const listStudents = async (filters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') query.set(k, String(v).trim());
    });
    const res = await fetch(`${API_BASE}/api/admin/students?${query.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  };

  const createStudent = async (student) => {
    const res = await fetch(`${API_BASE}/api/admin/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(student)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Failed to add student');
    return data;
  };

  const updateStudent = async (id, updates) => {
    const res = await fetch(`${API_BASE}/api/admin/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updates)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Failed to update student');
    return data;
  };

  const deleteStudent = async (id) => {
    const res = await fetch(`${API_BASE}/api/admin/students/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Failed to delete student');
    return data;
  };

  const listCompanies = async (filters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') query.set(k, String(v).trim());
    });
    const res = await fetch(`${API_BASE}/api/admin/companies?${query.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch companies');
    return res.json();
  };

  const updateCompanyApproval = async (id, approvalStatus) => {
    const res = await fetch(`${API_BASE}/api/admin/companies/${id}/approval`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ approvalStatus })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Failed to update company approval');
    return data;
  };

  const listInstitutionalReports = async () => {
    const res = await fetch(`${API_BASE}/api/admin/reports`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  };

  const deleteInstitutionalReport = async (id) => {
    const res = await fetch(`${API_BASE}/api/admin/reports/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Failed to delete report');
    return data;
  };

  const getStudentProfile = async () => {
    const res = await fetch(`${API_BASE}/api/student/profile`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('ims_token')}` }
    });
    const data = await res.json();
    if (res.ok) {
      setStudentProfile(data);
      localStorage.setItem('ims_studentProfile', JSON.stringify(data));
    }
    return data;
  };

  const deleteStudentProfile = async () => {
    const res = await fetch(`${API_BASE}/api/student/profile`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('ims_token')}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Delete failed' }));
      throw new Error(err.message || 'Delete failed');
    }
    setStudentProfile(null);
    localStorage.removeItem('ims_studentProfile');
    return await res.json();
  };

  const upsertStudentProfile = async (profile) => {
    const res = await fetch(`${API_BASE}/api/student/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('ims_token')}`
      },
      body: JSON.stringify(profile)
    });
    const data = await res.json();
    if (res.ok) {
      setStudentProfile(data);
      localStorage.setItem('ims_studentProfile', JSON.stringify(data));
    }
    return data;
  };

  const upsertCompanyProfile = async (profile) => {
    const res = await fetch(`${API_BASE}/api/company/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(profile),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setCompanyProfile(data);
      localStorage.setItem('ims_companyProfile', JSON.stringify(data));
    }
    if (!res.ok) throw new Error(data?.message || 'Failed to save company profile');
    return data;
  };

  const getCompanyPartnership = async () => {
    const res = await fetch(`${API_BASE}/api/company/partnership`, { headers: getAuthHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Failed to fetch company partnership');
    setCompanyPartnership(data);
    return data;
  };

  const uploadDocument = async (file) => {
    const form = new FormData();
    form.append('document', file);

    const res = await fetch(`${API_BASE}/api/student/documents`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('ims_token')}` },
      body: form
    });
    return res.json();
  };

  const uploadProfileCv = async (file) => {
    const form = new FormData();
    form.append('cv', file);

    const res = await fetch(`${API_BASE}/api/student/profile/cv`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('ims_token')}` },
      body: form
    });
    return res.json();
  };

  const listDocuments = async () => {
    const res = await fetch(`${API_BASE}/api/student/documents`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('ims_token')}` }
    });
    return res.json();
  };

  const submitReport = async (report) => {
    const res = await fetch(`${API_BASE}/api/student/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('ims_token')}`
      },
      body: JSON.stringify(report)
    });
    return res.json();
  };

  const listReports = async () => {
    const res = await fetch(`${API_BASE}/api/student/reports`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('ims_token')}` }
    });
    return res.json();
  };

  const value = {
    internships,
    applications,
    addInternship,
    updateInternship,
    deleteInternship,
    getInternshipsByCompany,
    getApprovedInternships,
    applyForInternship,
    updateApplicationStatus,
    getApplicationsByStudent,
    getApplicationsByInternship,
    certificates,
    issueCertificate,
    getCertificatesByStudent,
    getCertificatesByCompany,
    companyProfile,
    companyPartnership,
    getAllUsers,
    listStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    listCompanies,
    updateCompanyApproval,
    listInstitutionalReports,
    deleteInstitutionalReport,
    studentProfile,
    getStudentProfile,
    upsertStudentProfile,
    upsertCompanyProfile,
    getCompanyPartnership,
    deleteStudentProfile,
    uploadProfileCv,
    uploadDocument,
    listDocuments,
    submitReport,
    listReports
  };

  return <DBContext.Provider value={value}>{children}</DBContext.Provider>;
};
