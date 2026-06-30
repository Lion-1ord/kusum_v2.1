import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import ProductCard from './ProductCard';

export default function ProductList({ onProductClick, appMode }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let query = supabase
          .from('products')
          .select('product_id, product_name, product_media1, product_saleprice, product_offerprice, product_instock, product_rui')
          .order('product_name', { ascending: true });

        if (appMode === 'budget') {
          query = query.eq('product_rui', true);
        } else {
          query = query.or('product_rui.eq.false,product_rui.is.null');
        }

        const { data, error } = await query;

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching products:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [appMode]);

  if (loading) {
    return (
      <section className="product-section">
        <p className="product-loading">Loading products…</p>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="product-section">
        <div className="product-empty">
          <h3>No products listed yet</h3>
          <p>Check back soon for new arrivals.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="product-section">
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product.product_id}
            product={product}
            onClick={onProductClick}
          />
        ))}
      </div>
    </section>
  );
}
