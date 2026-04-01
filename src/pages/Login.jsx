import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, KeyRound } from 'lucide-react';
import emailjs from 'emailjs-com';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userOtp, setUserOtp] = useState('');
  const [pendingUser, setPendingUser] = useState(null);
  
  const { login, finalizeLogin, verifyUserEmail, token } = useAuth();
  const navigate = useNavigate();
  const savedStudentProfile = JSON.parse(localStorage.getItem('ims_studentProfile') || 'null');

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      // Admin bypasses OTP. Verified users bypass OTP.
      // (Using strictly false so older existing accounts don't get locked out)
      if (user.role === 'admin' || user.isVerified !== false) {
        finalizeLogin(user);
        navigate('/');
        return;
      }
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);
      setPendingUser(user);

      // --- EMAILJS CONFIGURATION ---
      const SERVICE_ID = 'service_f8lquk8';
      const TEMPLATE_ID = 'template_t3vk7uu';
      const PUBLIC_KEY = '-c6vzS6kgWs4oVRJX';

      try {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
          to_email: email,
          otp_code: otp,
          to_name: user.name
        }, PUBLIC_KEY);
      } catch (err) {
        console.error("EmailJS sending failed:", err);
        console.log("PRESENTATION OTP FALLBACK: " + otp);
        alert("EmailJS Failed to send the email.\nError: " + (err.text || err.message) + "\n\nFallback OTP for testing: " + otp);
      }

      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (userOtp.trim() === generatedOtp.trim()) {
      try {
        await verifyUserEmail(pendingUser.id);
        const verifiedUser = { ...pendingUser, isVerified: true };
        finalizeLogin(verifiedUser, token);
        navigate('/');
      } catch (err) {
        const message = err?.message || err || 'Error verifying email. Please try again.';
        setError(`Verification failed: ${message}`);
        console.error('verifyUserEmail error', err);
      }
    } else {
      setError('Invalid OTP code. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="glass auth-card">
        {step === 1 ? (
          <>
            <h2 className="auth-title">Welcome Back</h2>
            {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
            <form onSubmit={handleCredentialsSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                <LogIn size={20} /> Login
              </button>
            </form>
            <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              Don't have an account? <Link to="/register" style={{ color: 'var(--primary)' }}>Register</Link>
            </p>
            <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <p><strong>Demo Accounts:</strong></p>
              <p>Admin: admin@system.com / admin123</p>
              <p>(Or register newly as Student/Company)</p>
            </div>
        
          </>
        ) : (
          <>
            <h2 className="auth-title">Verify Email</h2>
            <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
              We've sent a 6-digit verification code to <strong>{email}</strong>.
            </p>
            {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
            <form onSubmit={handleOtpSubmit}>
              <div className="form-group">
                <label className="form-label">6-Digit Code</label>
                <input 
                  type="text" 
                  maxLength={6}
                  className="form-input" 
                  style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 'bold' }}
                  value={userOtp}
                  onChange={(e) => setUserOtp(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                <KeyRound size={20} /> Verify & Login
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={() => { setStep(1); setError(''); setUserOtp(''); }}
              >
                Back to Login
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
