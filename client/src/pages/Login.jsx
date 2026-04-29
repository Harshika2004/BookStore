import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import './Login.css';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post('http://localhost:5000/api/auth/login', {
          identifier,
          password,
        });

        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        toast.success(`Welcome back, ${res.data.user.name}!`);
        setTimeout(() => navigate('/'), 500);
      } else {
        if (phone && !/^\d{10,15}$/.test(phone)) {
          toast.error('Phone number must be 10-15 digits');
          setLoading(false);
          return;
        }

        await axios.post('http://localhost:5000/api/auth/register', {
          name,
          email,
          phone: phone || undefined,
          password,
        });

        toast.success('Account created! Please sign in.');
        setIsLogin(true);
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.warning('Please enter your email address');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: forgotEmail,
      });
      setForgotSent(true);
      toast.success('Reset link sent! Check your email.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setForgotLoading(false);
    }
  };

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

  // Forgot Password View
  if (showForgot) {
    return (
      <div className="login-page page-wrapper">
        <div className="login-card" id="forgot-password-card">
          <div className="login-icon">🔑</div>
          <h1 className="login-title">
            {forgotSent ? 'Check Your Email' : 'Forgot Password?'}
          </h1>
          <p className="login-subtitle">
            {forgotSent
              ? 'We\'ve sent a password reset link to your email address.'
              : 'Enter your email and we\'ll send you a reset link.'}
          </p>

          {!forgotSent ? (
            <form onSubmit={handleForgotPassword} className="login-form" id="forgot-form">
              <div className="input-group">
                <input
                  type="email"
                  id="input-forgot-email"
                  placeholder="Email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                <label htmlFor="input-forgot-email">Email Address</label>
              </div>

              <button type="submit" className="login-btn" disabled={forgotLoading}>
                {forgotLoading ? '...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="forgot-sent-icon">✉️</div>
          )}

          <button
            className="forgot-back-btn"
            onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); }}
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page page-wrapper">
      <div className="login-card" id="login-card">
        <div className="login-icon">📖</div>
        <h1 className="login-title">
          {isLogin ? 'Welcome Back, Reader.' : 'Join The Book Cafe'}
        </h1>
        <p className="login-subtitle">
          {isLogin
            ? 'Sign in to continue your literary journey'
            : 'Create an account to start your collection'}
        </p>

        <div className="login-tabs">
          <button
            className={`login-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button
            className={`login-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form" id="login-form">
          {!isLogin && (
            <>
              <div className="input-group">
                <input
                  type="text"
                  id="input-name"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <label htmlFor="input-name">Full Name</label>
              </div>

              <div className="input-group">
                <input
                  type="email"
                  id="input-email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label htmlFor="input-email">Email Address</label>
              </div>

              <div className="input-group">
                <input
                  type="tel"
                  id="input-phone"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  maxLength={15}
                />
                <label htmlFor="input-phone">Phone Number (optional)</label>
              </div>
            </>
          )}

          {isLogin && (
            <div className="input-group">
              <input
                type="text"
                id="input-identifier"
                placeholder="Email or Phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
              <label htmlFor="input-identifier">Email or Phone</label>
            </div>
          )}

          <div className="input-group password-group">
            <input
              type={showPassword ? 'text' : 'password'}
              id="input-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label htmlFor="input-password">Password</label>
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

          {isLogin && (
            <button
              type="button"
              className="forgot-password-link"
              onClick={() => setShowForgot(true)}
            >
              Forgot Password?
            </button>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;