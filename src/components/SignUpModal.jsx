import { useState } from 'react';
import { Mail, Eye, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function SignUpModal({ onClose, onLoginClick }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    user_Fname: '',
    user_Lname: '',
    user_email: '',
    user_mobno: '',
    user_address: '',
    user_dob: '',
    user_age: '',
    password: '',
    acc_admin: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const diff_ms = Date.now() - new Date(dob).getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  const handleDobChange = (e) => {
    const dob = e.target.value;
    const age = calculateAge(dob);
    setFormData(prev => ({
      ...prev,
      user_dob: dob,
      user_age: age
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate mobile number starts with +91 and has 10 digits
    const mobRegex = /^\+91\d{10}$/;
    if (!mobRegex.test(formData.user_mobno)) {
      setError("Mobile number must be in the format +91XXXXXXXXXX");
      setLoading(false);
      return;
    }

    try {
      // 1. Sign up user with Supabase Auth (we'll just use their email/password)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.user_email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. Insert into custom "user_details" table
      const { password, ...dbData } = formData;
      const { error: dbError } = await supabase
        .from('user_details')
        .insert([{
          // If auth successful, link to auth.users if needed, else just insert raw data
          ...dbData
        }]);

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.message || "An error occurred during sign up.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" onClick={e => e.stopPropagation()}>
          <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Account Created!</h2>
          <div className="success-message" style={{ textAlign: 'center' }}>
            Welcome {formData.user_Fname}. You are now logged in!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose} id="signup-modal">
      <div className="modal-card wide" onClick={e => e.stopPropagation()}>
        <div className="modal-logo-wrapper" style={{ marginBottom: '24px' }}>
          <div className="modal-logo" style={{ border: 'none', padding: 0, background: 'none' }}>
            <img src="/logo.png" alt="Kusum Saree Dukaan" style={{ height: '120px', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
          </div>
        </div>

        <h2>Create account</h2>
        <p className="modal-subtitle">Join us today</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="user_Fname">First Name</label>
              <input type="text" id="user_Fname" name="user_Fname" value={formData.user_Fname} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="user_Lname">Last Name</label>
              <input type="text" id="user_Lname" name="user_Lname" value={formData.user_Lname} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="user_dob">Date of Birth</label>
              <input type="date" id="user_dob" name="user_dob" value={formData.user_dob} onChange={handleDobChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="user_age">Age</label>
              <input type="number" id="user_age" name="user_age" value={formData.user_age} readOnly style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="user_mobno">Mobile Number</label>
            <input type="text" id="user_mobno" name="user_mobno" placeholder="+91XXXXXXXXXX" value={formData.user_mobno} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="user_address">Detailed Address</label>
            <textarea id="user_address" name="user_address" rows="3" placeholder="House No, Street, City, ZIP..." value={formData.user_address} onChange={handleChange} required></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="user_email">Email</label>
            <div className="input-wrapper">
              <input type="email" id="user_email" name="user_email" placeholder="you@example.com" value={formData.user_email} onChange={handleChange} required />
              <Mail className="input-icon" style={{ pointerEvents: 'none' }} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <Eye
                className="input-icon"
                onClick={() => setShowPassword(!showPassword)}
                style={{ opacity: showPassword ? 1 : 0.5 }}
              />
            </div>
          </div>

          <div className="toggle-group">
            <div className="toggle-label-text">
              Admin Account
              <span>Enable if you are creating an admin profile</span>
            </div>
            <div
              className={`toggle-switch ${formData.acc_admin ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, acc_admin: !prev.acc_admin }))}
            >
              <div className="toggle-knob"></div>
            </div>
          </div>

          <button type="submit" className="btn-submit" id="signup-submit-btn" disabled={loading}>
            <UserPlus /> {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <div className="modal-footer">
          Already have an account?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); onLoginClick(); }}>
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
