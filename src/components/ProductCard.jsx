import { calcDiscountPercent, formatPrice, hasOfferPrice } from '../utils/productHelpers';

export default function ProductCard({ product, onClick, variant = 'grid' }) {
  const salePrice = product.product_saleprice;
  const offerPrice = product.product_offerprice;
  const showOffer = hasOfferPrice(offerPrice);
  const discount = showOffer ? calcDiscountPercent(salePrice, offerPrice) : null;
  const isInteractive = variant !== 'detail' && Boolean(onClick);

  return (
    <article
      className={`product-card product-card--${variant}`}
      onClick={isInteractive ? () => onClick(product.product_id) : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(product.product_id);
        }
      } : undefined}
    >
      <div className="product-card-image">
        {product.product_media1 ? (
          <img src={product.product_media1} alt={product.product_name} />
        ) : (
          <div className="product-card-image-placeholder">No image</div>
        )}
      </div>

      <div className="product-card-body">
        <div className="product-card-name-row">
          <h3 className="product-card-title">{product.product_name}</h3>
          <span className="product-card-name-dash" aria-hidden="true" />
        </div>

        <div className="product-card-price">
          <span className="product-price-sale">{formatPrice(salePrice)}</span>
          {showOffer && (
            <span className="product-price-offer">{formatPrice(offerPrice)}</span>
          )}
        </div>

        {discount !== null && (
          <p className="product-card-discount">{discount}% off!</p>
        )}
      </div>
    </article>
  );
}
