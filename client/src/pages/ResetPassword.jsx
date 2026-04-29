import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../components/Toast';
import './ResetPassword.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const EyeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', {
        token,
        password,
      });

      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="reset-page page-wrapper">
        <div className="reset-card">
          <div className="reset-icon">⚠️</div>
          <h1 className="reset-title">Invalid Link</h1>
          <p className="reset-subtitle">
            This password reset link is invalid or has expired.
          </p>
          <button className="reset-btn" onClick={() => navigate('/login')}>
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-page page-wrapper">
        <div className="reset-card">
          <div className="reset-icon reset-success-icon">✓</div>
          <h1 className="reset-title">Password Reset!</h1>
          <p className="reset-subtitle">
            Your password has been updated successfully. You can now sign in with your new password.
          </p>
          <button className="reset-btn" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-page page-wrapper">
      <div className="reset-card" id="reset-password-card">
        <div className="reset-icon">🔐</div>
        <h1 className="reset-title">Create New Password</h1>
        <p className="reset-subtitle">
          Enter your new password below. Make it strong and memorable.
        </p>

        <form onSubmit={handleSubmit} className="reset-form" id="reset-form">
          <div className="input-group password-group">
            <input
              type={showPassword ? 'text' : 'password'}
              id="input-new-password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <label htmlFor="input-new-password">New Password</label>
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <div className="input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              id="input-confirm-password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            <label htmlFor="input-confirm-password">Confirm Password</label>
          </div>

          <div className="password-strength">
            <div className={`strength-bar ${password.length >= 6 ? 'good' : ''} ${password.length >= 10 ? 'strong' : ''}`} />
            <span className="strength-text">
              {password.length === 0 ? '' : password.length < 6 ? 'Too short' : password.length < 10 ? 'Good' : 'Strong'}
            </span>
          </div>

          <button type="submit" className="reset-btn" disabled={loading}>
            {loading ? '...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
