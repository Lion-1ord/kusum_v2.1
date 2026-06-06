import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductList from './components/ProductList';
import SearchResults from './components/SearchResults';
import LoginModal from './components/LoginModal';
import SignUpModal from './components/SignUpModal';
import Profile from './components/Profile';
import AdminPanel from './components/AdminPanel';

function App() {
  const [activeModal, setActiveModal] = useState(null); // 'login', 'signup', or null
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userCart, setUserCart] = useState(null);
  const [userWishlist, setUserWishlist] = useState(null);
  const [activePage, setActivePage] = useState('home'); // 'home', 'profile', 'admin', 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('hydrangea'); // 'hydrangea' or 'cotton'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchProfileAndCart() {
      if (session?.user?.email) {
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('user_details')
          .select('*')
          .eq('user_email', session.user.email)
          .single();
        if (profileData) setUserProfile(profileData);

        // Fetch user cart
        const { data: cartData } = await supabase
          .from('user_carts')
          .select('*')
          .eq('user_email', session.user.email)
          .single();
        setUserCart(cartData || null);

        // Fetch user wishlist
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
        setActivePage('home');
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

  return (
    <>
      {activePage === 'home' ? (
        <div className={activeCategory}>
          <Navbar 
            onLoginClick={() => setActiveModal('login')}
            onSignUpClick={() => setActiveModal('signup')}
            session={session}
            userProfile={userProfile}
            setActivePage={setActivePage}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          <Hero activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
          <ProductList
            session={session}
            userProfile={userProfile}
            userCart={userCart}
            userWishlist={userWishlist}
            onCartUpdate={refreshCart}
            onWishlistUpdate={refreshWishlist}
            activeCategory={activeCategory}
          />
        </div>
      ) : (
        <>
          <Navbar 
            onLoginClick={() => setActiveModal('login')}
            onSignUpClick={() => setActiveModal('signup')}
            session={session}
            userProfile={userProfile}
            setActivePage={setActivePage}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {activePage === 'search' && (
            <SearchResults
              session={session}
              userProfile={userProfile}
              userCart={userCart}
              userWishlist={userWishlist}
              onCartUpdate={refreshCart}
              onWishlistUpdate={refreshWishlist}
              searchQuery={searchQuery}
            />
          )}

          {activePage === 'profile' && (
            <Profile
              session={session}
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              userCart={userCart}
              setUserCart={setUserCart}
              userWishlist={userWishlist}
              onWishlistUpdate={refreshWishlist}
            />
          )}

          {activePage === 'admin' && (
            <AdminPanel />
          )}
        </>
      )}

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
    </>
  );
}

export default App;
