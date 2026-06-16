import { useState, useEffect, useRef } from 'react';
import { PackageOpen, Plus, History, BarChart2, FileText, X, ToggleLeft, ToggleRight, PieChart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const INPUT_STYLE = {
  width: '100%', padding: '10px 12px', background: 'transparent',
  border: '1px solid rgba(255,255,255,0.06)', color: '#9CA3AF',
  borderRadius: '8px', boxSizing: 'border-box', fontSize: '14px', outline: 'none',
};
const LABEL_STYLE = { display: 'block', marginBottom: '6px', color: '#9CA3AF', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' };
const FIELD = { marginBottom: '18px' };

const COLORS = {
  MAIN_BG: '#000000',
  TEXT: '#9CA3AF', // grey for text and buttons
  BUTTON_BG: '#374151', // darker grey for button backgrounds
  ACCENT: '#ffffff', // white for bars / small accents
  BORDER: 'rgba(255,255,255,0.06)'
};

const EMPTY_PRODUCT = {
  product_name: '',
  product_instock: '',
  product_costprice: '',
  product_profit: '',
  product_saleprice: '',
  product_offerprice: '',
  product_rui: false,
  product_tags: [],
  product_status: 'draft',
};

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('live');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState('both');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('this week');

  // Axis settings for each graph
  const [productsSoldMin, setProductsSoldMin] = useState('0');
  const [productsSoldMax, setProductsSoldMax] = useState('100');
  const [totalProfitMin, setTotalProfitMin] = useState('0');
  const [totalProfitMax, setTotalProfitMax] = useState('10000');
  const [totalSaleMin, setTotalSaleMin] = useState('0');
  const [totalSaleMax, setTotalSaleMax] = useState('50000');

  // Equity distribution state
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState('20');
  const [exploreLiquidShare, setExploreLiquidShare] = useState(null);
  const [liquidSharePercentage, setLiquidSharePercentage] = useState('');
  const [liquidSharePeriod, setLiquidSharePeriod] = useState('total');

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [products, setProducts] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [totalSalesData, setTotalSalesData] = useState([]);
  const [ruiSalesData, setRuiSalesData] = useState([]);
  const [charkhaSalesData, setCharkhaSalesData] = useState([]);

  // Category / Tag form state
  const [newCatName, setNewCatName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [selectedCatForTag, setSelectedCatForTag] = useState('');

  // Product form state
  const [product, setProduct] = useState(EMPTY_PRODUCT);
  // media state removed
  const [uploading, setUploading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const fileRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // Color theme form state
  const [premiumPrimary, setPremiumPrimary] = useState('');
  const [premiumSecondary, setPremiumSecondary] = useState('');
  const [premiumTertiary, setPremiumTertiary] = useState('');

  const [budgetPrimary, setBudgetPrimary] = useState('');
  const [budgetSecondary, setBudgetSecondary] = useState('');
  const [budgetTertiary, setBudgetTertiary] = useState('');
  const [premiumSubmitting, setPremiumSubmitting] = useState(false);
  const [budgetSubmitting, setBudgetSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const { data: catData } = await supabase.from('categories').select('*').order('cat_id', { ascending: true });
      if (catData) setCategories(catData);
      const { data: tagData } = await supabase.from('tags').select('*').order('tag_id', { ascending: true });
      if (tagData) setTags(tagData);
      
      const { data: prodData } = await supabase.from('products').select('*');
      if (prodData) setProducts(prodData);

      const { data: salesData } = await supabase.from('total_sale_list').select('*').order('ordered_at', { ascending: false });
      if (salesData) setSalesHistory(salesData);

      const { data: totalData } = await supabase.from('total_sale_list').select('*');
      if (totalData) setTotalSalesData(totalData);

      const { data: ruiData } = await supabase.from('rui_sale_list').select('*');
      if (ruiData) setRuiSalesData(ruiData);

      const { data: charkhaData } = await supabase.from('charkha_sale_list').select('*');
      if (charkhaData) setCharkhaSalesData(charkhaData);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-compute sale price
  useEffect(() => {
    const cp = parseFloat(product.product_costprice) || 0;
    const pr = parseFloat(product.product_profit) || 0;
    setProduct(p => ({ ...p, product_saleprice: (cp + pr).toFixed(2) }));
  }, [product.product_costprice, product.product_profit]);

  const nextCatId = categories.length > 0 ? Math.max(...categories.map(c => c.cat_id || 0)) + 1 : 1;
  const nextTagId = tags.length > 0 ? Math.max(...tags.map(t => t.tag_id || 0)) + 1 : 1;

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return alert('Category name is required');
    const { error } = await supabase.from('categories').insert([{ cat_id: nextCatId, cat_name: newCatName }]);
    if (error) return alert('Error: ' + error.message);
    setNewCatName(''); setActiveModal(null); fetchData();
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return alert('Tag name is required');
    if (!selectedCatForTag) return alert('Please select a category');
    const { error } = await supabase.from('tags').insert([{ tag_id: nextTagId, tag_name: newTagName, under_catname: selectedCatForTag }]);
    if (error) return alert('Error: ' + error.message);
    setNewTagName(''); setSelectedCatForTag(''); setActiveModal(null); fetchData();
  };

  const handleFieldChange = (field, value) => {
    setProduct(p => ({ ...p, [field]: value }));
  };

  // Media upload UI/handlers removed per request

  const toggleTag = (tagId) => {
    setProduct(p => {
      const has = p.product_tags.includes(tagId);
      if (has) {
        return { ...p, product_tags: p.product_tags.filter(t => t !== tagId) };
      }

      // Find the category for the tag being toggled
      const tagObj = tags.find(t => String(t.tag_id) === String(tagId));
      const tagCategory = tagObj ? tagObj.under_catname : null;

      if (tagCategory) {
        // Count how many selected tags are already in this category
        const countInCategory = p.product_tags.reduce((acc, selId) => {
          const selTag = tags.find(t => String(t.tag_id) === String(selId));
          return acc + (selTag && selTag.under_catname === tagCategory ? 1 : 0);
        }, 0);

        if (countInCategory >= 2) {
          alert(`You can only select up to 2 tags for category '${tagCategory}'.`);
          return p;
        }
      }

      // No category limit exceeded — add the tag
      return { ...p, product_tags: [...p.product_tags, tagId] };
    });
  };

  // Image upload helpers removed

  const handleSubmitProduct = async (status) => {
    if (!product.product_name.trim()) return alert('Product name is required');
    setUploading(true); setSubmitStatus('Generating ID and uploading images...');
    try {
      // Generate a unique ID (UUID) for the product
      const productId = crypto.randomUUID();
      setSubmitStatus('Saving product...');
      const payload = {
        product_id: productId,
        product_name: product.product_name,
        product_instock: parseInt(product.product_instock) || 0,
        product_costprice: parseFloat(product.product_costprice) || 0,
        product_profit: parseFloat(product.product_profit) || 0,
        product_saleprice: parseFloat(product.product_saleprice) || 0,
        product_offerprice: product.product_offerprice ? parseFloat(product.product_offerprice) : null,
        product_rui: product.product_rui,
        product_tag1: product.product_tags[0] || null,
        product_tag2: product.product_tags[1] || null,
      };
      const { error } = await supabase.from('products').insert([payload]);
      if (error) throw new Error(error.message);
      setSubmitStatus('');
      setProduct(EMPTY_PRODUCT);
      setActiveModal(null);
      alert(status === 'live' ? 'Product is now LIVE!' : 'Product saved as draft.');
    } catch (err) {
      setSubmitStatus('');
      alert('Error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Add a new palette row to the specified Supabase table and make it the only active row
  const handleAddPalette = async (tableName, primaryVal, secondaryVal, tertiaryVal, resetFn, setSubmitting) => {
    if (!primaryVal && !secondaryVal && !tertiaryVal) return alert('Please enter at least one color value');
    try {
      if (typeof setSubmitting === 'function') setSubmitting(true);

      // Determine next color_serial
      const { data: lastRows, error: selErr } = await supabase.from(tableName).select('color_serial').order('color_serial', { ascending: false }).limit(1);
      if (selErr) throw selErr;
      const nextSerial = (lastRows && lastRows.length > 0 && lastRows[0].color_serial) ? lastRows[0].color_serial + 1 : 1;

      // Turn off activation for all existing rows by updating only known serials
      const { data: existingRows, error: fetchErr } = await supabase.from(tableName).select('color_serial');
      if (fetchErr) throw fetchErr;
      if (existingRows && existingRows.length > 0) {
        const serials = existingRows.map(r => r.color_serial).filter(s => s !== null && s !== undefined);
        if (serials.length > 0) {
          const { error: updErr } = await supabase.from(tableName).update({ activation: false }).in('color_serial', serials);
          if (updErr) throw updErr;
        }
      }

      // Insert the new palette row with activation true
      const payload = {
        color_serial: nextSerial,
        primary: primaryVal || null,
        secondary: secondaryVal || null,
        tertiary: tertiaryVal || null,
        activation: true,
      };
      const { error: insErr } = await supabase.from(tableName).insert([payload]);
      if (insErr) throw insErr;

      alert('Palette saved and activated');
      if (typeof resetFn === 'function') resetFn();
    } catch (err) {
      console.error('Palette save error:', err);
      alert('Error saving palette: ' + (err.message || JSON.stringify(err)));
    } finally {
      if (typeof setSubmitting === 'function') setSubmitting(false);
    }
  };

  const closeProduct = () => { setProduct(EMPTY_PRODUCT); setActiveModal(null); setSubmitStatus(''); };
  
  // Generate chart data based on time period and product type using real data
  const generateChartData = () => {
    let salesData = [];
    if (selectedProduct === 'both') {
      salesData = totalSalesData;
    } else if (selectedProduct === 'rui') {
      salesData = ruiSalesData;
    } else if (selectedProduct === 'charkha') {
      salesData = charkhaSalesData;
    }

    const now = new Date();
    let groupedData = {};
    let labels = [];

    // Filter and group data by time period
    salesData.forEach(sale => {
      const saleDate = new Date(sale.ordered_at);
      const cp = parseFloat(sale.product_costprice) || 0;
      const sp = parseFloat(sale.product_saleprice) || 0;
      const profit = sp - cp;

      let key = '';
      let label = '';

      switch(selectedTimePeriod) {
        case 'today':
          const hours = saleDate.getHours();
          const period = Math.floor(hours / 4) * 4;
          key = `${period}:00`;
          label = `${period}:00 - ${period + 4}:00`;
          break;
        case 'this week':
          const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dayOfWeek = saleDate.getDay();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          const saleWeekDay = new Date(saleDate);
          saleWeekDay.setHours(0, 0, 0, 0);
          if (saleWeekDay >= new Date(startOfWeek) && saleWeekDay <= new Date(now)) {
            key = daysOfWeek[saleWeekDay.getDay()];
            label = daysOfWeek[saleWeekDay.getDay()];
          }
          break;
        case 'this month':
          const weekNum = Math.ceil(saleDate.getDate() / 7);
          key = `Week ${weekNum}`;
          label = `Week ${weekNum}`;
          break;
        case '3 months':
          const monthDate = saleDate.toLocaleString('default', { month: 'short', year: '2-digit' });
          key = monthDate;
          label = monthDate;
          break;
        case '6 months':
          const sixMonthDate = saleDate.toLocaleString('default', { month: 'short', year: '2-digit' });
          key = sixMonthDate;
          label = sixMonthDate;
          break;
        case '1 year':
          const yearMonth = saleDate.toLocaleString('default', { month: 'short' });
          key = yearMonth;
          label = yearMonth;
          break;
        default:
          key = 'Unknown';
          label = 'Unknown';
      }

      if (key && label) {
        if (!groupedData[key]) {
          groupedData[key] = { name: label, productsSold: 0, totalProfit: 0, totalSale: 0 };
          labels.push(key);
        }
        groupedData[key].productsSold += 1;
        groupedData[key].totalProfit += profit;
        groupedData[key].totalSale += sp;
      }
    });

    // Sort labels by appropriate order
    if (selectedTimePeriod === 'this week') {
      const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      labels.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    } else if (selectedTimePeriod === 'this month') {
      labels.sort((a, b) => {
        const numA = parseInt(a.split(' ')[1]);
        const numB = parseInt(b.split(' ')[1]);
        return numA - numB;
      });
    }

    // Return chart data in order
    return labels.map(key => groupedData[key]).filter(item => item !== undefined);
  };

  const chartData = generateChartData();

  // Calculate total profit from sales data
  const calculateTotalProfit = () => {
    let totalProfit = 0;
    const salesData = selectedProduct === 'both' ? totalSalesData : selectedProduct === 'rui' ? ruiSalesData : charkhaSalesData;
    
    salesData.forEach(sale => {
      const cp = parseFloat(sale.product_costprice) || 0;
      const sp = parseFloat(sale.product_saleprice) || 0;
      const profit = sp - cp;
      totalProfit += profit;
    });
    
    return totalProfit;
  };

  const totalProfit = calculateTotalProfit();

  // Calculate profit for a specific period
  const calculateProfitByPeriod = (period) => {
    let salesData = [];
    if (selectedProduct === 'both') {
      salesData = totalSalesData;
    } else if (selectedProduct === 'rui') {
      salesData = ruiSalesData;
    } else if (selectedProduct === 'charkha') {
      salesData = charkhaSalesData;
    }

    const now = new Date();
    let periodProfit = 0;

    salesData.forEach(sale => {
      const saleDate = new Date(sale.ordered_at);
      const cp = parseFloat(sale.product_costprice) || 0;
      const sp = parseFloat(sale.product_saleprice) || 0;
      const profit = sp - cp;

      let isInPeriod = false;

      switch(period) {
        case 'today':
          const todayStart = new Date(now);
          todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date(now);
          todayEnd.setHours(23, 59, 59, 999);
          isInPeriod = saleDate >= todayStart && saleDate <= todayEnd;
          break;
        case 'this week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          isInPeriod = saleDate >= weekStart && saleDate <= now;
          break;
        case 'this month':
          isInPeriod = saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
          break;
        case 'this year':
          isInPeriod = saleDate.getFullYear() === now.getFullYear();
          break;
        case 'total':
          isInPeriod = true;
          break;
      }

      if (isInPeriod) {
        periodProfit += profit;
      }
    });

    return periodProfit;
  };
  // Group tags by category
  const tagsByCategory = categories.map(cat => ({
    cat,
    tags: tags.filter(t => t.under_catname === cat.cat_name),
  })).filter(g => g.tags.length > 0);

  const liveProducts = products; // Simplified for now since we removed status column

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('product_id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert('Error deleting product: ' + err.message);
    }
  };

  const overlayStyle = { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'flex-start', zIndex:1000, overflowY:'auto', padding:'40px 20px' };
  const modalBase = { background:'#111', borderRadius:'16px', border:`1px solid ${COLORS.BORDER}`, width:'100%', maxWidth:'780px', margin:'auto', padding:'36px', boxSizing:'border-box', position:'relative' };

  return (
    <div style={{ padding:'40px 20px', maxWidth:'1200px', margin:'0 auto', color: COLORS.TEXT }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px', borderBottom:`1px solid ${COLORS.BORDER}`, paddingBottom:'20px' }}>
        <div>
          <h1 style={{ fontSize:'28px', margin:'0 0 12px 0' }}>Admin panel</h1>
          <div style={{ position:'relative' }}>
            <button onClick={() => setShowPlusMenu(!showPlusMenu)} style={{ background:'transparent', border:`1px solid ${COLORS.BORDER}`, color:COLORS.TEXT, cursor:'pointer', width:'36px', height:'36px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Plus size={20} />
            </button>
            {showPlusMenu && (
              <div style={{ position:'absolute', top:'44px', left:0, background:'#1a1a1a', border:`1px solid ${COLORS.BORDER}`, borderRadius:'8px', padding:'8px', display:'flex', flexDirection:'column', gap:'4px', zIndex:10, minWidth:'150px', boxShadow:'0 4px 12px rgba(0,0,0,0.5)' }}>
                <button onClick={() => { setActiveModal('product'); setShowPlusMenu(false); }} style={{ background:'transparent', border:'none', color:COLORS.TEXT, padding:'8px 12px', textAlign:'left', cursor:'pointer', borderRadius:'4px' }}>Product</button>
                <button onClick={() => { setActiveModal('category'); setShowPlusMenu(false); }} style={{ background:'transparent', border:'none', color:COLORS.TEXT, padding:'8px 12px', textAlign:'left', cursor:'pointer', borderRadius:'4px' }}>Category</button>
                <button onClick={() => { setActiveModal('tag'); setShowPlusMenu(false); }} style={{ background:'transparent', border:'none', color:COLORS.TEXT, padding:'8px 12px', textAlign:'left', cursor:'pointer', borderRadius:'4px' }}>Tag</button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display:'flex', gap:'15px' }}>
          <button onClick={() => setActiveTab('live')} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer', background: activeTab === 'live' ? 'rgba(255,255,255,0.06)' : 'transparent', color: activeTab === 'live' ? COLORS.ACCENT : COLORS.TEXT }}><PackageOpen size={18}/> Products Live</button>
          <button onClick={() => setActiveTab('history')} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer', background: activeTab === 'history' ? 'rgba(255,255,255,0.06)' : 'transparent', color: activeTab === 'history' ? COLORS.ACCENT : COLORS.TEXT }}><History size={18}/> Sales History</button>
          <button onClick={() => setActiveTab('chart')} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer', background: activeTab === 'chart' ? 'rgba(255,255,255,0.06)' : 'transparent', color: activeTab === 'chart' ? COLORS.ACCENT : COLORS.TEXT }}><BarChart2 size={18}/> Chart</button>
          <button onClick={() => setActiveTab('clause')} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer', background: activeTab === 'clause' ? 'rgba(255,255,255,0.06)' : 'transparent', color: activeTab === 'clause' ? COLORS.ACCENT : COLORS.TEXT }}><FileText size={18}/> Unofficial Clause</button>
          <button onClick={() => setActiveTab('equity')} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer', background: activeTab === 'equity' ? 'rgba(255,255,255,0.06)' : 'transparent', color: activeTab === 'equity' ? COLORS.ACCENT : COLORS.TEXT }}><PieChart size={18}/> Equity Distribution</button>
          <button onClick={() => setActiveTab('theme')} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer', background: activeTab === 'theme' ? 'rgba(255,255,255,0.06)' : 'transparent', color: activeTab === 'theme' ? COLORS.ACCENT : COLORS.TEXT }}>Color Theme</button>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ background:'rgba(255,255,255,0.02)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.05)', padding:'40px', minHeight:'600px', display:'flex', flexDirection:'column' }}>
        {activeTab === 'live' && (
          <div style={{ display:'flex', flexDirection:'column', flex:1 }}>
            <h2 style={{ marginBottom:'30px', fontSize:'24px', display:'flex', alignItems:'center', gap:'12px' }}><PackageOpen size={28}/> Live Listed Products</h2>
            {liveProducts.length === 0 ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', padding:'60px 20px', color:COLORS.TEXT, background:'rgba(0,0,0,0.2)', borderRadius:'12px', minHeight:'400px' }}>
                <PackageOpen size={64} style={{ marginBottom:'24px', opacity:0.18 }} />
                <h3 style={{ fontSize:'24px', marginBottom:'12px', color:COLORS.TEXT }}>No Live Products</h3>
                <p style={{ fontSize:'16px', color:COLORS.TEXT }}>There are no products currently live on the storefront.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.BORDER}`, textAlign: 'left' }}>
                      <th style={{ padding: '12px', color: COLORS.TEXT, fontWeight: 600 }}>Media</th>
                      <th style={{ padding: '12px', color: COLORS.TEXT, fontWeight: 600 }}>Product Name</th>
                      <th style={{ padding: '12px', color: COLORS.TEXT, fontWeight: 600 }}>Stock</th>
                      <th style={{ padding: '12px', color: COLORS.TEXT, fontWeight: 600 }}>Price (CP + Profit)</th>
                      <th style={{ padding: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Tags</th>
                      <th style={{ padding: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveProducts.map(p => (
                      <tr key={p.product_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                            {p.product_media1 && <img src={p.product_media1} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 500 }}>{p.product_name}</td>
                        <td style={{ padding: '12px', color: COLORS.TEXT }}>{p.product_instock}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: '14px', color: COLORS.ACCENT }}>₹{p.product_saleprice}</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>({p.product_costprice} + {p.product_profit})</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {p.product_tag1 && <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>{p.product_tag1}</span>}
                            {p.product_tag2 && <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>{p.product_tag2}</span>}
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button onClick={() => handleDeleteProduct(p.product_id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.4)', cursor: 'pointer', padding: '4px', borderRadius: '4px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#ffffff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}>
                            <X size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ display:'flex', flexDirection:'column', flex:1 }}>
            <h2 style={{ marginBottom:'30px', fontSize:'24px', display:'flex', alignItems:'center', gap:'12px' }}><History size={28}/> Sales History</h2>
            {salesHistory.length === 0 ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', padding:'60px 20px', color:'rgba(255,255,255,0.4)', background:'rgba(0,0,0,0.2)', borderRadius:'12px', minHeight:'400px' }}>
                <History size={64} style={{ marginBottom:'24px', opacity:0.3 }}/>
                <h3 style={{ fontSize:'24px', marginBottom:'12px', color:'rgba(255,255,255,0.7)' }}>No Sales Yet</h3>
                <p style={{ fontSize:'16px' }}>When users purchase products, they will appear here.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                      <th style={{ padding: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Sale ID</th>
                      <th style={{ padding: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Product Name</th>
                      <th style={{ padding: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Cost Price</th>
                      <th style={{ padding: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Sale Price</th>
                      <th style={{ padding: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesHistory.map(sale => {
                      const cp = sale.product_costprice || 0;
                      const sp = sale.product_saleprice || 0;
                      const profit = sp - cp;
                      
                      return (
                        <tr key={sale.sale_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sale.sale_id}>
                            {sale.sale_id}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {new Date(sale.ordered_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 500 }}>{sale.product_name}</td>
                          <td style={{ padding: '12px' }}>₹{cp.toFixed(2)}</td>
                          <td style={{ padding: '12px', color: COLORS.ACCENT }}>₹{sp.toFixed(2)}</td>
                          <td style={{ padding: '12px', color: COLORS.ACCENT }}>
                            {profit >= 0 ? '+' : ''}₹{profit.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chart' && (
          <div style={{ display:'flex', flexDirection:'column', flex:1 }}>
            <h2 style={{ marginBottom:'30px', fontSize:'24px', display:'flex', alignItems:'center', gap:'12px' }}><BarChart2 size={28}/> Analytics</h2>
            
            {/* Dropdowns */}
            <div style={{ display:'flex', gap:'20px', marginBottom:'40px', flexWrap:'wrap' }}>
              <div style={{ flex: '1 1 auto', minWidth:'200px' }}>
                <label style={LABEL_STYLE}>Product Type</label>
                <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} style={{ ...INPUT_STYLE, cursor:'pointer', width:'100%' }}>
                  <option value="rui">Rui</option>
                  <option value="charkha">Charkha</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div style={{ flex: '1 1 auto', minWidth:'200px' }}>
                <label style={LABEL_STYLE}>Time Period</label>
                <select value={selectedTimePeriod} onChange={e => setSelectedTimePeriod(e.target.value)} style={{ ...INPUT_STYLE, cursor:'pointer', width:'100%' }}>
                  <option value="today">Today</option>
                  <option value="this week">This Week</option>
                  <option value="this month">This Month</option>
                  <option value="3 months">3 Months</option>
                  <option value="6 months">6 Months</option>
                  <option value="1 year">1 Year</option>
                </select>
              </div>
            </div>

            {/* Charts Grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'40px', flex:1 }}>
              {/* Products Sold Chart */}
              <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:'12px', border:`1px solid ${COLORS.BORDER}`, padding:'24px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                  <h3 style={{ margin:0, fontSize:'18px', color:COLORS.TEXT }}>No. of Products Sold</h3>
                  <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                    <label style={{ fontSize:'12px', color:COLORS.TEXT }}>Min:</label>
                    <input type="number" value={productsSoldMin} onChange={e => setProductsSoldMin(e.target.value)} style={{ ...INPUT_STYLE, width:'80px', padding:'6px 10px', fontSize:'12px' }}/>
                    <label style={{ fontSize:'12px', color:COLORS.TEXT }}>Max:</label>
                    <input type="number" value={productsSoldMax} onChange={e => setProductsSoldMax(e.target.value)} style={{ ...INPUT_STYLE, width:'80px', padding:'6px 10px', fontSize:'12px' }}/>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/>
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)"/>
                    <YAxis stroke="rgba(255,255,255,0.4)" domain={[parseInt(productsSoldMin) || 0, parseInt(productsSoldMax) || 100]}/>
                    <Tooltip 
                      contentStyle={{ background:'rgba(0,0,0,0.8)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px' }}
                      labelStyle={{ color:COLORS.ACCENT }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="productsSold" stroke={COLORS.ACCENT} strokeWidth={2} dot={{ fill:COLORS.ACCENT, r:4 }} activeDot={{ r:6 }}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Total Profit Chart */}
              <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.08)', padding:'24px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                  <h3 style={{ margin:0, fontSize:'18px', color:COLORS.TEXT }}>Total Profit</h3>
                  <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                    <label style={{ fontSize:'12px', color:COLORS.TEXT }}>Min:</label>
                    <input type="number" value={totalProfitMin} onChange={e => setTotalProfitMin(e.target.value)} style={{ ...INPUT_STYLE, width:'80px', padding:'6px 10px', fontSize:'12px' }}/>
                    <label style={{ fontSize:'12px', color:COLORS.TEXT }}>Max:</label>
                    <input type="number" value={totalProfitMax} onChange={e => setTotalProfitMax(e.target.value)} style={{ ...INPUT_STYLE, width:'80px', padding:'6px 10px', fontSize:'12px' }}/>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/>
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)"/>
                    <YAxis stroke="rgba(255,255,255,0.4)" domain={[parseInt(totalProfitMin) || 0, parseInt(totalProfitMax) || 10000]}/>
                    <Tooltip 
                      contentStyle={{ background:'rgba(0,0,0,0.8)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px' }}
                      labelStyle={{ color:COLORS.ACCENT }}
                      formatter={(value) => `₹${value.toFixed(0)}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="totalProfit" stroke={COLORS.ACCENT} strokeWidth={2} dot={{ fill:COLORS.ACCENT, r:4 }} activeDot={{ r:6 }}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Total Sale Chart */}
              <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.08)', padding:'24px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                  <h3 style={{ margin:0, fontSize:'18px', color:COLORS.TEXT }}>Total Sale</h3>
                  <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                    <label style={{ fontSize:'12px', color:'rgba(255,255,255,0.6)' }}>Min:</label>
                    <input type="number" value={totalSaleMin} onChange={e => setTotalSaleMin(e.target.value)} style={{ ...INPUT_STYLE, width:'80px', padding:'6px 10px', fontSize:'12px' }}/>
                    <label style={{ fontSize:'12px', color:'rgba(255,255,255,0.6)' }}>Max:</label>
                    <input type="number" value={totalSaleMax} onChange={e => setTotalSaleMax(e.target.value)} style={{ ...INPUT_STYLE, width:'80px', padding:'6px 10px', fontSize:'12px' }}/>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/>
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)"/>
                    <YAxis stroke="rgba(255,255,255,0.4)" domain={[parseInt(totalSaleMin) || 0, parseInt(totalSaleMax) || 50000]}/>
                    <Tooltip 
                      contentStyle={{ background:'rgba(0,0,0,0.8)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px' }}
                      labelStyle={{ color:COLORS.ACCENT }}
                      formatter={(value) => `₹${value.toFixed(0)}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="totalSale" stroke={COLORS.ACCENT} strokeWidth={2} dot={{ fill:COLORS.ACCENT, r:4 }} activeDot={{ r:6 }}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'equity' && (
          <div style={{ display:'flex', flexDirection:'column', flex:1 }}>
            <h2 style={{ marginBottom:'40px', fontSize:'24px', display:'flex', alignItems:'center', gap:'12px' }}><PieChart size={28}/> Equity Distribution</h2>
            
            {/* Earnings Section */}
            <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.08)', padding:'24px', marginBottom:'30px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                <h3 style={{ margin:0, fontSize:'18px', color:COLORS.TEXT }}>Earnings</h3>
              </div>
              
              {/* Total Earnings */}
              <div style={{ padding:'20px', background:'transparent', borderRadius:'8px', border:`1px solid ${COLORS.BORDER}`, marginBottom:'20px' }}>
                <p style={{ margin:'0 0 8px 0', fontSize:'14px', color:COLORS.TEXT }}>Total Earnings (Profit)</p>
                <p style={{ margin:0, fontSize:'32px', fontWeight:'bold', color:COLORS.ACCENT }}>₹{totalProfit.toFixed(2)}</p>
              </div>

              {/* Tax Toggle Section */}
              <div style={{ marginTop:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px', padding:'12px 16px', background:'transparent', borderRadius:'10px', border:`1px solid ${COLORS.BORDER}` }}>
                  <span style={{ fontSize:'13px', color:COLORS.TEXT, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Include Tax</span>
                  <button onClick={() => setTaxEnabled(!taxEnabled)} style={{ background:'transparent', border:'none', cursor:'pointer', color: taxEnabled ? COLORS.ACCENT : 'rgba(255,255,255,0.18)', display:'flex', padding:0 }}>
                    {taxEnabled ? <ToggleRight size={36}/> : <ToggleLeft size={36}/>}
                  </button>
                  <span style={{ fontSize:'13px', color: taxEnabled ? COLORS.ACCENT : 'rgba(255,255,255,0.28)' }}>{taxEnabled ? 'ON' : 'OFF'}</span>
                </div>

                {taxEnabled && (
                  <div style={{ padding:'16px', background:'transparent', borderRadius:'8px', border:`1px solid ${COLORS.BORDER}` }}>
                    <label style={LABEL_STYLE}>Tax Percentage (%)</label>
                    <input type="number" value={taxPercentage} onChange={e => setTaxPercentage(e.target.value)} placeholder="20" style={{ ...INPUT_STYLE, marginBottom:'16px' }}/>
                    
                    {/* Tax Calculation Display */}
                    <div style={{ padding:'12px', background:'rgba(0,0,0,0.3)', borderRadius:'6px', marginTop:'12px' }}>
                      <p style={{ margin:'0 0 8px 0', fontSize:'12px', color:COLORS.TEXT }}>Calculation:</p>
                      <p style={{ margin:0, fontSize:'14px', color:COLORS.ACCENT }}>
                        ₹{totalProfit.toFixed(2)} - ₹{(totalProfit * (parseFloat(taxPercentage) || 0) / 100).toFixed(2)} (tax) = <span style={{ color:COLORS.ACCENT, fontWeight:'bold' }}>₹{(totalProfit - totalProfit * (parseFloat(taxPercentage) || 0) / 100).toFixed(2)}</span> (left)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Distribution Tiles */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
              {/* Developer's Cut */}
              <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:'12px', border:`1px solid ${COLORS.BORDER}`, padding:'24px' }}>
                <h3 style={{ marginBottom:'16px', fontSize:'18px', color:COLORS.TEXT }}>Developer's Cut</h3>
                <div style={{ padding:'16px', background:'transparent', borderRadius:'8px', border:`1px solid ${COLORS.BORDER}`, marginBottom:'16px' }}>
                  <p style={{ margin:'0 0 8px 0', fontSize:'12px', color:COLORS.TEXT }}>15% of Earnings After Tax</p>
                  <p style={{ margin:0, fontSize:'28px', fontWeight:'bold', color:COLORS.ACCENT }}>
                    ₹{(
                      taxEnabled 
                        ? (totalProfit - totalProfit * (parseFloat(taxPercentage) || 0) / 100) * 0.15
                        : totalProfit * 0.15
                    ).toFixed(2)}
                  </p>
                </div>
                <button style={{ width:'100%', padding:'10px 16px', background:COLORS.BUTTON_BG, border:`1px solid ${COLORS.BORDER}`, color:COLORS.TEXT, borderRadius:'6px', cursor:'pointer', fontSize:'13px', fontWeight:600 }} onClick={() => { setExploreLiquidShare('developer'); setLiquidSharePercentage(''); setLiquidSharePeriod('total'); }}>Explore Liquid Share</button>
              </div>

              {/* Dev's Cut */}
              <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.08)', padding:'24px' }}>
                <h3 style={{ marginBottom:'16px', fontSize:'18px', color:COLORS.TEXT }}>Designer's Cut</h3>
                <div style={{ padding:'16px', background:'transparent', borderRadius:'8px', border:`1px solid ${COLORS.BORDER}`, marginBottom:'16px' }}>
                  <p style={{ margin:'0 0 8px 0', fontSize:'12px', color:COLORS.TEXT }}>5% of Earnings After Tax</p>
                  <p style={{ margin:0, fontSize:'28px', fontWeight:'bold', color:COLORS.ACCENT }}>
                    ₹{(
                      taxEnabled 
                        ? (totalProfit - totalProfit * (parseFloat(taxPercentage) || 0) / 100) * 0.05
                        : totalProfit * 0.05
                    ).toFixed(2)}
                  </p>
                </div>
                <button style={{ width:'100%', padding:'10px 16px', background:COLORS.BUTTON_BG, border:`1px solid ${COLORS.BORDER}`, color:COLORS.TEXT, borderRadius:'6px', cursor:'pointer', fontSize:'13px', fontWeight:600 }} onClick={() => { setExploreLiquidShare('designer'); setLiquidSharePercentage(''); setLiquidSharePeriod('total'); }}>Explore Liquid Share</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'theme' && (
          <div style={{ display:'flex', flexDirection:'column', flex:1 }}>
            <h2 style={{ marginBottom:'30px', fontSize:'24px', display:'flex', alignItems:'center', gap:'12px' }}>Color Theme</h2>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>
              {/* Premium Palette */}
              <div style={{ background:'rgba(0,0,0,0.28)', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.06)', padding:'20px' }}>
                <h3 style={{ margin:'0 0 16px 0', fontSize:'16px', color:COLORS.TEXT }}>Premium Palette</h3>

                <div style={FIELD}>
                  <label style={LABEL_STYLE}>Primary Color</label>
                  <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                    <input value={premiumPrimary} onChange={e => setPremiumPrimary(e.target.value)} placeholder="#xxxxxx or color name" style={{ ...INPUT_STYLE, flex:1 }} />
                    <div style={{ width:48, height:32, borderRadius:6, border:'1px dashed rgba(255,255,255,0.12)', background: premiumPrimary || 'transparent' }} />
                  </div>
                </div>

                <div style={FIELD}>
                  <label style={LABEL_STYLE}>Secondary Color</label>
                  <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                    <input value={premiumSecondary} onChange={e => setPremiumSecondary(e.target.value)} placeholder="#xxxxxx or color name" style={{ ...INPUT_STYLE, flex:1 }} />
                    <div style={{ width:48, height:32, borderRadius:6, border:'1px dashed rgba(255,255,255,0.12)', background: premiumSecondary || 'transparent' }} />
                  </div>
                </div>

                <div style={FIELD}>
                  <label style={LABEL_STYLE}>Tertiary Color</label>
                  <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                    <input value={premiumTertiary} onChange={e => setPremiumTertiary(e.target.value)} placeholder="#xxxxxx or color name" style={{ ...INPUT_STYLE, flex:1 }} />
                    <div style={{ width:48, height:32, borderRadius:6, border:'1px dashed rgba(255,255,255,0.12)', background: premiumTertiary || 'transparent' }} />
                  </div>
                </div>

                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:6 }}>
                  <button onClick={() => handleAddPalette('pre_color_pal', premiumPrimary, premiumSecondary, premiumTertiary, () => { setPremiumPrimary(''); setPremiumSecondary(''); setPremiumTertiary(''); }, setPremiumSubmitting)} disabled={premiumSubmitting} style={{ padding:'8px 14px', background: premiumSubmitting ? 'rgba(255,255,255,0.04)' : COLORS.BUTTON_BG, border: 'none', color: COLORS.TEXT, borderRadius:8, cursor: premiumSubmitting ? 'not-allowed' : 'pointer', fontWeight:700 }}>Save Palette</button>
                </div>
              </div>

              {/* Budget Palette */}
              <div style={{ background:'rgba(0,0,0,0.28)', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.06)', padding:'20px' }}>
                <h3 style={{ margin:'0 0 16px 0', fontSize:'16px', color:COLORS.TEXT }}>Budget Palette</h3>

                <div style={FIELD}>
                  <label style={LABEL_STYLE}>Primary Color</label>
                  <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                    <input value={budgetPrimary} onChange={e => setBudgetPrimary(e.target.value)} placeholder="#xxxxxx or color name" style={{ ...INPUT_STYLE, flex:1 }} />
                    <div style={{ width:48, height:32, borderRadius:6, border:'1px dashed rgba(255,255,255,0.12)', background: budgetPrimary || 'transparent' }} />
                  </div>
                </div>

                <div style={FIELD}>
                  <label style={LABEL_STYLE}>Secondary Color</label>
                  <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                    <input value={budgetSecondary} onChange={e => setBudgetSecondary(e.target.value)} placeholder="#xxxxxx or color name" style={{ ...INPUT_STYLE, flex:1 }} />
                    <div style={{ width:48, height:32, borderRadius:6, border:'1px dashed rgba(255,255,255,0.12)', background: budgetSecondary || 'transparent' }} />
                  </div>
                </div>

                <div style={FIELD}>
                  <label style={LABEL_STYLE}>Tertiary Color</label>
                  <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                    <input value={budgetTertiary} onChange={e => setBudgetTertiary(e.target.value)} placeholder="#xxxxxx or color name" style={{ ...INPUT_STYLE, flex:1 }} />
                    <div style={{ width:48, height:32, borderRadius:6, border:'1px dashed rgba(255,255,255,0.12)', background: budgetTertiary || 'transparent' }} />
                  </div>
                </div>

                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:6 }}>
                  <button onClick={() => handleAddPalette('bud_color_pal', budgetPrimary, budgetSecondary, budgetTertiary, () => { setBudgetPrimary(''); setBudgetSecondary(''); setBudgetTertiary(''); }, setBudgetSubmitting)} disabled={budgetSubmitting} style={{ padding:'8px 14px', background: budgetSubmitting ? 'rgba(255,255,255,0.04)' : COLORS.BUTTON_BG, border: 'none', color: COLORS.TEXT, borderRadius:8, cursor: budgetSubmitting ? 'not-allowed' : 'pointer', fontWeight:700 }}>Save Palette</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── EXPLORE LIQUID SHARE MODAL ── */}
      {exploreLiquidShare && (
        <div style={overlayStyle}>
          <div style={{ ...modalBase, maxWidth:'500px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
              <h2 style={{ margin:0 }}>Explore Liquid Share</h2>
              <button onClick={() => setExploreLiquidShare(null)} style={{ background:'transparent', border:'none', color:COLORS.ACCENT, cursor:'pointer' }}><X size={20}/></button>
            </div>

            <div style={FIELD}>
              <label style={LABEL_STYLE}>Share Percentage (%)</label>
              <input 
                type="number" 
                value={liquidSharePercentage} 
                onChange={e => setLiquidSharePercentage(e.target.value)} 
                placeholder="Enter percentage" 
                style={INPUT_STYLE}
              />
            </div>

            <div style={FIELD}>
              <label style={LABEL_STYLE}>Time Period</label>
              <select 
                value={liquidSharePeriod} 
                onChange={e => setLiquidSharePeriod(e.target.value)} 
                style={{ ...INPUT_STYLE, cursor:'pointer' }}
              >
                <option value="today">Today</option>
                <option value="this week">This Week</option>
                <option value="this month">This Month</option>
                <option value="this year">This Year</option>
                <option value="total">Total</option>
              </select>
            </div>

            {/* Results Display */}
            {liquidSharePercentage && (
              <div style={{ padding:'16px', background:'transparent', border:`1px solid ${COLORS.BORDER}`, borderRadius:'8px', marginBottom:'20px' }}>
                <p style={{ margin:'0 0 8px 0', fontSize:'12px', color:COLORS.TEXT }}>Liquid Share Amount for {liquidSharePeriod}:</p>
                <p style={{ margin:0, fontSize:'28px', fontWeight:'bold', color:COLORS.ACCENT }}>
                  ₹{(calculateProfitByPeriod(liquidSharePeriod) * (parseFloat(liquidSharePercentage) || 0) / 100).toFixed(2)}
                </p>
                <p style={{ margin:'8px 0 0 0', fontSize:'11px', color:'rgba(255,255,255,0.28)' }}>
                  {(parseFloat(liquidSharePercentage) || 0).toFixed(1)}% of ₹{calculateProfitByPeriod(liquidSharePeriod).toFixed(2)} ({liquidSharePeriod})
                </p>
              </div>
            )}

            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:'20px' }}>
              <button onClick={() => setExploreLiquidShare(null)} style={{ padding:'10px 16px', background:'transparent', border:`1px solid ${COLORS.BORDER}`, color:COLORS.ACCENT, borderRadius:'6px', cursor:'pointer', fontSize:'14px' }}>Close</button>
              <button style={{ padding:'10px 20px', background:COLORS.BUTTON_BG, border:'none', color:COLORS.TEXT, borderRadius:'6px', cursor:'pointer', fontSize:'14px', fontWeight:'bold' }}>Download Report</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CATEGORY MODAL ── */}
      {activeModal === 'category' && (
        <div style={overlayStyle}>
          <div style={{ ...modalBase, maxWidth:'400px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h2 style={{ margin:0 }}>Add Category</h2>
              <button onClick={() => setActiveModal(null)} style={{ background:'transparent', border:'none', color:COLORS.ACCENT, cursor:'pointer' }}><X size={20}/></button>
            </div>
            <div style={FIELD}><label style={LABEL_STYLE}>cat_id</label><input value={nextCatId} disabled style={{ ...INPUT_STYLE, color:'rgba(255,255,255,0.3)' }}/></div>
            <div style={FIELD}><label style={LABEL_STYLE}>cat_name</label><input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Enter category name" style={INPUT_STYLE}/></div>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button onClick={() => setActiveModal(null)} style={{ padding:'8px 16px', background:'transparent', border:`1px solid ${COLORS.BORDER}`, color:COLORS.ACCENT, borderRadius:'6px', cursor:'pointer' }}>Cancel</button>
              <button onClick={handleAddCategory} style={{ padding:'8px 16px', background:COLORS.BUTTON_BG, border:'none', color:COLORS.TEXT, borderRadius:'6px', cursor:'pointer', fontWeight:'bold' }}>Add Category</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAG MODAL ── */}
      {activeModal === 'tag' && (
        <div style={overlayStyle}>
          <div style={{ ...modalBase, maxWidth:'400px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h2 style={{ margin:0 }}>Add Tag</h2>
              <button onClick={() => setActiveModal(null)} style={{ background:'transparent', border:'none', color:COLORS.ACCENT, cursor:'pointer' }}><X size={20}/></button>
            </div>
            <div style={FIELD}><label style={LABEL_STYLE}>tag_id</label><input value={nextTagId} disabled style={{ ...INPUT_STYLE, color:'rgba(255,255,255,0.3)' }}/></div>
            <div style={FIELD}><label style={LABEL_STYLE}>tag_name</label><input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="Enter tag name" style={INPUT_STYLE}/></div>
            <div style={FIELD}>
              <label style={LABEL_STYLE}>under_catname</label>
              <select value={selectedCatForTag} onChange={e => setSelectedCatForTag(e.target.value)} style={{ ...INPUT_STYLE, cursor:'pointer' }}>
                <option value="">Select a category</option>
                {categories.map(cat => <option key={cat.cat_id} value={cat.cat_name}>{cat.cat_name}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button onClick={() => setActiveModal(null)} style={{ padding:'8px 16px', background:'transparent', border:`1px solid ${COLORS.BORDER}`, color:COLORS.ACCENT, borderRadius:'6px', cursor:'pointer' }}>Cancel</button>
              <button onClick={handleAddTag} style={{ padding:'8px 16px', background:COLORS.BUTTON_BG, border:'none', color:COLORS.TEXT, borderRadius:'6px', cursor:'pointer', fontWeight:'bold' }}>Add Tag</button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCT MODAL ── */}
      {activeModal === 'product' && (
        <div style={overlayStyle}>
          <div style={modalBase}>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'28px' }}>
              <h2 style={{ margin:0, fontSize:'22px' }}>Add Product</h2>
              <button onClick={closeProduct} style={{ background:'transparent', border:'none', color:COLORS.ACCENT, cursor:'pointer' }}><X size={22}/></button>
            </div>

            {/* RUI Toggle */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px', padding:'12px 16px', background:'transparent', borderRadius:'10px', border:`1px solid ${COLORS.BORDER}` }}>
              <span style={{ fontSize:'13px', color:COLORS.TEXT, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>rui?</span>
              <button onClick={() => handleFieldChange('product_rui', !product.product_rui)} style={{ background:'transparent', border:'none', cursor:'pointer', color: product.product_rui ? COLORS.ACCENT : 'rgba(255,255,255,0.3)', display:'flex', padding:0 }}>
                {product.product_rui ? <ToggleRight size={36}/> : <ToggleLeft size={36}/>} 
              </button>
              <span style={{ fontSize:'13px', color: product.product_rui ? COLORS.ACCENT : 'rgba(255,255,255,0.28)' }}>{product.product_rui ? 'ON' : 'OFF'}</span>
            </div>

            {/* Two-column grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 24px' }}>
              <div style={FIELD}>
                <label style={LABEL_STYLE}>Product Name</label>
                <input value={product.product_name} onChange={e => handleFieldChange('product_name', e.target.value)} placeholder="e.g. Leather Tote Bag" style={INPUT_STYLE}/>
              </div>
              <div style={FIELD}>
                <label style={LABEL_STYLE}>Stock (product_instock)</label>
                <input type="number" min="0" value={product.product_instock} onChange={e => handleFieldChange('product_instock', e.target.value)} placeholder="0" style={INPUT_STYLE}/>
              </div>
              <div style={FIELD}>
                <label style={LABEL_STYLE}>Cost Price — CP</label>
                <input type="number" min="0" step="0.01" value={product.product_costprice} onChange={e => handleFieldChange('product_costprice', e.target.value)} placeholder="0.00" style={INPUT_STYLE}/>
              </div>
              <div style={FIELD}>
                <label style={LABEL_STYLE}>Profit</label>
                <input type="number" min="0" step="0.01" value={product.product_profit} onChange={e => handleFieldChange('product_profit', e.target.value)} placeholder="0.00" style={INPUT_STYLE}/>
              </div>
              <div style={FIELD}>
                <label style={LABEL_STYLE}>Sale Price (auto = CP + Profit)</label>
                <input value={`₹ ${product.product_saleprice}`} disabled style={{ ...INPUT_STYLE, background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.35)', cursor:'not-allowed' }}/>
              </div>
              <div style={FIELD}>
                <label style={LABEL_STYLE}>Offer Price <span style={{ color:'rgba(255,255,255,0.35)', fontWeight:400 }}>(shown striked-through)</span></label>
                <input type="number" min="0" step="0.01" value={product.product_offerprice} onChange={e => handleFieldChange('product_offerprice', e.target.value)} placeholder="0.00" style={INPUT_STYLE}/>
              </div>
            </div>

            {/* Images UI removed */}

            {/* Tags grouped by category */}
            <div style={{ marginBottom:'28px' }}>
              <label style={{ ...LABEL_STYLE, marginBottom:'14px' }}>Product Tags</label>
              {tagsByCategory.length === 0 ? (
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'13px' }}>No tags found. Add categories &amp; tags first.</p>
              ) : (
                tagsByCategory.map(({ cat, tags: catTags }) => (
                  <div key={cat.cat_id} style={{ marginBottom:'16px' }}>
                    <p style={{ fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'8px' }}>{cat.cat_name}</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                      {catTags.map(tag => {
                        const sel = product.product_tags.includes(tag.tag_id);
                        return (
                          <button key={tag.tag_id} onClick={() => toggleTag(tag.tag_id)} style={{ padding:'5px 14px', borderRadius:'999px', fontSize:'13px', cursor:'pointer', border: sel ? `1px solid ${COLORS.ACCENT}` : `1px solid ${COLORS.BORDER}`, background: sel ? 'rgba(255,255,255,0.04)' : 'transparent', color: sel ? COLORS.ACCENT : COLORS.TEXT, transition:'all 0.15s' }}>
                            {tag.tag_name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Status message */}
            {submitStatus && (
              <div style={{ marginBottom:'16px', padding:'10px 14px', background:'transparent', border:`1px solid ${COLORS.BORDER}`, borderRadius:'8px', color:COLORS.ACCENT, fontSize:'13px' }}>
                {submitStatus}
              </div>
            )}

            {/* Actions */}
            <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end', borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:'24px' }}>
              <button onClick={closeProduct} disabled={uploading} style={{ padding:'10px 20px', background:'transparent', border:`1px solid ${COLORS.BORDER}`, color:COLORS.ACCENT, borderRadius:'8px', cursor:'pointer', fontSize:'14px' }}>Cancel</button>
              <button onClick={() => handleSubmitProduct('draft')} disabled={uploading} style={{ padding:'10px 20px', background:COLORS.BUTTON_BG, border:`1px solid ${COLORS.BORDER}`, color:COLORS.TEXT, borderRadius:'8px', cursor:'pointer', fontSize:'14px' }}>Save Draft</button>
              <button onClick={() => handleSubmitProduct('live')} disabled={uploading} style={{ padding:'10px 24px', background:COLORS.BUTTON_BG, border:'none', color:COLORS.TEXT, borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:700, opacity: uploading ? 0.6 : 1 }}>
                {uploading ? 'Saving...' : '✦ Send Live'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
