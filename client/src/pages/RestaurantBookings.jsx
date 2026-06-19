import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function RestaurantBookings() {
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '', booking_id: '', restaurant_name: '', guest_count: '',
    reservation_date: '', reservation_time: '', table_type: 'indoor',
    special_requests: '', status: 'pending', notes: ''
  });

  const load = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/restaurant-bookings', { params });
      setBookings(res.data.rows || res.data || []);
    } catch { Swal.fire('خطأ', 'فشل تحميل حجوزات المطاعم', 'error'); }
  };

  const loadCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.rows || res.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, [search, dateFilter, statusFilter]);
  useEffect(() => { loadCustomers(); }, []);

  const resetForm = () => {
    setFormData({
      customer_id: '', booking_id: '', restaurant_name: '', guest_count: '',
      reservation_date: '', reservation_time: '', table_type: 'indoor',
      special_requests: '', status: 'pending', notes: ''
    });
    setEditingId(null);
  };

  const openEdit = (item) => {
    setFormData({
      customer_id: item.customer_id || '',
      booking_id: item.booking_id || '',
      restaurant_name: item.restaurant_name || '',
      guest_count: item.guest_count || '',
      reservation_date: item.reservation_date ? item.reservation_date.split('T')[0] : '',
      reservation_time: item.reservation_time || '',
      table_type: item.table_type || 'indoor',
      special_requests: item.special_requests || '',
      status: item.status || 'pending',
      notes: item.notes || ''
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) { Swal.fire('تنبيه', 'اختر العميل', 'warning'); return; }
    if (!formData.restaurant_name.trim()) { Swal.fire('تنبيه', 'أدخل اسم المطعم', 'warning'); return; }
    if (!formData.guest_count || Number(formData.guest_count) < 1) { Swal.fire('تنبيه', 'أدخل عدد الضيوف', 'warning'); return; }
    if (!formData.reservation_date) { Swal.fire('تنبيه', 'اختر التاريخ', 'warning'); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        customer_id: Number(formData.customer_id),
        booking_id: formData.booking_id ? Number(formData.booking_id) : null,
        guest_count: Number(formData.guest_count)
      };
      if (editingId) {
        await api.put(`/restaurant-bookings/${editingId}`, payload);
        Swal.fire('تم التحديث', 'تم تحديث الحجز', 'success');
      } else {
        await api.post('/restaurant-bookings', payload);
        Swal.fire('تم الإضافة', 'تم إضافة الحجز', 'success');
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally { setSubmitting(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/restaurant-bookings/${id}/status`, { status });
      Swal.fire('تم التحديث', 'تم تغيير الحالة', 'success');
      load();
    } catch { Swal.fire('خطأ', 'فشل تغيير الحالة', 'error'); }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'تأكيد الحذف', text: 'سيتم حذف هذا الحجز', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/restaurant-bookings/${id}`).then(() => load());
    });
  };

  const nextStatus = (s) => {
    const flow = { pending: 'confirmed', confirmed: 'seated' };
    return flow[s] || null;
  };

  const statusBadge = (s) => {
    const colors = { pending: 'warning', confirmed: 'primary', seated: 'success', cancelled: 'danger' };
    const labels = { pending: 'قيد الانتظار', confirmed: 'مؤكد', seated: 'تم الجلوس', cancelled: 'ملغي' };
    return <span className={`badge bg-${colors[s] || 'secondary'}`}>{labels[s] || s}</span>;
  };

  const tableTypeLabel = (t) => {
    const types = { indoor: 'داخلي', outdoor: 'خارجي', vip: 'VIP', private: 'خاص' };
    return types[t] || t;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0">
          <i className="bi bi-cup-hot me-2"></i>
          حجوزات المطاعم
        </h5>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-plus-lg"></i> حجز جديد
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input className="form-control" placeholder="بحث باسم المطعم..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <input type="date" className="form-control" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
            </div>
            <div className="col-md-3">
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">كل الحالات</option>
                <option value="pending">قيد الانتظار</option>
                <option value="confirmed">مؤكد</option>
                <option value="seated">تم الجلوس</option>
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
              <tr><th>المطعم</th><th>العميل</th><th>عدد الضيوف</th><th>التاريخ</th><th>الوقت</th><th>نوع الطاولة</th><th>الحالة</th><th></th></tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td className="fw-semibold">{b.restaurant_name}</td>
                  <td>{b.customer_name}</td>
                  <td>{b.guest_count}</td>
                  <td>{b.reservation_date ? new Date(b.reservation_date).toLocaleDateString('ar-SA') : '-'}</td>
                  <td>{b.reservation_time || '-'}</td>
                  <td><span className="badge bg-light text-dark">{tableTypeLabel(b.table_type)}</span></td>
                  <td>{statusBadge(b.status)}</td>
                  <td>
                    {nextStatus(b.status) && (
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleStatusChange(b.id, nextStatus(b.status))} title={`تحويل إلى ${nextStatus(b.status)}`}>
                        <i className="bi bi-arrow-right"></i>
                      </button>
                    )}
                    {b.status !== 'cancelled' && (
                      <button className="btn btn-sm btn-outline-danger me-1" onClick={() => handleStatusChange(b.id, 'cancelled')} title="إلغاء">
                        <i className="bi bi-x-circle"></i>
                      </button>
                    )}
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openEdit(b)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(b.id)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && <tr><td colSpan="8" className="text-center text-muted py-4">لا توجد حجوزات مطاعم</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-cup-hot me-2"></i>{editingId ? 'تعديل الحجز' : 'إضافة حجز جديد'}</h5>
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
                      <label className="form-label">اسم المطعم <span className="text-danger">*</span></label>
                      <input className="form-control" value={formData.restaurant_name} onChange={e => setFormData({ ...formData, restaurant_name: e.target.value })} required />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">عدد الضيوف <span className="text-danger">*</span></label>
                      <input type="number" className="form-control" value={formData.guest_count} onChange={e => setFormData({ ...formData, guest_count: e.target.value })} min="1" required />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">نوع الطاولة</label>
                      <select className="form-select" value={formData.table_type} onChange={e => setFormData({ ...formData, table_type: e.target.value })}>
                        <option value="indoor">داخلي</option>
                        <option value="outdoor">خارجي</option>
                        <option value="vip">VIP</option>
                        <option value="private">خاص</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">التاريخ <span className="text-danger">*</span></label>
                      <input type="date" className="form-control" value={formData.reservation_date} onChange={e => setFormData({ ...formData, reservation_date: e.target.value })} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الوقت</label>
                      <input type="time" className="form-control" value={formData.reservation_time} onChange={e => setFormData({ ...formData, reservation_time: e.target.value })} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">طلبات خاصة</label>
                    <textarea className="form-control" rows="2" value={formData.special_requests} onChange={e => setFormData({ ...formData, special_requests: e.target.value })}></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الحالة</label>
                      <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <option value="pending">قيد الانتظار</option>
                        <option value="confirmed">مؤكد</option>
                        <option value="seated">تم الجلوس</option>
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
