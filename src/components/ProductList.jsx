import { useState, useEffect } from 'react';
import { PackageOpen, ShoppingCart, Tag, Check, Heart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import ProductDetail from './ProductDetail';

export default function ProductList({ session, userProfile, userCart, userWishlist, onCartUpdate, onWishlistUpdate, activeCategory = 'hydrangea' }) {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(null);
  const [wishlistingProduct, setWishlistingProduct] = useState(null);
  const [tagsMap, setTagsMap] = useState({});

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase.from('tags').select('*');
      if (error) throw error;
      
      const map = {};
      data?.forEach(tag => {
        map[tag.tag_id] = tag.tag_name;
      });
      setTagsMap(map);
    } catch (err) {
      console.error('Error fetching tags:', err.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
    fetchProducts();
  }, []);

  const handleAddToCart = async (productId) => {
    if (!session) {
      alert('Please log in to add items to your cart.');
      return;
    }

    if (!userProfile) {
      alert('User profile not found. Please try again.');
      return;
    }

    const cartKeys = Array.from({ length: 5 }, (_, i) => `cart_item${i + 1}`);

    // Check if already in cart
    if (userCart) {
      const alreadyInCart = cartKeys.some(key => userCart[key] === productId);
      if (alreadyInCart) {
        alert('This item is already in your cart.');
        return;
      }
    }

    // Find first empty slot (cart_item1–cart_item5)
    const emptySlotKey = userCart
      ? cartKeys.find(key => !userCart[key])
      : 'cart_item1';

    if (!emptySlotKey) {
      alert('Your cart is full (max 5 items).');
      return;
    }

    setAddingToCart(productId);
    try {
      if (!userCart) {
        // No cart row yet — create one, copying id/email/mobno from user_details
        const { error } = await supabase
          .from('user_carts')
          .insert([{
            id: userProfile.id,
            user_email: userProfile.user_email,
            user_mobno: userProfile.user_mobno,
            [emptySlotKey]: productId
          }]);
        if (error) throw error;
      } else {
        // Cart row exists — update the empty slot
        const { error } = await supabase
          .from('user_carts')
          .update({ [emptySlotKey]: productId })
          .eq('user_email', session.user.email);
        if (error) throw error;
      }

      if (onCartUpdate) await onCartUpdate();
    } catch (err) {
      alert('Error adding to cart: ' + err.message);
    } finally {
      setAddingToCart(null);
    }
  };

  const isProductInCart = (productId) => {
    if (!userCart) return false;
    const cartKeys = Array.from({ length: 5 }, (_, i) => `cart_item${i + 1}`);
    return cartKeys.some(key => userCart[key] === productId);
  };

  const isProductInWishlist = (productId) => {
    if (!userWishlist) return false;
    const wishlistKeys = Array.from({ length: 15 }, (_, i) => `wishlist_item${i + 1}`);
    return wishlistKeys.some(key => userWishlist[key] === productId);
  };

  const handleAddToWishlist = async (productId) => {
    if (!session) {
      alert('Please log in to add items to your wishlist.');
      return;
    }

    if (!userProfile) {
      alert('User profile not found. Please try again.');
      return;
    }

    const wishlistKeys = Array.from({ length: 15 }, (_, i) => `wishlist_item${i + 1}`);
    const isLiked = isProductInWishlist(productId);

    if (isLiked) {
      // Remove from wishlist
      const keyToRemove = wishlistKeys.find(key => userWishlist[key] === productId);
      if (!keyToRemove) return;

      setWishlistingProduct(productId);
      try {
        const { error } = await supabase
          .from('user_wishlist')
          .update({ [keyToRemove]: null })
          .eq('user_email', session.user.email);
        if (error) throw error;
        
        if (onWishlistUpdate) await onWishlistUpdate();
      } catch (err) {
        alert('Error removing from wishlist: ' + err.message);
      } finally {
        setWishlistingProduct(null);
      }
    } else {
      // Add to wishlist
      const alreadyInWishlist = wishlistKeys.some(key => userWishlist?.[key] === productId);
      if (alreadyInWishlist) {
        alert('This item is already in your wishlist.');
        return;
      }

      const emptySlotKey = userWishlist
        ? wishlistKeys.find(key => !userWishlist[key])
        : 'wishlist_item1';

      if (!emptySlotKey) {
        alert('Your wishlist is full (max 15 items).');
        return;
      }

      setWishlistingProduct(productId);
      try {
        if (!userWishlist) {
          // No wishlist row yet — create one
          const { error } = await supabase
            .from('user_wishlist')
            .insert([{
              id: userProfile.id,
              user_email: userProfile.user_email,
              user_mobno: userProfile.user_mobno,
              [emptySlotKey]: productId
            }]);
          if (error) throw error;
        } else {
          // Wishlist row exists — update the empty slot
          const { error } = await supabase
            .from('user_wishlist')
            .update({ [emptySlotKey]: productId })
            .eq('user_email', session.user.email);
          if (error) throw error;
        }

        if (onWishlistUpdate) await onWishlistUpdate();
      } catch (err) {
        alert('Error adding to wishlist: ' + err.message);
      } finally {
        setWishlistingProduct(null);
      }
    }
  };

  if (loading) {
    return (
      <section className="product-section">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading products...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="product-section" id="product-list-section">
      
      {products.length === 0 ? (
        <div className="product-empty">
          <div className="product-empty-icon">
            <PackageOpen />
          </div>
          <h3>No products live yet</h3>
          <p>Check back soon for new arrivals!</p>
        </div>
      ) : (
        <div className="product-grid">
          {products
            .filter(product => {
              // Hydrangea: product_rui === false
              // Cotton: product_rui === true
              if (activeCategory === 'hydrangea') {
                return product.product_rui !== true;
              } else if (activeCategory === 'cotton') {
                return product.product_rui === true;
              }
              return true;
            })
            .map((product) => {
            const inCart = isProductInCart(product.product_id);
            const processing = addingToCart === product.product_id;

            return (
              <div
                key={product.product_id}
                className="product-card"
                onClick={() => setSelectedProduct(product)}
              >
                {/* Product Image */}
                <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', background: '#000', position: 'relative' }}>
                  {product.product_media1 ? (
                    <img src={product.product_media1} alt={product.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)' }}>
                      <PackageOpen size={48} />
                    </div>
                  )}
                  
                  {product['product_rui'] && (
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#6ee7b7', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      RUI
                    </div>
                  )}

                  {/* Heart Icon - Wishlist */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddToWishlist(product.product_id); }}
                    disabled={wishlistingProduct === product.product_id}
                    className="product-wishlist-btn"
                    style={{
                      background: isProductInWishlist(product.product_id) ? 'rgba(255, 59, 48, 0.9)' : 'rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    <Heart 
                      size={20} 
                      fill={isProductInWishlist(product.product_id) ? '#ff3b30' : 'none'}
                      color={isProductInWishlist(product.product_id) ? '#ff3b30' : '#fff'}
                    />
                  </button>
                </div>

                {/* Product Details */}
                <div className="product-card-details">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 className="product-card-title">{product.product_name}</h3>
                  </div>

                  {/* Tags */}
                  <div className="product-card-tags">
                    {product.product_tag1 && (
                      <span className="product-tag">
                        <Tag size={10} /> {tagsMap[product.product_tag1]}({product.product_tag1})
                      </span>
                    )}
                    {product.product_tag2 && (
                      <span className="product-tag">
                        <Tag size={10} /> {tagsMap[product.product_tag2]}({product.product_tag2})
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="product-card-price">
                    <span className="product-price-sale">₹{product.product_saleprice}</span>
                    {product.product_offerprice && (
                      <span className="product-price-offer">₹{product.product_offerprice}</span>
                    )}
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(product.product_id); }}
                    disabled={inCart || processing}
                    className="product-card-btn"
                    style={{ 
                      background: inCart ? 'rgba(110,231,183,0.1)' : '#fff', 
                      color: inCart ? '#6ee7b7' : '#000', 
                      border: inCart ? '1px solid rgba(110,231,183,0.3)' : 'none', 
                      cursor: inCart ? 'default' : 'pointer', 
                    }}
                  >
                    {processing ? (
                      'Adding...'
                    ) : inCart ? (
                      <><Check size={18} /> In Cart</>
                    ) : (
                      <><ShoppingCart size={18} /> Add to Cart</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          session={session}
          userProfile={userProfile}
          userCart={userCart}
          onCartUpdate={onCartUpdate}
        />
      )}
    </section>
  );
}
