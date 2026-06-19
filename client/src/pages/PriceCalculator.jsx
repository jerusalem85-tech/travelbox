import React, { useState } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const PriceCalculator = () => {
  const [serviceType, setServiceType] = useState('flight');
  const [basePrice, setBasePrice] = useState('');
  const [persons, setPersons] = useState(1);
  const [days, setDays] = useState(1);
  const [addons, setAddons] = useState([]);
  const [result, setResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const addAddon = () => setAddons([...addons, { name: '', price: '' }]);
  const removeAddon = (idx) => setAddons(addons.filter((_, i) => i !== idx));
  const updateAddon = (idx, field, value) => {
    const updated = [...addons];
    updated[idx][field] = value;
    setAddons(updated);
  };

  const handleCalculate = async () => {
    if (!basePrice || basePrice <= 0) {
      Swal.fire('تنبيه', 'أدخل السعر الأساسي', 'warning');
      return;
    }
    setCalculating(true);
    try {
      const validAddons = addons.filter(a => a.name.trim() && a.price);
      const res = await api.post('/price-calculator/calculate', {
        service_type: serviceType,
        base_price: Number(basePrice),
        persons: Number(persons),
        days: Number(days),
        addons: validAddons.map(a => ({ name: a.name, price: Number(a.price) }))
      });
      setResult(res.data);
    } catch {
      Swal.fire('خطأ', 'فشل عملية الحساب', 'error');
    } finally {
      setCalculating(false);
    }
  };

  const serviceLabels = {
    flight: 'رحلة طيران', hotel: 'فندق', package: 'باقة سياحية',
    visa: 'تأشيرة', transfer: 'مشوار', insurance: 'تأمين'
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0"><i className="bi bi-calculator me-2"></i>حاسبة الأسعار</h4>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card mb-4">
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">نوع الخدمة</label>
                <select className="form-select" value={serviceType} onChange={e => setServiceType(e.target.value)}>
                  {Object.entries(serviceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">السعر الأساسي</label>
                <input type="number" className="form-control" value={basePrice} onChange={e => setBasePrice(e.target.value)} min="0" />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">عدد الأشخاص</label>
                  <input type="number" className="form-control" value={persons} onChange={e => setPersons(Math.min(20, Math.max(1, Number(e.target.value))))} min="1" max="20" />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">عدد الأيام</label>
                  <input type="number" className="form-control" value={days} onChange={e => setDays(Math.min(30, Math.max(1, Number(e.target.value))))} min="1" max="30" />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">الخدمات الإضافية</label>
                {addons.map((a, idx) => (
                  <div key={idx} className="d-flex gap-2 mb-2">
                    <input type="text" className="form-control" placeholder="اسم الخدمة" value={a.name} onChange={e => updateAddon(idx, 'name', e.target.value)} />
                    <input type="number" className="form-control" placeholder="السعر" value={a.price} onChange={e => updateAddon(idx, 'price', e.target.value)} min="0" style={{ maxWidth: 150 }} />
                    <button className="btn btn-outline-danger" onClick={() => removeAddon(idx)}><i className="bi bi-x-lg"></i></button>
                  </div>
                ))}
                <button className="btn btn-outline-primary btn-sm" onClick={addAddon}>
                  <i className="bi bi-plus-lg me-1"></i>إضافة خدمة إضافية
                </button>
              </div>

              <button className="btn btn-primary w-100" onClick={handleCalculate} disabled={calculating}>
                {calculating ? <><span className="spinner-border spinner-border-sm me-1"></span>جاري الحساب...</> : <><i className="bi bi-calculator me-1"></i>حساب</>}
              </button>
            </div>
          </div>

          {result && (
            <div className="card">
              <div className="card-body text-center">
                <h5 className="text-muted mb-1">السعر الإجمالي</h5>
                <h2 className="text-primary fw-bold mb-3">{result.total_price?.toLocaleString() || result.totalPrice?.toLocaleString()}</h2>
                <hr />
                <ul className="list-unstyled mb-3 text-start">
                  {result.breakdown && result.breakdown.map((b, i) => (
                    <li key={i} className="d-flex justify-content-between py-1">
                      <span>{b.label}</span>
                      <span className="fw-bold">{b.amount?.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
                <div className="alert alert-info mb-0">
                  <strong>التكلفة لكل شخص: </strong>
                  {result.per_person_cost?.toLocaleString() || result.perPersonCost?.toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceCalculator;
