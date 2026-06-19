import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function Referrals() {
  const [referrals, setReferrals] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    referrer_name: '', referrer_phone: '', referred_name: '', referred_phone: '',
    booking_id: '', reward_amount: '', status: 'pending'
  });

  const load = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/referrals', { params });
      setReferrals(res.data.rows || res.data || []);
    } catch { Swal.fire('خطأ', 'فشل تحميل الإحالات', 'error'); }
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const resetForm = () => {
    setFormData({
      referrer_name: '', referrer_phone: '', referred_name: '', referred_phone: '',
      booking_id: '', reward_amount: '', status: 'pending'
    });
    setEditingId(null);
  };

  const openEdit = (item) => {
    setFormData({
      referrer_name: item.referrer_name || '',
      referrer_phone: item.referrer_phone || '',
      referred_name: item.referred_name || '',
      referred_phone: item.referred_phone || '',
      booking_id: item.booking_id || '',
      reward_amount: item.reward_amount || '',
      status: item.status || 'pending'
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.referrer_name.trim()) { Swal.fire('تنبيه', 'أدخل اسم المُحيل', 'warning'); return; }
    if (!formData.referred_name.trim()) { Swal.fire('تنبيه', 'أدخل اسم المُحال', 'warning'); return; }
    if (!formData.reward_amount || Number(formData.reward_amount) <= 0) { Swal.fire('تنبيه', 'أدخل قيمة المكافأة', 'warning'); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        booking_id: formData.booking_id ? Number(formData.booking_id) : null,
        reward_amount: Number(formData.reward_amount)
      };
      if (editingId) {
        await api.put(`/referrals/${editingId}`, payload);
        Swal.fire('تم التحديث', 'تم تحديث الإحالة', 'success');
      } else {
        await api.post('/referrals', payload);
        Swal.fire('تم الإضافة', 'تم إضافة الإحالة', 'success');
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally { setSubmitting(false); }
  };

  const handlePay = async (id) => {
    try {
      await api.put(`/referrals/${id}/pay`);
      Swal.fire('تم الدفع', 'تم دفع المكافأة', 'success');
      load();
    } catch { Swal.fire('خطأ', 'فشل دفع المكافأة', 'error'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/referrals/${id}`, { status });
      Swal.fire('تم التحديث', 'تم تغيير الحالة', 'success');
      load();
    } catch { Swal.fire('خطأ', 'فشل تغيير الحالة', 'error'); }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'تأكيد الحذف', text: 'سيتم حذف هذه الإحالة', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/referrals/${id}`).then(() => load());
    });
  };

  const nextStatus = (s) => {
    const flow = { pending: 'approved', approved: 'rejected' };
    return flow[s] || null;
  };

  const statusBadge = (s) => {
    const colors = { pending: 'warning', approved: 'success', rejected: 'danger' };
    const labels = { pending: 'قيد الانتظار', approved: 'مقبول', rejected: 'مرفوض' };
    return <span className={`badge bg-${colors[s] || 'secondary'}`}>{labels[s] || s}</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0">
          <i className="bi bi-share me-2"></i>
          برنامج الإحالات
        </h5>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-plus-lg"></i> إحالة جديدة
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input className="form-control" placeholder="بحث باسم المُحيل أو المُحال..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">كل الحالات</option>
                <option value="pending">قيد الانتظار</option>
                <option value="approved">مقبول</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setStatusFilter(''); }}>
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
              <tr><th>المُحيل</th><th>هاتف المُحيل</th><th>المُحال</th><th>هاتف المُحال</th><th>رقم الحجز</th><th>المكافأة</th><th>مدفوعة</th><th>الحالة</th><th>تاريخ الإنشاء</th><th></th></tr>
            </thead>
            <tbody>
              {referrals.map(r => (
                <tr key={r.id}>
                  <td className="fw-semibold">{r.referrer_name}</td>
                  <td dir="ltr">{r.referrer_phone || '-'}</td>
                  <td>{r.referred_name}</td>
                  <td dir="ltr">{r.referred_phone || '-'}</td>
                  <td><code>{r.booking_id || '-'}</code></td>
                  <td className="fw-bold text-success">{Number(r.reward_amount).toLocaleString()}</td>
                  <td>{r.reward_paid ? <span className="badge bg-success">مدفوعة</span> : <span className="badge bg-warning text-dark">غير مدفوعة</span>}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td>{r.created_at ? new Date(r.created_at).toLocaleDateString('ar-SA') : '-'}</td>
                  <td>
                    {!r.reward_paid && r.status === 'approved' && (
                      <button className="btn btn-sm btn-outline-success me-1" onClick={() => handlePay(r.id)} title="دفع المكافأة">
                        <i className="bi bi-check-circle"></i>
                      </button>
                    )}
                    {nextStatus(r.status) && (
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleStatusChange(r.id, nextStatus(r.status))} title={`تحويل إلى ${nextStatus(r.status)}`}>
                        <i className="bi bi-arrow-right"></i>
                      </button>
                    )}
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openEdit(r)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {referrals.length === 0 && <tr><td colSpan="10" className="text-center text-muted py-4">لا توجد إحالات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-share me-2"></i>{editingId ? 'تعديل الإحالة' : 'إضافة إحالة جديدة'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">اسم المُحيل <span className="text-danger">*</span></label>
                      <input className="form-control" value={formData.referrer_name} onChange={e => setFormData({ ...formData, referrer_name: e.target.value })} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">هاتف المُحيل</label>
                      <input className="form-control" value={formData.referrer_phone} onChange={e => setFormData({ ...formData, referrer_phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">اسم المُحال <span className="text-danger">*</span></label>
                      <input className="form-control" value={formData.referred_name} onChange={e => setFormData({ ...formData, referred_name: e.target.value })} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">هاتف المُحال</label>
                      <input className="form-control" value={formData.referred_phone} onChange={e => setFormData({ ...formData, referred_phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">رقم الحجز</label>
                      <input type="number" className="form-control" value={formData.booking_id} onChange={e => setFormData({ ...formData, booking_id: e.target.value })} placeholder="رقم الحجز" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">قيمة المكافأة <span className="text-danger">*</span></label>
                      <input type="number" className="form-control" value={formData.reward_amount} onChange={e => setFormData({ ...formData, reward_amount: e.target.value })} min="0" step="0.01" required />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">الحالة</label>
                    <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                      <option value="pending">قيد الانتظار</option>
                      <option value="approved">مقبول</option>
                      <option value="rejected">مرفوض</option>
                    </select>
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
