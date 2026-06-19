import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

const serviceTypes = [
  { value: 'hotel', label: 'فنادق', icon: 'building', api: '/hotels' },
  { value: 'package', label: 'باقات سياحية', icon: 'box-seam', api: '/tour-packages' },
  { value: 'guide', label: 'مرشدين', icon: 'person-badge', api: '/guides' },
];

const hotelFeatures = [
  { key: 'name', label: 'الاسم', render: (v) => v },
  { key: 'price', label: 'السعر', render: (v, item) => (v != null ? `${v} ر.س` : '-'), highlight: 'min' },
  { key: 'rating', label: 'التقييم', render: (v) => (v != null ? `${v} / 5` : '-'), highlight: 'max' },
  { key: 'location', label: 'الموقع', render: (v) => v || '-' },
  { key: 'amenities', label: 'وسائل الراحة', render: (v) => Array.isArray(v) ? v.join(', ') : v || '-' },
  { key: 'room_types', label: 'أنواع الغرف', render: (v) => Array.isArray(v) ? v.join(', ') : v || '-' },
];

const packageFeatures = [
  { key: 'name', label: 'الاسم', render: (v) => v },
  { key: 'price', label: 'السعر', render: (v, item) => (v != null ? `${v} ر.س` : '-'), highlight: 'min' },
  { key: 'duration', label: 'المدة', render: (v) => v ? `${v} أيام` : '-' },
  { key: 'includes', label: 'يشمل', render: (v) => Array.isArray(v) ? v.join(', ') : v || '-' },
  { key: 'excludes', label: 'لا يشمل', render: (v) => Array.isArray(v) ? v.join(', ') : v || '-' },
];

const guideFeatures = [
  { key: 'name', label: 'الاسم', render: (v) => v },
  { key: 'rating', label: 'التقييم', render: (v) => (v != null ? `${v} / 5` : '-'), highlight: 'max' },
  { key: 'languages', label: 'اللغات', render: (v) => Array.isArray(v) ? v.join(', ') : v || '-' },
  { key: 'specializations', label: 'التخصصات', render: (v) => Array.isArray(v) ? v.join(', ') : v || '-' },
  { key: 'daily_rate', label: 'السعر اليومي', render: (v) => (v != null ? `${v} ر.س` : '-'), highlight: 'min' },
];

const featureMap = { hotel: hotelFeatures, package: packageFeatures, guide: guideFeatures };

export default function Compare() {
  const [serviceType, setServiceType] = useState('hotel');
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const type = serviceTypes.find(s => s.value === serviceType);
      const res = await api.get(type.api, { params: { limit: 100 } });
      setItems(res.data.rows || res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); setSelectedItems([]); }, [serviceType]);

  const addItem = (item) => {
    if (selectedItems.find(i => i.id === item.id)) {
      Swal.fire('مكرر', 'هذا العنصر مضاف بالفعل للمقارنة', 'info');
      return;
    }
    if (selectedItems.length >= 5) {
      Swal.fire('تنبيه', 'يمكن مقارنة 5 عناصر كحد أقصى', 'warning');
      return;
    }
    setSelectedItems(prev => [...prev, item]);
  };

  const removeItem = (id) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
  };

  const features = featureMap[serviceType] || [];

  const getHighlightValue = (feature, items) => {
    const numeric = items.map(item => Number(item[feature.key])).filter(v => !isNaN(v));
    if (numeric.length === 0) return null;
    if (feature.highlight === 'max') return Math.max(...numeric);
    if (feature.highlight === 'min') return Math.min(...numeric);
    return null;
  };

  const highlightValue = getHighlightValue;

  const filteredItems = items.filter(i => {
    const name = (i.name || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0"><i className="bi bi-arrows-left-right me-2"></i>مقارنة الخدمات</h5>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label">نوع الخدمة</label>
              <div className="d-flex gap-2">
                {serviceTypes.map(t => (
                  <button key={t.value} className={`btn ${serviceType === t.value ? 'btn-primary' : 'btn-outline-primary'} btn-sm flex-fill`}
                    onClick={() => setServiceType(t.value)}>
                    <i className={`bi bi-${t.icon} me-1`}></i>{t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label">بحث</label>
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input className="form-control" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => setSelectedItems([])}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedItems.length === 0 ? (
        <div className="card mb-3">
          <div className="card-body text-center py-4">
            <i className="bi bi-arrows-left-right text-muted" style={{ fontSize: '3rem' }}></i>
            <p className="text-muted mt-2">اختر الخدمات التي تريد مقارنتها من القائمة أدناه</p>
          </div>
        </div>
      ) : (
        <div className="card mb-3">
          <div className="table-responsive">
            <table className="table table-bordered mb-0">
              <thead>
                <tr>
                  <th style={{ minWidth: '150px' }}>الميزة</th>
                  {selectedItems.map(item => (
                    <th key={item.id} className="text-center" style={{ minWidth: '180px' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{item.name}</span>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeItem(item.id)} title="إزالة"><i className="bi bi-x-lg"></i></button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map(feat => {
                  const hlVal = feat.highlight ? highlightValue(feat, selectedItems) : null;
                  return (
                    <tr key={feat.key}>
                      <td className="fw-semibold">{feat.label}</td>
                      {selectedItems.map(item => {
                        const val = feat.render(item[feat.key], item);
                        const isHighlight = hlVal !== null && Number(item[feat.key]) === hlVal;
                        return (
                          <td key={item.id} className={`text-center ${isHighlight ? 'table-success fw-bold' : ''}`}>
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span className="fw-semibold"><i className="bi bi-search me-1"></i>اختر عناصر للمقارنة</span>
          {selectedItems.length > 0 && <span className="badge bg-primary">{selectedItems.length} / 5</span>}
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-primary"></div></div>
          ) : (
            <div className="row g-2">
              {filteredItems.map(item => (
                <div className="col-md-4 col-lg-3" key={item.id}>
                  <div className={`card h-100 border ${selectedItems.find(i => i.id === item.id) ? 'border-primary bg-primary bg-opacity-10' : ''}`}>
                    <div className="card-body p-2 d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-semibold small">{item.name}</div>
                        <small className="text-muted">
                          {item.price != null && `${item.price} ر.س`}
                          {item.rating != null && ` - ${item.rating}/5`}
                          {item.daily_rate != null && `${item.daily_rate} ر.س/يوم`}
                        </small>
                      </div>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => addItem(item)}
                        disabled={!!selectedItems.find(i => i.id === item.id)}>
                        <i className="bi bi-plus-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && <div className="col-12 text-center text-muted">لا توجد نتائج</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
