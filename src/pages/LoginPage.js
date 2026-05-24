import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ceat_logo from '../images/ceat-logo.png';
import '../css/LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isStudent } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error === 'unauthorized') {
      setStatus('unauthorized');
      setSearchParams({}, { replace: true });
      return;
    }

    if (token) {
      fetchUserData(token);
      setSearchParams({}, { replace: true });
      return;
    }

    if (isAuthenticated) {
      navigate(isStudent ? '/submitted-documents' : '/my-assignments');
    }
  }, [isAuthenticated]);

  const fetchUserData = async (token) => {
    setStatus('loading');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        login(token, data.user);
        navigate(data.user.role === 'student' ? '/submitted-documents' : '/my-assignments');
      } else {
        setErrorMessage(data.message || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch (error) {
      setErrorMessage('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
  };

  return (
    <div className="login-root">

      {/* Left — building photo */}
      <div className="login-visual">
        {/* <div className="login-visual__overlay" /> */}
      </div>

      {/* Right — login panel */}
      <div className="login-panel">
        <div className="login-panel__inner">

          <img src={ceat_logo} alt="CEAT Logo" className="login-logo" />

          <p className="login-office">CEAT OCS</p>
          <h1 className="login-heading">Document Tracking System</h1>

          {/* Status messages */}
          {status === 'unauthorized' && (
            <div className="login-alert login-alert--warn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <strong>Access Restricted</strong>
                <p>Your email is not registered in the system. Please contact the CEAT OCS office to request access.</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="login-alert login-alert--error">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <div>
                <strong>Login Failed</strong>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {status === 'loading' ? (
            <div className="login-loading">
              <div className="login-spinner" />
              <span>Signing you in...</span>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="login-btn"
              disabled={status === 'loading'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="login-btn__icon">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Login with UP Mail
            </button>
          )}

          <div className="login-concerns mt-4">
            <span>
              For concerns and inquiries, contact ceat_ocs.uplb@up.edu.ph
            </span>
          </div>

          <div className="login-credits">
            <small>
              Developed for CEAT OCS <br />
              © 2026 UPLB College of Engineering and Agro-Industrial Technology
            </small>
          </div>

        </div>
      </div>
    </div>
  );
}