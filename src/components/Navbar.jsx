import { useState, useRef, useEffect } from 'react';
import { Search, User, Bell, Settings, X, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Navbar({ onLoginClick, onSignUpClick, session, userProfile, onGoHome, searchQuery, setSearchQuery }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const goHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      navigate('/');
      setSearchQuery('');
    }
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (value.trim()) {
      navigate('/search');
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  

  return (
    <nav className="navbar" id="main-navbar">
      <div 
        className="navbar-logo" 
        id="navbar-logo" 
        onClick={goHome}
        style={{ cursor: 'pointer', border: 'none', padding: '4px 0', background: 'none' }}
      >
        <img src="/logo.png" alt="Kusum Saree Dukaan" style={{ height: '84px', objectFit: 'contain', display: 'block' }} />
      </div>

      <div className="navbar-search">
        {searchOpen ? (
          <>
            <Search className="search-icon" />
            <input
              id="search-input"
              type="text"
              placeholder="Search products..."
              autoFocus
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </>
        ) : (
          <input
            id="search-input-collapsed"
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setSearchOpen(true)}
          />
        )}
      </div>

      <div className="navbar-actions">
        {searchOpen && (
          <button
            id="search-close-btn"
            className="navbar-action-btn"
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery('');
              goHome();
            }}
            aria-label="Close search"
          >
            <X />
          </button>
        )}

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            id="more-menu-btn"
            className="navbar-action-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="More options"
          >
            <MoreVertical />
          </button>
          {menuOpen && (
            <div className="menu-dropdown" id="menu-dropdown">
              {/* Account Options */}
              <div className="menu-group">
                <div className="menu-group-label">ACCOUNT</div>
                {session ? (
                  <>
                    <button
                      className="menu-item"
                      onClick={() => {
                        navigate('/profile');
                        setMenuOpen(false);
                      }}
                    >
                      <User size={16} /> Profile
                    </button>
                    {userProfile?.acc_admin && (
                      <button
                        className="menu-item"
                        onClick={() => {
                          navigate('/admin');
                          setMenuOpen(false);
                        }}
                      >
                        <Settings size={16} /> Admin Panel
                      </button>
                    )}
                    <button
                      className="menu-item"
                      id="logout-link"
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setMenuOpen(false);
                      }}
                    >
                      <X size={16} /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="menu-item"
                      id="login-link"
                      onClick={() => {
                        onLoginClick();
                        setMenuOpen(false);
                      }}
                    >
                      <User size={16} /> Login
                    </button>
                    <button
                      className="menu-item"
                      id="signup-link"
                      onClick={() => {
                        onSignUpClick();
                        setMenuOpen(false);
                      }}
                    >
                      <User size={16} /> Sign Up
                    </button>
                  </>
                )}
              </div>

              {/* Updates/Notifications */}
              <div className="menu-group">
                <div className="menu-group-label">UPDATES</div>
                <button
                  className="menu-item"
                  id="notifications-menu-btn"
                  onClick={() => {
                    alert('No new notifications');
                    setMenuOpen(false);
                  }}
                >
                  <Bell size={16} /> Notifications
                </button>
              </div>

              {/* Settings group removed per request */}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
