import { useState } from 'react';
import { Mail, Eye, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function LoginModal({ onClose, onSignUpClick }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="login-modal">
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-logo-wrapper" style={{ marginBottom: '24px' }}>
          <div className="modal-logo" id="login-logo-placeholder" style={{ border: 'none', padding: 0, background: 'none' }}>
            <img src="/logo.png" alt="Kusum Saree Dukaan" style={{ height: '120px', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
          </div>
        </div>
        
        <h2>Welcome back</h2>
        <p className="modal-subtitle">Sign in to your account</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <div className="input-wrapper">
              <input 
                type="email" 
                id="login-email" 
                placeholder="you@example.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required 
              />
              <Mail className="input-icon" style={{ pointerEvents: 'none' }} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div className="input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                id="login-password" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
              <Eye 
                className="input-icon" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ opacity: showPassword ? 1 : 0.5 }}
              />
            </div>
          </div>

          <button type="submit" className="btn-submit" id="login-submit-btn" disabled={loading}>
            <LogIn /> {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="modal-footer">
          Don't have an account?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); onSignUpClick(); }}>
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
