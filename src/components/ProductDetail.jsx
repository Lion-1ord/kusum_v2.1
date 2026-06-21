import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import ProductCard from './ProductCard';

export default function ProductDetail({ productId, onBack }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('product_id, product_name, product_media1, product_saleprice, product_offerprice, product_instock')
          .eq('product_id', productId)
          .single();

        if (fetchError) throw fetchError;
        setProduct(data);
      } catch (err) {
        console.error('Error fetching product:', err.message);
        setError('Product not found.');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  return (
    <main className="product-detail-page">
      <button type="button" className="product-detail-back" onClick={onBack}>
        <ArrowLeft size={18} />
        Back to shop
      </button>

      {loading && <p className="product-loading">Loading product…</p>}

      {!loading && error && (
        <div className="product-empty">
          <h3>{error}</h3>
        </div>
      )}

      {!loading && product && (
        <div className="product-detail-card-wrap">
          <ProductCard product={product} variant="detail" />
        </div>
      )}
    </main>
  );
}
