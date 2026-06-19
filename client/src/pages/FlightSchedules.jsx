import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

const daysOfWeek = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const dayKeys = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function FlightSchedules() {
  const [data, setData] = useState({ rows: [], total: 0, page: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [airlineFilter, setAirlineFilter] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [airlines, setAirlines] = useState([]);
  const [airports, setAirports] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    airline_id: '', flight_number: '', origin_airport_id: '', destination_airport_id: '',
    departure_time: '', arrival_time: '', days_of_week: [],
    price: '', currency: 'SAR', notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    const params = { page, limit: 20 };
    if (search) params.flight_number = search;
    if (airlineFilter) params.airline_id = airlineFilter;
    if (originFilter) params.origin_airport_id = originFilter;
    if (destFilter) params.destination_airport_id = destFilter;
    api.get('/flight-schedules', { params }).then(res => setData(res.data));
  };

  const loadOptions = () => {
    api.get('/flight-schedules/airlines').then(res => setAirlines(res.data || [])).catch(() => {});
    api.get('/flight-schedules/airports').then(res => setAirports(res.data || [])).catch(() => {});
  };

  useEffect(() => { load(); loadOptions(); }, [page]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); load(); }, 300); return () => clearTimeout(t); }, [search, airlineFilter, originFilter, destFilter]);

  const resetForm = () => {
    setFormData({
      airline_id: '', flight_number: '', origin_airport_id: '', destination_airport_id: '',
      departure_time: '', arrival_time: '', days_of_week: [],
      price: '', currency: 'SAR', notes: ''
    });
    setEditItem(null);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      airline_id: item.airline_id || '',
      flight_number: item.flight_number || '',
      origin_airport_id: item.origin_airport_id || '',
      destination_airport_id: item.destination_airport_id || '',
      departure_time: item.departure_time || '',
      arrival_time: item.arrival_time || '',
      days_of_week: item.days_of_week || [],
      price: item.price || '',
      currency: item.currency || 'SAR',
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.flight_number.trim() || !formData.airline_id) {
      Swal.fire('تنبيه', 'أدخل رقم الرحلة واختر شركة الطيران', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...formData, price: formData.price ? Number(formData.price) : null };
      if (editItem) {
        await api.put(`/flight-schedules/${editItem.id}`, payload);
        Swal.fire('تم التحديث', 'تم تحديث جدول الرحلة', 'success');
      } else {
        await api.post('/flight-schedules', payload);
        Swal.fire('تم الإضافة', 'تم إضافة جدول الرحلة', 'success');
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, fn) => {
    Swal.fire({
      title: 'تأكيد الحذف', text: `سيتم حذف الرحلة: ${fn}`, icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/flight-schedules/${id}`).then(() => load());
    });
  };

  const toggleDay = (key) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(key)
        ? prev.days_of_week.filter(d => d !== key)
        : [...prev.days_of_week, key]
    }));
  };

  const getAirportLabel = (id) => {
    const a = airports.find(x => Number(x.id) === Number(id));
    return a ? `${a.code} - ${a.city || a.name}` : '-';
  };

  const getAirlineName = (id) => {
    const a = airlines.find(x => Number(x.id) === Number(id));
    return a?.name || '-';
  };

  const formatDays = (days) => {
    if (!days || days.length === 0) return '-';
    return days.map(d => {
      const idx = dayKeys.indexOf(d);
      return idx >= 0 ? daysOfWeek[idx] : d;
    }).join('، ');
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0">جداول الرحلات</h5>
        <button className="btn btn-primary" onClick={() => { resetForm(); loadOptions(); setShowModal(true); }}>
          <i className="bi bi-plus-lg"></i> رحلة جديدة
        </button>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input className="form-control" placeholder="رقم الرحلة..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={airlineFilter} onChange={e => setAirlineFilter(e.target.value)}>
                <option value="">جميع شركات الطيران</option>
                {airlines.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={originFilter} onChange={e => setOriginFilter(e.target.value)}>
                <option value="">جميع مطارات المغادرة</option>
                {airports.map(a => <option key={a.id} value={a.id}>{a.code} - {a.city || a.name}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={destFilter} onChange={e => setDestFilter(e.target.value)}>
                <option value="">جميع مطارات الوصول</option>
                {airports.map(a => <option key={a.id} value={a.id}>{a.code} - {a.city || a.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr><th>رقم الرحلة</th><th>شركة الطيران</th><th>مطار المغادرة</th><th>مطار الوصول</th><th>وقت المغادرة</th><th>وقت الوصول</th><th>أيام التشغيل</th><th>السعر</th><th></th></tr>
            </thead>
            <tbody>
              {data.rows.map(r => (
                <tr key={r.id}>
                  <td><span className="badge bg-dark">{r.flight_number}</span></td>
                  <td>{r.airline_name || getAirlineName(r.airline_id)}</td>
                  <td>{getAirportLabel(r.origin_airport_id)}</td>
                  <td>{getAirportLabel(r.destination_airport_id)}</td>
                  <td dir="ltr">{r.departure_time || '-'}</td>
                  <td dir="ltr">{r.arrival_time || '-'}</td>
                  <td style={{ maxWidth: 150 }} className="text-truncate">{formatDays(r.days_of_week)}</td>
                  <td className={r.price ? 'fw-bold' : ''}>{r.price ? Number(r.price).toLocaleString() + ' ' + (r.currency || '') : '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => { loadOptions(); openEdit(r); }}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id, r.flight_number)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {data.rows.length === 0 && (
                <tr><td colSpan="9" className="text-center text-muted py-4">لا توجد رحلات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {data.total > 20 && (
        <nav className="mt-3">
          <ul className="pagination justify-content-center">
            {Array.from({ length: Math.ceil(data.total / 20) }, (_, i) => i + 1).map(p => (
              <li key={p} className={`page-item ${p === data.page ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setPage(p)}>{p}</button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-calendar-week me-2"></i>{editItem ? 'تعديل الرحلة' : 'إضافة رحلة جديدة'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">شركة الطيران <span className="text-danger">*</span></label>
                      <select className="form-select" name="airline_id" value={formData.airline_id} onChange={e => setFormData({ ...formData, airline_id: e.target.value })} required>
                        <option value="">اختر الشركة</option>
                        {airlines.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">رقم الرحلة <span className="text-danger">*</span></label>
                      <input className="form-control" name="flight_number" value={formData.flight_number} onChange={e => setFormData({ ...formData, flight_number: e.target.value })} required />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">مطار المغادرة</label>
                      <select className="form-select" name="origin_airport_id" value={formData.origin_airport_id} onChange={e => setFormData({ ...formData, origin_airport_id: e.target.value })}>
                        <option value="">اختر المطار</option>
                        {airports.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name} ({a.city})</option>)}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">مطار الوصول</label>
                      <select className="form-select" name="destination_airport_id" value={formData.destination_airport_id} onChange={e => setFormData({ ...formData, destination_airport_id: e.target.value })}>
                        <option value="">اختر المطار</option>
                        {airports.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name} ({a.city})</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">وقت المغادرة</label>
                      <input type="time" className="form-control" name="departure_time" value={formData.departure_time} onChange={e => setFormData({ ...formData, departure_time: e.target.value })} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">وقت الوصول</label>
                      <input type="time" className="form-control" name="arrival_time" value={formData.arrival_time} onChange={e => setFormData({ ...formData, arrival_time: e.target.value })} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">أيام التشغيل</label>
                    <div className="d-flex flex-wrap gap-2">
                      {dayKeys.map((key, i) => (
                        <div className="form-check" key={key}>
                          <input className="form-check-input" type="checkbox" id={`day_${key}`} checked={formData.days_of_week.includes(key)} onChange={() => toggleDay(key)} />
                          <label className="form-check-label" htmlFor={`day_${key}`}>{daysOfWeek[i]}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">السعر</label>
                      <input type="number" className="form-control" name="price" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} min="0" step="0.01" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">العملة</label>
                      <select className="form-select" name="currency" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                        <option value="SAR">ريال سعودي</option>
                        <option value="AED">درهم إماراتي</option>
                        <option value="USD">دولار أمريكي</option>
                        <option value="EUR">يورو</option>
                        <option value="EGP">جنيه مصري</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">ملاحظات</label>
                    <textarea className="form-control" name="notes" rows="2" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span> جاري الحفظ...</> : <><i className="bi bi-check-lg me-1"></i> حفظ</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
