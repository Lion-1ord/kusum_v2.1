import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductList from './components/ProductList';
import SearchResults from './components/SearchResults';
import LoginModal from './components/LoginModal';
import SignUpModal from './components/SignUpModal';
import Profile from './components/Profile';
import ProductDetail from './components/ProductDetail';
import AdminPanel from './components/AdminPanel';

function App() {
  const [activeModal, setActiveModal] = useState(null); // 'login', 'signup', or null
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userCart, setUserCart] = useState(null);
  const [userWishlist, setUserWishlist] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('hydrangea');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    setRedBackground();

    return () => subscription.unsubscribe();
  }, []);

  const [bgOverride, setBgOverride] = useState(null);
  const [appMode, setAppMode] = useState('premium');
  const originalStylesRef = useRef(null);

  const hexToRgba = (hex, alpha) => {
    const h = (hex || '#000000').replace('#', '');
    if (h.length !== 6) return `rgba(255, 255, 255, ${alpha})`;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const applyPalette = (palette, mode) => {
    if (!palette) return;

    if (!originalStylesRef.current) {
      const body = document.body;
      const navbar = document.querySelector('.navbar');
      const heroEl = document.querySelector('.hero');
      originalStylesRef.current = {
        bodyBg: body ? getComputedStyle(body).backgroundColor : null,
        navbarBg: navbar ? getComputedStyle(navbar).backgroundColor : null,
        heroBg: heroEl ? getComputedStyle(heroEl).backgroundColor : null,
      };
    }

    const primaryColor = palette.primary || '#000000';
    const secondaryColor = palette.secondary || '#cccccc';
    const tertiaryColor = palette.tertiary || '#ffffff';

    document.documentElement.style.setProperty('--bg-primary', primaryColor);
    document.documentElement.style.setProperty('--bg-secondary', primaryColor);
    document.documentElement.style.setProperty('--bg-card', primaryColor);
    document.documentElement.style.setProperty('--bg-elevated', primaryColor);

    document.documentElement.style.setProperty('--text-primary', secondaryColor);
    document.documentElement.style.setProperty('--text-secondary', secondaryColor);
    document.documentElement.style.setProperty('--text-muted', hexToRgba(secondaryColor, 0.55));

    document.documentElement.style.setProperty('--accent', tertiaryColor);
    document.documentElement.style.setProperty('--icon-color', tertiaryColor);
    document.documentElement.style.setProperty('--border-color', tertiaryColor);
    document.documentElement.style.setProperty('--border-subtle', hexToRgba(tertiaryColor, 0.15));
    document.documentElement.style.setProperty('--border-medium', hexToRgba(tertiaryColor, 0.3));

    const body = document.body;
    const navbar = document.querySelector('.navbar');
    const heroEl = document.querySelector('.hero');

    if (body) body.style.backgroundColor = primaryColor;
    if (navbar) navbar.style.backgroundColor = primaryColor;
    if (heroEl) heroEl.style.backgroundColor = primaryColor;

    if (mode === 'red') {
      document.documentElement.classList.remove('mode-green');
      document.documentElement.classList.add('mode-red');
    } else {
      document.documentElement.classList.remove('mode-red');
      document.documentElement.classList.add('mode-green');
    }

    setBgOverride(primaryColor);
  };

  const setGreenBackground = async () => {
    setAppMode('budget');
    try {
      const { data: budData } = await supabase
        .from('bud_color_pal')
        .select('*')
        .eq('activation', true)
        .order('color_serial', { ascending: false })
        .limit(1);
      
      const palette = (budData && budData.length > 0) ? budData[0] : null;
      if (palette) {
        applyPalette(palette, 'green');
      } else {
        applyPalette({ primary: '#121212', secondary: '#999999', tertiary: '#ffffff' }, 'green');
      }
    } catch (err) {
      console.error(err);
      applyPalette({ primary: '#121212', secondary: '#999999', tertiary: '#ffffff' }, 'green');
    }
  };

  const setRedBackground = async () => {
    setAppMode('premium');
    try {
      const { data: preData } = await supabase
        .from('pre_color_pal')
        .select('*')
        .eq('activation', true)
        .order('color_serial', { ascending: false })
        .limit(1);
      
      const palette = (preData && preData.length > 0) ? preData[0] : null;
      if (palette) {
        applyPalette(palette, 'red');
      } else {
        applyPalette({ primary: '#1a1a1a', secondary: '#cccccc', tertiary: '#ffffff' }, 'red');
      }
    } catch (err) {
      console.error(err);
      applyPalette({ primary: '#1a1a1a', secondary: '#cccccc', tertiary: '#ffffff' }, 'red');
    }
  };

  const restoreOriginalBackground = () => {
    const orig = originalStylesRef.current || {};

    document.documentElement.style.removeProperty('--bg-primary');
    document.documentElement.style.removeProperty('--bg-secondary');
    document.documentElement.style.removeProperty('--bg-card');
    document.documentElement.style.removeProperty('--bg-elevated');
    document.documentElement.style.removeProperty('--text-primary');
    document.documentElement.style.removeProperty('--text-secondary');
    document.documentElement.style.removeProperty('--text-muted');
    document.documentElement.style.removeProperty('--accent');
    document.documentElement.style.removeProperty('--icon-color');
    document.documentElement.style.removeProperty('--border-color');
    document.documentElement.style.removeProperty('--border-subtle');
    document.documentElement.style.removeProperty('--border-medium');

    const body = document.body;
    const navbar = document.querySelector('.navbar');
    const heroEl = document.querySelector('.hero');

    if (body) body.style.backgroundColor = orig.bodyBg || '';
    if (navbar) navbar.style.backgroundColor = orig.navbarBg || '';
    if (heroEl) heroEl.style.backgroundColor = orig.heroBg || '';

    originalStylesRef.current = null;
    document.documentElement.classList.remove('mode-red');
    document.documentElement.classList.remove('mode-green');
    setBgOverride(null);
  };

  useEffect(() => {
    async function fetchProfileAndCart() {
      if (session?.user?.email) {
        const { data: profileData } = await supabase
          .from('user_details')
          .select('*')
          .eq('user_email', session.user.email)
          .single();
        if (profileData) setUserProfile(profileData);

        const { data: cartData } = await supabase
          .from('user_carts')
          .select('*')
          .eq('user_email', session.user.email)
          .single();
        setUserCart(cartData || null);

        const { data: wishlistData } = await supabase
          .from('user_wishlist')
          .select('*')
          .eq('user_email', session.user.email)
          .single();
        setUserWishlist(wishlistData || null);
      } else {
        setUserProfile(null);
        setUserCart(null);
        setUserWishlist(null);
        if (location.pathname === '/profile' || location.pathname === '/admin') {
          navigate('/');
        }
      }
    }
    fetchProfileAndCart();
  }, [session]);

  const refreshCart = async () => {
    if (session?.user?.email) {
      const { data } = await supabase
        .from('user_carts')
        .select('*')
        .eq('user_email', session.user.email)
        .single();
      setUserCart(data || null);
    }
  };

  const refreshWishlist = async () => {
    if (session?.user?.email) {
      const { data } = await supabase
        .from('user_wishlist')
        .select('*')
        .eq('user_email', session.user.email)
        .single();
      setUserWishlist(data || null);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleGoHome = () => {
    navigate('/');
    setSearchQuery('');
  };

  return (
    <div className={location.pathname === '/' ? activeCategory : ''} style={bgOverride ? { backgroundColor: bgOverride, minHeight: '100vh' } : { minHeight: '100vh' }}>
      <Navbar 
        onLoginClick={() => setActiveModal('login')}
        onSignUpClick={() => setActiveModal('signup')}
        session={session}
        userProfile={userProfile}
        onGoHome={handleGoHome}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <Routes>
        <Route path="/" element={
          <>
            <Hero activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
            <div className="hero-triangle-wrapper">
              <div className="triangle-buttons">
                <button
                  className="theme-btn square-btn"
                  onClick={setRedBackground}
                >Premium</button>
                <button
                  className="theme-btn square-btn"
                  onClick={setGreenBackground}
                >Budget</button>
              </div>
            </div>
            <ProductList onProductClick={handleProductClick} appMode={appMode} />
          </>
        } />
        
        <Route path="/search" element={
          <SearchResults
            searchQuery={searchQuery}
            onProductClick={handleProductClick}
          />
        } />

        <Route path="/product/:id" element={
          <ProductDetail
            onBack={handleGoHome}
            appMode={appMode}
          />
        } />

        <Route path="/profile" element={
          <Profile
            session={session}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            userCart={userCart}
            setUserCart={setUserCart}
            userWishlist={userWishlist}
            onWishlistUpdate={refreshWishlist}
          />
        } />

        <Route path="/admin" element={
          <AdminPanel />
        } />
      </Routes>

      {activeModal === 'login' && (
        <LoginModal 
          onClose={() => setActiveModal(null)}
          onSignUpClick={() => setActiveModal('signup')}
        />
      )}

      {activeModal === 'signup' && (
        <SignUpModal 
          onClose={() => setActiveModal(null)}
          onLoginClick={() => setActiveModal('login')}
        />
      )}
    </div>
  );
}

export default App;
