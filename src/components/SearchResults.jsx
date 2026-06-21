import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import ProductCard from './ProductCard';

export default function SearchResults({ searchQuery, onProductClick }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('product_id, product_name, product_media1, product_saleprice, product_offerprice, product_instock')
          .order('product_name', { ascending: true });

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching search products:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const query = searchQuery.trim().toLowerCase();
  const filtered = query
    ? products.filter((p) => p.product_name?.toLowerCase().includes(query))
    : products;

  return (
    <section className="product-section search-results-section">
      <div className="product-header">
        <h2>Search results</h2>
        <span>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading && <p className="product-loading">Searching…</p>}

      {!loading && filtered.length === 0 && (
        <div className="product-empty">
          <h3>No products found</h3>
          <p>Try a different search term.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="product-grid">
          {filtered.map((product) => (
            <ProductCard
              key={product.product_id}
              product={product}
              onClick={onProductClick}
            />
          ))}
        </div>
      )}
    </section>
  );
}
