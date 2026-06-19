import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '', booking_id: '', pickup_location: '', dropoff_location: '',
    transfer_date: '', transfer_time: '', vehicle_id: '', passenger_count: '',
    price: '', status: 'pending', notes: ''
  });

  const load = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/transfers', { params });
      setTransfers(res.data.rows || res.data || []);
    } catch { Swal.fire('خطأ', 'فشل تحميل التحويلات', 'error'); }
  };

  const loadSelectData = async () => {
    try {
      const [cRes, vRes] = await Promise.all([
        api.get('/transfers/customers'),
        api.get('/transfers/vehicles')
      ]);
      setCustomers(cRes.data.rows || cRes.data || []);
      setVehicles(vRes.data.rows || vRes.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, [search, dateFilter, statusFilter]);
  useEffect(() => { loadSelectData(); }, []);

  const resetForm = () => {
    setFormData({
      customer_id: '', booking_id: '', pickup_location: '', dropoff_location: '',
      transfer_date: '', transfer_time: '', vehicle_id: '', passenger_count: '',
      price: '', status: 'pending', notes: ''
    });
    setEditingId(null);
  };

  const openEdit = (item) => {
    setFormData({
      customer_id: item.customer_id || '',
      booking_id: item.booking_id || '',
      pickup_location: item.pickup_location || '',
      dropoff_location: item.dropoff_location || '',
      transfer_date: item.transfer_date ? item.transfer_date.split('T')[0] : '',
      transfer_time: item.transfer_time || '',
      vehicle_id: item.vehicle_id || '',
      passenger_count: item.passenger_count || '',
      price: item.price || '',
      status: item.status || 'pending',
      notes: item.notes || ''
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) { Swal.fire('تنبيه', 'اختر العميل', 'warning'); return; }
    if (!formData.pickup_location.trim()) { Swal.fire('تنبيه', 'أدخل موقع الانطلاق', 'warning'); return; }
    if (!formData.dropoff_location.trim()) { Swal.fire('تنبيه', 'أدخل موقع الوصول', 'warning'); return; }
    if (!formData.transfer_date) { Swal.fire('تنبيه', 'اختر التاريخ', 'warning'); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        customer_id: Number(formData.customer_id),
        booking_id: formData.booking_id ? Number(formData.booking_id) : null,
        vehicle_id: formData.vehicle_id ? Number(formData.vehicle_id) : null,
        passenger_count: formData.passenger_count ? Number(formData.passenger_count) : null,
        price: formData.price ? Number(formData.price) : null
      };
      if (editingId) {
        await api.put(`/transfers/${editingId}`, payload);
        Swal.fire('تم التحديث', 'تم تحديث التحويل', 'success');
      } else {
        await api.post('/transfers', payload);
        Swal.fire('تم الإضافة', 'تم إضافة التحويل', 'success');
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'تأكيد الحذف', text: 'سيتم حذف هذا التحويل', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/transfers/${id}`).then(() => load());
    });
  };

  const statusBadge = (s) => {
    const colors = { pending: 'warning', completed: 'success', cancelled: 'danger' };
    const labels = { pending: 'قيد الانتظار', completed: 'مكتمل', cancelled: 'ملغي' };
    return <span className={`badge bg-${colors[s] || 'secondary'}`}>{labels[s] || s}</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0">
          <i className="bi bi-truck me-2"></i>
          إدارة التحويلات
        </h5>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-plus-lg"></i> تحويل جديد
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input className="form-control" placeholder="بحث بموقع الانطلاق أو الوصول..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <input type="date" className="form-control" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
            </div>
            <div className="col-md-3">
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">كل الحالات</option>
                <option value="pending">قيد الانتظار</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setDateFilter(''); setStatusFilter(''); }}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>إعادة
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr><th>العميل</th><th>الانطلاق</th><th>الوصول</th><th>التاريخ</th><th>الوقت</th><th>المركبة</th><th>الركاب</th><th>السعر</th><th>الحالة</th><th></th></tr>
            </thead>
            <tbody>
              {transfers.map(t => (
                <tr key={t.id}>
                  <td className="fw-semibold">{t.customer_name}</td>
                  <td>{t.pickup_location}</td>
                  <td>{t.dropoff_location}</td>
                  <td>{t.transfer_date ? new Date(t.transfer_date).toLocaleDateString('ar-SA') : '-'}</td>
                  <td>{t.transfer_time || '-'}</td>
                  <td><code>{t.vehicle_plate || '-'}</code></td>
                  <td>{t.passenger_count || '-'}</td>
                  <td className="fw-bold">{t.price ? Number(t.price).toLocaleString() + ' ر.س' : '-'}</td>
                  <td>{statusBadge(t.status)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openEdit(t)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(t.id)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && <tr><td colSpan="10" className="text-center text-muted py-4">لا توجد تحويلات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-truck me-2"></i>{editingId ? 'تعديل التحويل' : 'إضافة تحويل جديد'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">العميل <span className="text-danger">*</span></label>
                      <select className="form-select" value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })} required>
                        <option value="">اختر العميل</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.full_name || c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">رقم الحجز (اختياري)</label>
                      <input type="number" className="form-control" value={formData.booking_id} onChange={e => setFormData({ ...formData, booking_id: e.target.value })} placeholder="رقم الحجز" />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">موقع الانطلاق <span className="text-danger">*</span></label>
                      <input className="form-control" value={formData.pickup_location} onChange={e => setFormData({ ...formData, pickup_location: e.target.value })} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">موقع الوصول <span className="text-danger">*</span></label>
                      <input className="form-control" value={formData.dropoff_location} onChange={e => setFormData({ ...formData, dropoff_location: e.target.value })} required />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">التاريخ <span className="text-danger">*</span></label>
                      <input type="date" className="form-control" value={formData.transfer_date} onChange={e => setFormData({ ...formData, transfer_date: e.target.value })} required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">الوقت</label>
                      <input type="time" className="form-control" value={formData.transfer_time} onChange={e => setFormData({ ...formData, transfer_time: e.target.value })} />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">المركبة</label>
                      <select className="form-select" value={formData.vehicle_id} onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}>
                        <option value="">اختر المركبة</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.plate_number} - {v.brand} {v.model}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">عدد الركاب</label>
                      <input type="number" className="form-control" value={formData.passenger_count} onChange={e => setFormData({ ...formData, passenger_count: e.target.value })} min="1" />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">السعر</label>
                      <div className="input-group">
                        <input type="number" className="form-control" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} min="0" step="0.01" />
                        <span className="input-group-text">ر.س</span>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">الحالة</label>
                      <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <option value="pending">قيد الانتظار</option>
                        <option value="completed">مكتمل</option>
                        <option value="cancelled">ملغي</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">ملاحظات</label>
                    <textarea className="form-control" rows="2" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
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
