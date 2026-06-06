import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, Phone, ShoppingCart, Check, AlertCircle, X, Trash2, Package, Heart } from 'lucide-react';

export default function Profile({ session, userProfile, setUserProfile, userCart, setUserCart, userWishlist, onWishlistUpdate }) {
  const [formData, setFormData] = useState({
    user_Fname: '',
    user_Lname: '',
    user_mobno: '',
    user_address: '',
    user_dob: '',
    user_age: '',
    user_email: ''
  });
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [cartItems, setCartItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(false);
  
  const [orderItems, setOrderItems] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [userOrders, setUserOrders] = useState(null);

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // Initialize form with fresh data from DB on mount
  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.email) return;
      
      const { data } = await supabase
        .from('user_details')
        .select('*')
        .eq('user_email', session.user.email)
        .single();
        
      if (data) {
        setUserProfile(data); // Sync up the parent state
      }

      const loadedData = {
        user_Fname: data?.user_Fname || '',
        user_Lname: data?.user_Lname || '',
        user_mobno: data?.user_mobno || '',
        user_address: data?.user_address || '',
        user_dob: data?.user_dob || '',
        user_age: data?.user_age || '',
        user_email: session.user.email
      };
      
      setFormData(loadedData);
      setInitialData(loadedData);
    }
    
    loadProfile();
  }, [session]);

  // Fetch cart products whenever userCart updates
  useEffect(() => {
    async function fetchCartProducts() {
      if (!userCart) {
        setCartItems([]);
        return;
      }
      
      // Get all non-null cart item IDs from cart_item1 to cart_item5
      const cartKeys = Array.from({ length: 5 }, (_, i) => `cart_item${i + 1}`);
      const productIds = cartKeys
        .map(key => userCart[key])
        .filter(id => id !== null && id !== undefined);

      if (productIds.length === 0) {
        setCartItems([]);
        return;
      }

      setLoadingCart(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('product_id', productIds);

        if (error) throw error;
        setCartItems(data || []);
      } catch (err) {
        console.error('Error fetching cart products:', err.message);
      } finally {
        setLoadingCart(false);
      }
    }

    fetchCartProducts();
  }, [userCart]);

  // Fetch user orders and their products
  useEffect(() => {
    async function fetchUserOrders() {
      if (!userProfile?.id) return;

      setLoadingOrders(true);
      try {
        // Fetch user's order record from user_orders table
        const { data: orderData } = await supabase
          .from('user_orders')
          .select('*')
          .eq('id', userProfile.id)
          .single();

        if (!orderData) {
          setOrderItems([]);
          setUserOrders(null);
          return;
        }

        setUserOrders(orderData);

        // Get all non-null order item IDs from order_item1 to order_item5
        const orderKeys = Array.from({ length: 5 }, (_, i) => `order_item${i + 1}`);
        const productIds = orderKeys
          .map(key => orderData[key])
          .filter(id => id !== null && id !== undefined);

        if (productIds.length === 0) {
          setOrderItems([]);
          return;
        }

        // Fetch product details for all ordered items
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .in('product_id', productIds);

        if (error) throw error;
        setOrderItems(products || []);
      } catch (err) {
        console.error('Error fetching orders:', err.message);
      } finally {
        setLoadingOrders(false);
      }
    }

    fetchUserOrders();
  }, [userProfile?.id]);

  // Fetch wishlist products whenever userWishlist updates
  useEffect(() => {
    async function fetchWishlistProducts() {
      if (!userWishlist) {
        setWishlistItems([]);
        return;
      }
      
      // Get all non-null wishlist item IDs from wishlist_item1 to wishlist_item15
      const wishlistKeys = Array.from({ length: 15 }, (_, i) => `wishlist_item${i + 1}`);
      const productIds = wishlistKeys
        .map(key => userWishlist[key])
        .filter(id => id !== null && id !== undefined);

      if (productIds.length === 0) {
        setWishlistItems([]);
        return;
      }

      setLoadingWishlist(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('product_id', productIds);

        if (error) throw error;
        setWishlistItems(data || []);
      } catch (err) {
        console.error('Error fetching wishlist products:', err.message);
      } finally {
        setLoadingWishlist(false);
      }
    }

    fetchWishlistProducts();
  }, [userWishlist]);

  const removeFromCart = async (productId) => {
    if (!userCart || !session) return;

    // Find the slot containing this productId in user_carts
    const cartKeys = Array.from({ length: 5 }, (_, i) => `cart_item${i + 1}`);
    const slotKey = cartKeys.find(key => userCart[key] === productId);

    if (!slotKey) return;

    try {
      const { error } = await supabase
        .from('user_carts')
        .update({ [slotKey]: null })
        .eq('user_email', session.user.email);

      if (error) throw error;

      // Update local cart state
      const updatedCart = { ...userCart, [slotKey]: null };
      setUserCart(updatedCart);
    } catch (err) {
      alert('Error removing from cart: ' + err.message);
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!userWishlist || !session) return;

    // Find the slot containing this productId in user_wishlist
    const wishlistKeys = Array.from({ length: 15 }, (_, i) => `wishlist_item${i + 1}`);
    const slotKey = wishlistKeys.find(key => userWishlist[key] === productId);

    if (!slotKey) return;

    try {
      const { error } = await supabase
        .from('user_wishlist')
        .update({ [slotKey]: null })
        .eq('user_email', session.user.email);

      if (error) throw error;

      if (onWishlistUpdate) await onWishlistUpdate();
    } catch (err) {
      alert('Error removing from wishlist: ' + err.message);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const diff_ms = Date.now() - new Date(dob).getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'user_dob') {
      const age = calculateAge(value);
      setFormData(prev => ({ ...prev, user_dob: value, user_age: age }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { user_email, ...updateData } = formData;
      delete updateData.password;
      
      const { error } = await supabase
        .from('user_details')
        .upsert({ ...updateData, user_email: session.user.email }, { onConflict: 'user_email' });

      if (error) throw error;

      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setUserProfile((prev) => ({ ...prev, ...updateData }));
      setInitialData(formData);
    } catch (error) {
      setMessage({ text: error.message || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const hasChanges = initialData && JSON.stringify(formData) !== JSON.stringify(initialData);

  if (!session) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center', color: '#fff' }}>
        <h2>Please log in to view your profile.</h2>
      </div>
    );
  }

  return (
    <div className="profile-container" style={{ padding: '40px 20px', maxWidth: '1400px', margin: '0 auto', color: '#fff' }}>
      
      <div className="profile-layout" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* Left column: Profile Details Form - Slimmer */}
        <div className="profile-form-section" style={{ flex: '0 0 380px', background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <User style={{ color: '#fff' }} /> Edit Profile
          </h2>

          {message.text && (
            <div style={{
              padding: '12px', marginBottom: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: message.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
              color: message.type === 'success' ? '#4ade80' : '#f87171',
              border: `1px solid ${message.type === 'success' ? '#4ade80' : '#f87171'}`
            }}>
              {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="text" 
                value={formData.user_email} 
                disabled 
                style={{ background: 'rgba(255,255,255,0.02)', opacity: 0.6 }} 
              />
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>First Name</label>
                <input type="text" name="user_Fname" value={formData.user_Fname} onChange={handleChange} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Last Name</label>
                <input type="text" name="user_Lname" value={formData.user_Lname} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Date of Birth</label>
                <input type="date" name="user_dob" value={formData.user_dob} onChange={handleChange} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Age</label>
                <input type="number" name="user_age" value={formData.user_age} readOnly style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
            </div>

            <div className="form-group">
              <label>Mobile Number</label>
              <input 
                type="text" 
                name="user_mobno" 
                value={formData.user_mobno} 
                onChange={handleChange}
                disabled={!!initialData?.user_mobno} 
                placeholder="+91XXXXXXXXXX"
                required
              />
            </div>

            <div className="form-group">
              <label>Detailed Address</label>
              <textarea name="user_address" rows="3" value={formData.user_address} onChange={handleChange} required style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }}></textarea>
            </div>

            {hasChanges && (
              <button type="submit" className="btn-submit" disabled={loading} style={{ marginTop: '10px' }}>
                {loading ? 'Saving Changes...' : 'Save Changes'}
              </button>
            )}
          </form>
        </div>

        {/* Right column: Cart, Orders, Wishlist Grid */}
        <div className="profile-sections-grid" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          {/* Cart Section */}
          <div className="profile-cart-section" style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', fontSize: '16px', fontWeight: 600 }}>
              <ShoppingCart size={20} style={{ color: '#fff' }} /> My Cart
            </h3>
            
            {loadingCart ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '20px', fontSize: '14px' }}>Loading...</p>
            ) : cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 15px', color: 'rgba(255,255,255,0.5)' }}>
                <ShoppingCart size={36} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
                <p style={{ fontSize: '13px' }}>Empty</p>
              </div>
            ) : (
              <div className="cart-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {cartItems.slice(0, 3).map((item) => (
                  <div key={item.product_id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                      {item.product_media1 && <img src={item.product_media1} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</div>
                      <div style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 600 }}>₹{item.product_saleprice}</div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.product_id)}
                      style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                      onMouseOver={e => e.currentTarget.style.color = '#f87171'}
                      onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {cartItems.length > 3 && (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '8px' }}>
                    +{cartItems.length - 3} more items
                  </div>
                )}
                <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Total: {cartItems.length} items</span>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>₹{cartItems.reduce((acc, item) => acc + (parseFloat(item.product_saleprice) || 0), 0).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Orders Section */}
          <div className="profile-orders-section" style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', fontSize: '16px', fontWeight: 600 }}>
              <Package size={20} style={{ color: '#fff' }} /> My Orders
            </h3>
            
            {loadingOrders ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '20px', fontSize: '14px' }}>Loading...</p>
            ) : orderItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 15px', color: 'rgba(255,255,255,0.5)' }}>
                <Package size={36} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
                <p style={{ fontSize: '13px' }}>No Orders</p>
              </div>
            ) : (
              <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {orderItems.slice(0, 3).map((item) => (
                  <div key={item.product_id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                      {item.product_media1 && <img src={item.product_media1} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</div>
                      <div style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 600 }}>₹{item.product_saleprice}</div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)', padding: '3px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      <Check size={12} /> Ordered
                    </div>
                  </div>
                ))}
                {orderItems.length > 3 && (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '8px' }}>
                    +{orderItems.length - 3} more orders
                  </div>
                )}
                <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Total: {orderItems.length} orders</span>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>₹{orderItems.reduce((acc, item) => acc + (parseFloat(item.product_saleprice) || 0), 0).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Wishlist Section */}
          <div className="profile-wishlist-section" style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', fontSize: '16px', fontWeight: 600 }}>
              <Heart size={20} style={{ color: '#ff3b30' }} /> My Wishlist
            </h3>
            
            {loadingWishlist ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '20px', fontSize: '14px' }}>Loading...</p>
            ) : wishlistItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 15px', color: 'rgba(255,255,255,0.5)' }}>
                <Heart size={36} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
                <p style={{ fontSize: '13px' }}>Empty</p>
              </div>
            ) : (
              <div className="wishlist-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {wishlistItems.slice(0, 3).map((item) => (
                  <div key={item.product_id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                      {item.product_media1 && <img src={item.product_media1} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</div>
                      <div style={{ fontSize: '11px', color: '#ff3b30', fontWeight: 600 }}>₹{item.product_saleprice}</div>
                    </div>
                    <button 
                      onClick={() => removeFromWishlist(item.product_id)}
                      style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                      onMouseOver={e => e.currentTarget.style.color = '#f87171'}
                      onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {wishlistItems.length > 3 && (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '8px' }}>
                    +{wishlistItems.length - 3} more items
                  </div>
                )}
                <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Total: {wishlistItems.length} items</span>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>₹{wishlistItems.reduce((acc, item) => acc + (parseFloat(item.product_saleprice) || 0), 0).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
