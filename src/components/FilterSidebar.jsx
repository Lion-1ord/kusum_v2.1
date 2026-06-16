import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function FilterSidebar({ onFiltersChange }) {
  const [priceMin, setPriceMin] = useState(200);
  const [priceMax, setPriceMax] = useState(10000);
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);

  const MIN_PRICE = 200;
  const MAX_PRICE = 10000;

  // Fetch categories and tags
  useEffect(() => {
    const fetchCategoriesAndTags = async () => {
      try {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('cat_id', { ascending: true });
        
        if (catError) throw catError;

        const { data: tagData, error: tagError } = await supabase
          .from('tags')
          .select('*')
          .order('tag_id', { ascending: true });
        
        if (tagError) throw tagError;

        // Group tags by category
        const groupedCategories = catData.map(cat => ({
          ...cat,
          tags: tagData.filter(tag => tag.under_catname === cat.cat_name)
        }));

        setCategories(groupedCategories);

        // Expand first category by default
        if (groupedCategories.length > 0) {
          setExpandedCategories({ [groupedCategories[0].cat_id]: true });
        }
      } catch (err) {
        console.error('Error fetching filters:', err.message);
      }
    };

    fetchCategoriesAndTags();
  }, []);

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleFilter = () => {
    onFiltersChange({
      priceMin,
      priceMax,
      selectedTags
    });
  };

  const handleReset = () => {
    setPriceMin(MIN_PRICE);
    setPriceMax(MAX_PRICE);
    setSelectedTags([]);
    onFiltersChange({
      priceMin: MIN_PRICE,
      priceMax: MAX_PRICE,
      selectedTags: []
    });
  };

  const LABEL_STYLE = {
    display: 'block',
    marginBottom: '6px',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const INPUT_STYLE = {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff',
    borderRadius: '8px',
    boxSizing: 'border-box',
    fontSize: '14px',
    outline: 'none'
  };

  return (
    <div style={{
      width: '280px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '12px',
      padding: '24px',
      height: 'fit-content',
      position: 'sticky',
      top: '100px'
    }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700, color: '#fff' }}>Filters</h3>

      {/* Price Range */}
      <div style={{ marginBottom: '28px' }}>
        <label style={LABEL_STYLE}>Price Range</label>
        
        {/* Price Display */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <input
            type="number"
            min={MIN_PRICE}
            max={priceMax}
            value={priceMin}
            onChange={e => setPriceMin(Math.max(MIN_PRICE, parseInt(e.target.value) || MIN_PRICE))}
            style={{ ...INPUT_STYLE, flex: 1, fontSize: '13px', padding: '8px' }}
            placeholder="Min"
          />
          <input
            type="number"
            min={priceMin}
            max={MAX_PRICE}
            value={priceMax}
            onChange={e => setPriceMax(Math.min(MAX_PRICE, parseInt(e.target.value) || MAX_PRICE))}
            style={{ ...INPUT_STYLE, flex: 1, fontSize: '13px', padding: '8px' }}
            placeholder="Max"
          />
        </div>

        {/* Range Slider */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="range"
            min={MIN_PRICE}
            max={MAX_PRICE}
            value={priceMin}
            onChange={e => setPriceMin(Math.min(parseInt(e.target.value), priceMax))}
            style={{ flex: 1, cursor: 'pointer' }}
          />
          <input
            type="range"
            min={MIN_PRICE}
            max={MAX_PRICE}
            value={priceMax}
            onChange={e => setPriceMax(Math.max(parseInt(e.target.value), priceMin))}
            style={{ flex: 1, cursor: 'pointer' }}
          />
        </div>

        {/* Price Summary */}
        <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          ₹{priceMin} - ₹{priceMax}{priceMax >= MAX_PRICE ? '+' : ''}
        </p>
      </div>

      {/* Categories and Tags */}
      <div style={{ marginBottom: '28px' }}>
        <label style={{ ...LABEL_STYLE, marginBottom: '12px' }}>Categories & Tags</label>
        
        {categories.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>No categories available</p>
        ) : (
          categories.map(cat => (
            <div key={cat.cat_id} style={{ marginBottom: '12px' }}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat.cat_id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              >
                <span>{cat.cat_name}</span>
                {expandedCategories[cat.cat_id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {/* Tags */}
              {expandedCategories[cat.cat_id] && cat.tags.length > 0 && (
                <div style={{ marginTop: '8px', paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cat.tags.map(tag => (
                    <label
                      key={tag.tag_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.7)',
                        transition: 'color 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.color = '#fff'}
                      onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.tag_id)}
                        onChange={() => toggleTag(tag.tag_id)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                      {tag.tag_name}({tag.tag_id})
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
        <button
          onClick={handleFilter}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#374151',
            border: '1px solid #4b5563',
            color: '#d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 700,
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Apply Filter
        </button>
        
        {(selectedTags.length > 0 || priceMin !== 200 || priceMax !== 10000) && (
          <button
            onClick={handleReset}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.6)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
