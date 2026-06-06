export default function Hero({ activeCategory, setActiveCategory }) {
  return (
    <section className="hero" id="hero-section">
      <h1 className="hero-title" id="hero-brand">SALE: 30% off On Your First 5 Orders!!!</h1>
      <p className="hero-subtitle" id="hero-motto">Wrapped in Grace. Drape Your Story.</p>
      <div className="hero-buttons">
        <button 
          className={`hero-button ${activeCategory === 'hydrangea' ? 'active' : ''}`}
          onClick={() => setActiveCategory('hydrangea')}
          title="Hydrangea flowers"
        >
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '20px' }}>🌸</div>
            <span style={{ fontSize: '12px', fontWeight: '600' }}>Hydrangea</span>
          </div>
        </button>
        <button 
          className={`hero-button ${activeCategory === 'cotton' ? 'active' : ''}`}
          onClick={() => setActiveCategory('cotton')}
          title="Cotton flowers"
        >
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '20px' }}>🌾</div>
            <span style={{ fontSize: '12px', fontWeight: '600' }}>Cotton</span>
          </div>
        </button>
      </div>
    </section>
  );
}
