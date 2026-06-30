import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { calcDiscountPercent, formatPrice, hasOfferPrice } from '../utils/productHelpers';

export default function ProductDetail({ appMode = 'budget' }) {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [tagNames, setTagNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productTheme, setProductTheme] = useState('premium');
  const [openSection, setOpenSection] = useState(null);
  const [mainImage, setMainImage] = useState(null);

  useEffect(() => {
    async function fetchProductData() {
      if (!productId) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch product
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('product_id', productId)
          .single();

        if (fetchError) throw fetchError;
        setProduct(data);
        
        // Set theme based on product_rui: TRUE = budget, FALSE/null = premium
        setProductTheme(data.product_rui === true ? 'budget' : 'premium');
        
        // Set initial main image
        setMainImage(data.product_media1 || null);

        // Fetch tags
        const tagIds = [data.product_tag1, data.product_tag2, data.product_tag3].filter(Boolean);
        let currentTagNames = [];
        
        if (tagIds.length > 0) {
          // Fetch all tags to avoid guessing the primary key name (id vs tag_id)
          const { data: allTags, error: tagsError } = await supabase.from('tags').select('*');
          if (!tagsError && allTags) {
             const matchedTags = allTags.filter(t => tagIds.includes(t.id) || tagIds.includes(t.tag_id));
             currentTagNames = matchedTags.map(t => t.tag_name).filter(Boolean);
             setTagNames(currentTagNames);
          }
        }

        // Fetch similar products based on shared tags
        if (tagIds.length > 0) {
          // A bit tricky without knowing exact column types, fallback to fetching recent products
          const { data: allProducts, error: simError } = await supabase
            .from('products')
            .select('product_id, product_name, product_media1, product_saleprice, product_offerprice, product_tag1, product_tag2, product_tag3')
            .neq('product_id', productId)
            .limit(20);

          if (!simError && allProducts) {
             const similar = allProducts.filter(p => {
               const pTags = [p.product_tag1, p.product_tag2, p.product_tag3].filter(Boolean);
               return pTags.some(t => tagIds.includes(t));
             }).slice(0, 5);
             
             if (similar.length > 0) {
                setSimilarProducts(similar);
             } else {
                setSimilarProducts(allProducts.slice(0, 5));
             }
          }
        } else {
           // If no tags, just show some other products
           const { data: otherProducts } = await supabase
             .from('products')
             .select('product_id, product_name, product_media1, product_saleprice, product_offerprice')
             .neq('product_id', productId)
             .limit(5);
           if (otherProducts) setSimilarProducts(otherProducts);
        }

      } catch (err) {
        console.error('Error fetching product:', err.message);
        setError('Product not found.');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProductData();
  }, [productId]);

  if (loading) {
    return <main className="product-detail-page"><p className="product-loading">Loading product…</p></main>;
  }

  if (error || !product) {
    return (
      <main className="product-detail-page">
        <div className="product-empty">
          <h3>{error || 'Product not found'}</h3>
        </div>
      </main>
    );
  }

  const salePrice = product.product_saleprice;
  const offerPrice = product.product_offerprice;
  const showOffer = hasOfferPrice(offerPrice);
  const discount = showOffer ? calcDiscountPercent(salePrice, offerPrice) : null;

  return (
    <main className={`product-detail-mono mono-theme-${productTheme}`}>
      <div className="mono-content">
        <div className="mono-left-col">
          <div className="mono-large-images">
             <div className="mono-img-box">
               {mainImage ? <img src={mainImage} alt="Main image" /> : <span>Product image</span>}
             </div>
          </div>
          <div className="mono-small-images">
             {[product.product_media1, product.product_media2, product.product_media3, product.product_media4, product.product_media5, product.product_media6, product.product_media7].filter(Boolean).map((media, idx) => (
                <div key={idx} className="mono-thumb-box" onClick={() => setMainImage(media)}>
                  <img src={media} alt={`Image ${idx+1}`} />
                </div>
             ))}
          </div>
        </div>

        <div className="mono-right-col">
           <div className="mono-tags-row">
             {tagNames.length > 0 ? (
                tagNames.map((tag, idx) => (
                   <span key={idx} className="mono-tag-box">{tag}</span>
                ))
             ) : (
                <>
                  <span className="mono-tag-box">Product tag 1</span>
                  <span className="mono-tag-box">Product tag 2</span>
                  <span className="mono-tag-box">Product tag 3</span>
                </>
             )}
           </div>

           <div className="mono-product-name-row">
             <h1 className="mono-product-name">{product.product_name}</h1>
             <div className="mono-dashed-line"></div>
           </div>
           
           <div className="mono-ratings-static">
              x stars/5 stars
           </div>

           <div className="mono-pricing-row">
              <span className="mono-discount">{discount !== null ? `${discount}% off!` : '0% off!'}</span>
              {showOffer ? (
                <span className="mono-offer-price">{formatPrice(offerPrice)}</span>
              ) : (
                <span className="mono-offer-price">Offerprice</span>
              )}
              <span className="mono-sale-price">{formatPrice(salePrice) || 'Sale price'}</span>
           </div>

           <div className="mono-actions-row">
              <button className="mono-btn">Add to Cart</button>
              <button className="mono-btn">
                 Buy Now!<br/>
                 at: {formatPrice(salePrice)}
              </button>
           </div>
        </div>
      </div>

      <div className="mono-details-section">
         <div className="mono-details-box">
            <h3 className="mono-details-title">{product.product_name}--------------</h3>
            <div className="mono-accordion">
               <div className="mono-accordion-header" onClick={() => setOpenSection(openSection === 'highlights' ? null : 'highlights')}>
                  <span>Product highlights &gt;</span>
                  <span className="mono-accordion-icon">{openSection === 'highlights' ? '▼' : '▶'}</span>
               </div>
               {openSection === 'highlights' && (
                  <div className="mono-accordion-content">
                     <p>Product highlights will be displayed here.</p>
                  </div>
               )}
            </div>
            <div className="mono-accordion">
               <div className="mono-accordion-header" onClick={() => setOpenSection(openSection === 'details' ? null : 'details')}>
                  <span>All details &gt;</span>
                  <span className="mono-accordion-icon">{openSection === 'details' ? '▼' : '▶'}</span>
               </div>
               {openSection === 'details' && (
                  <div className="mono-accordion-content">
                     <p>All product details will be displayed here.</p>
                  </div>
               )}
            </div>
            <div className="mono-accordion">
               <div className="mono-accordion-header" onClick={() => setOpenSection(openSection === 'delivery' ? null : 'delivery')}>
                  <span>Delivery details &gt;</span>
                  <span className="mono-accordion-icon">{openSection === 'delivery' ? '▼' : '▶'}</span>
               </div>
               {openSection === 'delivery' && (
                  <div className="mono-accordion-content">
                     <p>Delivery details will be displayed here.</p>
                  </div>
               )}
            </div>
         </div>
         <div className="mono-reviews-box">
            <h3 className="mono-details-title">Ratings &amp; Reviews:</h3>
            <div className="mono-reviews-content"></div>
         </div>
      </div>

      <div className="mono-explore-section">
         <h2>Explore more:</h2>
         <div className="mono-explore-grid">
            {similarProducts.map((p, idx) => (
               <div key={idx} className="mono-explore-tile" onClick={() => navigate(`/product/${p.product_id}`)}>
                  {p.product_media1 ? (
                    <img src={p.product_media1} alt={p.product_name} className="mono-explore-img" />
                  ) : (
                    <div className="mono-explore-placeholder">Sample Product {idx+1}</div>
                  )}
                  <div className="mono-explore-name">{p.product_name}</div>
               </div>
            ))}
         </div>
      </div>
    </main>
  );
}
