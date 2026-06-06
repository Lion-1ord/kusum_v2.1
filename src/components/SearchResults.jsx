import { useState, useEffect } from 'react';
import { PackageOpen, ShoppingCart, Tag, Check, Heart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import ProductDetail from './ProductDetail';
import FilterSidebar from './FilterSidebar';

export default function SearchResults({ session, userProfile, userCart, userWishlist, onCartUpdate, onWishlistUpdate, searchQuery }) {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(null);
  const [wishlistingProduct, setWishlistingProduct] = useState(null);
  const [tagsMap, setTagsMap] = useState({});
  const [filters, setFilters] = useState({
    priceMin: 200,
    priceMax: 10000,
    selectedTags: []
  });

  // Synonym map for better matching
  const synonyms = {
    'saree': ['sari', 'sare', 'silk saree', 'cotton saree', 'traditional'],
    'women': ['female', 'girl', 'lady', 'womens'],
    'red': ['crimson', 'maroon', 'burgundy', 'scarlet'],
    'blue': ['navy', 'azure', 'cobalt', 'indigo'],
    'green': ['emerald', 'olive', 'sage'],
    'yellow': ['gold', 'amber', 'mustard'],
    'silk': ['silk', 'satin', 'glossy'],
    'cotton': ['cotton', 'khadi']
  };

  // Get all token variations for matching
  const getTokenVariations = (token) => {
    const variations = [token.toLowerCase()];
    for (const [key, synonymList] of Object.entries(synonyms)) {
      if (key.includes(token) || token.includes(key)) {
        variations.push(key, ...synonymList);
      }
      if (synonymList.includes(token)) {
        variations.push(key, ...synonymList);
      }
    }
    return [...new Set(variations)];
  };

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

    if (userCart) {
      const alreadyInCart = cartKeys.some(key => userCart[key] === productId);
      if (alreadyInCart) {
        alert('This item is already in your cart.');
        return;
      }
    }

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

  // Advanced ranking algorithm
  const rankProducts = (productsToRank) => {
    if (!searchQuery || !searchQuery.trim()) return productsToRank;

    const tokens = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    
    return productsToRank.map(product => {
      let score = 0;
      const matchedTokens = new Set();

      const productName = String(product.product_name || '').toLowerCase();
      const tag1Name = tagsMap[product.product_tag1]?.toLowerCase() || '';
      const tag2Name = tagsMap[product.product_tag2]?.toLowerCase() || '';
      const tag1Id = String(product.product_tag1 || '').toLowerCase();
      const tag2Id = String(product.product_tag2 || '').toLowerCase();

      tokens.forEach(token => {
        const variations = getTokenVariations(token);

        // Check product name (highest priority)
        variations.forEach(variant => {
          if (productName.includes(variant)) {
            score += 30;
            matchedTokens.add(token);
          }
        });

        // Check tag names (medium priority)
        variations.forEach(variant => {
          if (tag1Name.includes(variant) || tag2Name.includes(variant)) {
            score += 20;
            matchedTokens.add(token);
          }
        });

        // Check tag IDs (fallback, lower priority)
        variations.forEach(variant => {
          if (tag1Id.includes(variant) || tag2Id.includes(variant)) {
            score += 5;
            matchedTokens.add(token);
          }
        });
      });

      return {
        ...product,
        score,
        matchCount: matchedTokens.size
      };
    }).sort((a, b) => b.score - a.score || b.matchCount - a.matchCount);
  };

  // Filter and rank products
  const processedProducts = rankProducts(
    products.filter(product => {
      const price = product.product_saleprice || 0;
      const priceInRange = price >= filters.priceMin && price <= filters.priceMax;
      
      // If tags are selected, product must have at least one selected tag
      if (filters.selectedTags.length > 0) {
        const hasSelectedTag = filters.selectedTags.includes(product.product_tag1) || 
                               filters.selectedTags.includes(product.product_tag2);
        return priceInRange && hasSelectedTag;
      }
      
      return priceInRange;
    })
  );

  // Group products by relevance
  const groupedResults = {
    bestMatches: processedProducts.filter(p => p.matchCount === (processedProducts[0]?.matchCount || 0) && p.matchCount > 0),
    relatedResults: processedProducts.filter(p => p.matchCount > 0 && p.matchCount < (processedProducts[0]?.matchCount || 0)),
    exploreMore: processedProducts.filter(p => p.matchCount === 0)
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

  const renderProductGroup = (title, products) => {
    if (products.length === 0) return null;

    return (
      <div style={{ marginBottom: '40px' }} key={title}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: 600, 
          marginBottom: '16px', 
          color: '#fff',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {title} ({products.length})
        </h3>
        <div className="product-grid">
          {products.map((product) => {
            const inCart = isProductInCart(product.product_id);
            const processing = addingToCart === product.product_id;

            return (
              <div
                key={product.product_id}
                className="product-card"
                onClick={() => setSelectedProduct(product)}
              >
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

                <div className="product-card-details">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 className="product-card-title">{product.product_name}</h3>
                  </div>

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
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '24px', padding: '20px 0' }}>
      {/* Filter Sidebar */}
      <FilterSidebar onFiltersChange={setFilters} tagsMap={tagsMap} />

      {/* Results Section */}
      <div style={{ flex: 1 }}>
        <div className="product-header" style={{ marginBottom: '30px' }}>
          <h2>Search Results</h2>
          <span>{processedProducts.length} items</span>
        </div>
        
        {processedProducts.length === 0 ? (
          <div className="product-empty">
            <div className="product-empty-icon">
              <PackageOpen />
            </div>
            <h3>No products found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            {groupedResults.bestMatches.length > 0 && renderProductGroup('Best Matches', groupedResults.bestMatches)}
            {groupedResults.relatedResults.length > 0 && renderProductGroup('Related Results', groupedResults.relatedResults)}
            {groupedResults.exploreMore.length > 0 && renderProductGroup('Explore More', groupedResults.exploreMore)}
          </>
        )}
      </div>

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
    </div>
  );
}
