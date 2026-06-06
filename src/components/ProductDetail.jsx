import { useState, useEffect } from 'react';
import { X, ShoppingCart, Check, Tag, ChevronLeft, ChevronRight, Package, Zap } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function ProductDetail({ product, onClose, session, userProfile, userCart, onCartUpdate }) {
  const mediaSlots = [
    product.product_media1,
    product.product_media2,
    product.product_media3,
    product.product_media4,
    product.product_media5,
  ].filter(Boolean);

  const [selectedMedia, setSelectedMedia] = useState(mediaSlots[0] || null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [tagNames, setTagNames] = useState({ tag1: null, tag2: null });

  const cartKeys = Array.from({ length: 5 }, (_, i) => `cart_item${i + 1}`);
  const isInCart = userCart ? cartKeys.some(key => userCart[key] === product.product_id) : false;

  const discountPercent =
    product.product_offerprice && product.product_saleprice && product.product_offerprice > product.product_saleprice
      ? Math.round(((product.product_offerprice - product.product_saleprice) / product.product_offerprice) * 100)
      : null;

  // Resolve tag IDs → tag names
  useEffect(() => {
    async function fetchTagNames() {
      const ids = [product.product_tag1, product.product_tag2].filter(Boolean);
      if (ids.length === 0) return;

      const { data } = await supabase
        .from('tags')
        .select('tag_id, tag_name')
        .in('tag_id', ids);

      if (data) {
        const map = Object.fromEntries(data.map(t => [t.tag_id, t.tag_name]));
        setTagNames({
          tag1: product.product_tag1 ? map[product.product_tag1] || null : null,
          tag2: product.product_tag2 ? map[product.product_tag2] || null : null,
        });
      }
    }
    fetchTagNames();
  }, [product]);

  const handleAddToCart = async () => {
    if (!session) { alert('Please log in to add items to your cart.'); return; }
    if (!userProfile) { alert('User profile not found.'); return; }
    if (isInCart) return;

    const emptySlotKey = userCart ? cartKeys.find(key => !userCart[key]) : 'cart_item1';
    if (!emptySlotKey) { alert('Your cart is full (max 5 items).'); return; }

    setAddingToCart(true);
    try {
      if (!userCart) {
        const { error } = await supabase.from('user_carts').insert([{
          id: userProfile.id,
          user_email: userProfile.user_email,
          user_mobno: userProfile.user_mobno,
          [emptySlotKey]: product.product_id
        }]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_carts')
          .update({ [emptySlotKey]: product.product_id })
          .eq('user_email', session.user.email);
        if (error) throw error;
      }
      if (onCartUpdate) await onCartUpdate();
    } catch (err) {
      alert('Error adding to cart: ' + err.message);
    } finally {
      setAddingToCart(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!session) { alert('Please log in to place an order.'); return; }
    if (!userProfile) { alert('User profile not found.'); return; }
    if (product.product_instock === 0) return;

    const orderKeys = Array.from({ length: 5 }, (_, i) => `order_item${i + 1}`);

    setPlacingOrder(true);
    try {
      // ── 1. Update user_orders (match by id, int8) ─────────────────────
      const { data: existingOrder } = await supabase
        .from('user_orders')
        .select('*')
        .eq('id', userProfile.id)
        .single();

      if (!existingOrder) {
        const { error } = await supabase.from('user_orders').insert([{
          id: userProfile.id,
          user_email: userProfile.user_email,
          user_mobno: userProfile.user_mobno,
          order_item1: product.product_id
        }]);
        if (error) throw error;
      } else {
        // Find first empty slot (no duplicate check — user can re-order)
        const emptySlot = orderKeys.find(key => !existingOrder[key]);
        if (!emptySlot) {
          alert('Your order list is full (max 5 items).');
          return;
        }
        const { error } = await supabase.from('user_orders')
          .update({ [emptySlot]: product.product_id })
          .eq('id', userProfile.id);
        if (error) throw error;
      }

      // ── 2. Decrement stock by 1 ───────────────────────────────────────
      const { error: stockErr } = await supabase
        .from('products')
        .update({ product_instock: product.product_instock - 1 })
        .eq('product_id', product.product_id);
      if (stockErr) throw stockErr;

      // ── 3. Build shared sale record payload ────────────────────────────
      const saleId = crypto.randomUUID();
      const isRui = product['product_rui'] === true;
      const salePayload = {
        sale_id: saleId,
        product_id: product.product_id,
        ordered_at: new Date().toISOString(),
        product_costprice: product.product_costprice,
        product_saleprice: product.product_saleprice,
        product_name: product.product_name,
      };

      // ── 4. Insert into master table ────────────────────────────────────
      const { error: masterErr } = await supabase
        .from('total_sale_list')
        .insert([salePayload]);
      if (masterErr) throw masterErr;

      // ── 5. Insert into brand-specific table ───────────────────────────
      const brandTable = isRui ? 'rui_sale_list' : 'charkha_sale_list';
      const { error: brandErr } = await supabase
        .from(brandTable)
        .insert([salePayload]);
      if (brandErr) throw brandErr;

      setOrderPlaced(true);
    } catch (err) {
      alert('Error placing order: ' + err.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  const prevImage = () => {
    const prev = (mediaSlots.indexOf(selectedMedia) - 1 + mediaSlots.length) % mediaSlots.length;
    setSelectedMedia(mediaSlots[prev]);
  };
  const nextImage = () => {
    const next = (mediaSlots.indexOf(selectedMedia) + 1) % mediaSlots.length;
    setSelectedMedia(mediaSlots[next]);
  };

  return (
    <div
      id="product-detail-overlay"
      onClick={(e) => { if (e.target.id === 'product-detail-overlay') onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: '20px',
        overflowY: 'auto',
      }}
    >
      <div style={{
        background: 'linear-gradient(145deg, #0f0f0f, #1a1a1a)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        width: '100%', maxWidth: '1000px',
        position: 'relative',
        boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
        overflow: 'hidden',
        animation: 'fadeSlideUp 0.25s ease',
      }}>

        {/* Close Button */}
        <button
          id="product-detail-close"
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff', borderRadius: '50%', width: '36px', height: '36px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, transition: 'background 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', flexWrap: 'wrap' }}>

          {/* ── LEFT: Image Gallery ── */}
          <div style={{
            flex: '1 1 400px', padding: '36px',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column', gap: '16px',
          }}>
            {/* Main Image */}
            <div style={{
              position: 'relative', aspectRatio: '1',
              background: 'rgba(255,255,255,0.03)', borderRadius: '14px',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {selectedMedia ? (
                <img
                  src={selectedMedia}
                  alt={product.product_name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <Package size={80} style={{ color: 'rgba(255,255,255,0.1)' }} />
              )}

              {/* RUI Badge */}
              {product['product_rui?'] && (
                <div style={{
                  position: 'absolute', top: '12px', left: '12px',
                  background: 'linear-gradient(135deg,#6ee7b7,#3b82f6)',
                  color: '#000', padding: '4px 10px', borderRadius: '6px',
                  fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  RUI
                </div>
              )}

              {/* Prev / Next arrows */}
              {mediaSlots.length > 1 && (
                <>
                  <button onClick={prevImage} style={{
                    position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', borderRadius: '50%', width: '32px', height: '32px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={nextImage} style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', borderRadius: '50%', width: '32px', height: '32px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {mediaSlots.length > 1 && (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {mediaSlots.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedMedia(src)}
                    style={{
                      width: '60px', height: '60px', padding: 0,
                      borderRadius: '10px', overflow: 'hidden',
                      border: selectedMedia === src
                        ? '2px solid #6ee7b7'
                        : '2px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer', background: 'rgba(255,255,255,0.04)',
                      transition: 'border-color 0.2s', flexShrink: 0,
                    }}
                  >
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Product Info ── */}
          <div style={{
            flex: '1 1 340px', padding: '36px',
            display: 'flex', flexDirection: 'column', gap: '20px',
          }}>

            {/* Tags — show names, not IDs */}
            {(tagNames.tag1 || tagNames.tag2) && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {tagNames.tag1 && (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: 'rgba(110,231,183,0.1)', color: '#6ee7b7',
                    padding: '4px 10px', borderRadius: '999px',
                    border: '1px solid rgba(110,231,183,0.25)',
                  }}>
                    <Tag size={10} /> {tagNames.tag1}
                  </span>
                )}
                {tagNames.tag2 && (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: 'rgba(59,130,246,0.1)', color: '#93c5fd',
                    padding: '4px 10px', borderRadius: '999px',
                    border: '1px solid rgba(59,130,246,0.25)',
                  }}>
                    <Tag size={10} /> {tagNames.tag2}
                  </span>
                )}
              </div>
            )}

            {/* Product Name */}
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>
              {product.product_name}
            </h2>

            {/* Divider */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

            {/* Price Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {discountPercent && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
                  color: '#f87171', padding: '4px 12px', borderRadius: '999px',
                  fontSize: '13px', fontWeight: 700, width: 'fit-content',
                }}>
                  -{discountPercent}% OFF
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '36px', fontWeight: 800, color: '#fff' }}>
                  ₹{product.product_saleprice}
                </span>
                {product.product_offerprice && (
                  <span style={{ fontSize: '18px', textDecoration: 'line-through', color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>
                    ₹{product.product_offerprice}
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                Inclusive of all taxes
              </p>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

            {/* Stock Status — no count shown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {product.product_instock > 0 ? (
                <>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                  <span style={{ color: '#4ade80', fontWeight: 600, fontSize: '14px' }}>In Stock</span>
                </>
              ) : (
                <>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
                  <span style={{ color: '#f87171', fontWeight: 600, fontSize: '14px' }}>Out of Stock</span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* Add to Cart */}
              <button
                id="product-detail-add-cart"
                onClick={handleAddToCart}
                disabled={isInCart || addingToCart || product.product_instock === 0}
                style={{
                  width: '100%', padding: '14px',
                  background: isInCart
                    ? 'rgba(110,231,183,0.1)'
                    : product.product_instock === 0
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(255,255,255,0.08)',
                  color: isInCart ? '#6ee7b7' : product.product_instock === 0 ? 'rgba(255,255,255,0.3)' : '#fff',
                  border: isInCart
                    ? '1px solid rgba(110,231,183,0.3)'
                    : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  fontWeight: 600, fontSize: '15px',
                  cursor: isInCart || product.product_instock === 0 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  transition: 'all 0.2s',
                  opacity: addingToCart ? 0.7 : 1,
                }}
                onMouseOver={e => { if (!isInCart && product.product_instock > 0) e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
                onMouseOut={e => { if (!isInCart && product.product_instock > 0) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              >
                {addingToCart ? 'Adding...' : isInCart ? <><Check size={18} /> In Cart</> : <><ShoppingCart size={18} /> Add to Cart</>}
              </button>

              {/* Place Order */}
              <button
                id="product-detail-place-order"
                onClick={handlePlaceOrder}
                disabled={placingOrder || orderPlaced || product.product_instock === 0}
                style={{
                  width: '100%', padding: '14px',
                  background: orderPlaced
                    ? 'rgba(110,231,183,0.1)'
                    : product.product_instock === 0
                    ? 'rgba(255,255,255,0.05)'
                    : 'linear-gradient(135deg, #6ee7b7, #3b82f6)',
                  color: orderPlaced
                    ? '#6ee7b7'
                    : product.product_instock === 0
                    ? 'rgba(255,255,255,0.3)'
                    : '#000',
                  border: orderPlaced ? '1px solid rgba(110,231,183,0.3)' : 'none',
                  borderRadius: '12px',
                  fontWeight: 700, fontSize: '15px',
                  cursor: placingOrder || orderPlaced || product.product_instock === 0 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  transition: 'all 0.2s',
                  opacity: placingOrder ? 0.7 : 1,
                }}
                onMouseOver={e => { if (!placingOrder && !orderPlaced && product.product_instock > 0) e.currentTarget.style.opacity = '0.9'; }}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                {placingOrder ? (
                  'Placing Order...'
                ) : orderPlaced ? (
                  <><Check size={18} /> Order Placed!</>
                ) : product.product_instock === 0 ? (
                  'Out of Stock'
                ) : (
                  <><Zap size={18} /> Place Order</>
                )}
              </button>

            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
