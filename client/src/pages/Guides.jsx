import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function Guides() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', phone: '', email: '', languages: '', specializations: '',
    rating: '', daily_rate: '', status: 'available'
  });

  const load = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (langFilter) params.languages = langFilter;
      const res = await api.get('/guides', { params });
      setRows(res.data.rows || res.data || []);
    } catch { Swal.fire('خطأ', 'فشل تحميل المرشدين', 'error'); }
  };

  useEffect(() => { load(); }, [search, statusFilter, langFilter]);

  const resetForm = () => {
    setFormData({
      full_name: '', phone: '', email: '', languages: '', specializations: '',
      rating: '', daily_rate: '', status: 'available'
    });
    setEditingId(null);
  };

  const openEdit = (item) => {
    setFormData({
      full_name: item.full_name, phone: item.phone || '', email: item.email || '',
      languages: Array.isArray(item.languages) ? item.languages.join(', ') : item.languages || '',
      specializations: Array.isArray(item.specializations) ? item.specializations.join(', ') : item.specializations || '',
      rating: item.rating || '', daily_rate: item.daily_rate || '',
      status: item.status || 'available'
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) { Swal.fire('تنبيه', 'أدخل اسم المرشد', 'warning'); return; }
    setSubmitting(true);
    try {
      const parseList = (val) => val.split(',').map(s => s.trim()).filter(Boolean);
      const payload = {
        full_name: formData.full_name, phone: formData.phone, email: formData.email,
        languages: parseList(formData.languages),
        specializations: parseList(formData.specializations),
        rating: formData.rating ? Number(formData.rating) : null,
        daily_rate: formData.daily_rate ? Number(formData.daily_rate) : null,
        status: formData.status
      };
      if (editingId) {
        await api.put(`/guides/${editingId}`, payload);
        Swal.fire('تم التحديث', 'تم تحديث بيانات المرشد', 'success');
      } else {
        await api.post('/guides', payload);
        Swal.fire('تم الإضافة', 'تم إضافة المرشد', 'success');
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = (id, name) => {
    Swal.fire({
      title: 'تأكيد الحذف', text: `سيتم حذف المرشد: ${name}`, icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/guides/${id}`).then(() => load());
    });
  };

  const parseLanguages = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  const parseSpecializations = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  const statusBadge = (s) => {
    const colors = { available: 'success', busy: 'warning', unavailable: 'danger' };
    const labels = { available: 'متاح', busy: 'مشغول', unavailable: 'غير متاح' };
    return <span className={`badge bg-${colors[s] || 'secondary'}`}>{labels[s] || s}</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0">إدارة المرشدين السياحيين</h5>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-plus-lg"></i> مرشد جديد
        </button>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input className="form-control" placeholder="بحث بالاسم..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">كل الحالات</option>
                <option value="available">متاح</option>
                <option value="busy">مشغول</option>
                <option value="unavailable">غير متاح</option>
              </select>
            </div>
            <div className="col-md-3">
              <input className="form-control" placeholder="فلترة باللغة..." value={langFilter} onChange={e => setLangFilter(e.target.value)} />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setStatusFilter(''); setLangFilter(''); }}>
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
              <tr><th>الاسم</th><th>الهاتف</th><th>البريد</th><th>اللغات</th><th>الاختصاصات</th><th>التقييم</th><th>السعر اليومي</th><th>الحالة</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="fw-semibold">{r.full_name}</td>
                  <td dir="ltr">{r.phone || '-'}</td>
                  <td className="small">{r.email || '-'}</td>
                  <td>
                    {parseLanguages(r.languages).length > 0
                      ? parseLanguages(r.languages).map((l, i) => <span key={i} className="badge bg-info me-1">{l}</span>)
                      : '-'}
                  </td>
                  <td className="small">{parseSpecializations(r.specializations).join('، ') || '-'}</td>
                  <td>{r.rating ? '★'.repeat(Number(r.rating)) + '☆'.repeat(5 - Number(r.rating)) : '-'}</td>
                  <td className="fw-bold">{r.daily_rate ? Number(r.daily_rate).toLocaleString() + ' ر.س' : '-'}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openEdit(r)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id, r.full_name)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="9" className="text-center text-muted py-4">لا يوجد مرشدون</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-person-badge me-2"></i>{editingId ? 'تعديل المرشد' : 'إضافة مرشد جديد'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الاسم <span className="text-danger">*</span></label>
                      <input className="form-control" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">الهاتف</label>
                      <input className="form-control" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">البريد</label>
                      <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">اللغات (مفصولة بفاصلة)</label>
                      <input className="form-control" value={formData.languages} onChange={e => setFormData({ ...formData, languages: e.target.value })} placeholder="مثال: العربية, الإنجليزية, الفرنسية" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الاختصاصات (مفصولة بفاصلة)</label>
                      <input className="form-control" value={formData.specializations} onChange={e => setFormData({ ...formData, specializations: e.target.value })} placeholder="مثال: تاريخ, آثار, مغامرات" />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">التقييم (1-5)</label>
                      <select className="form-select" value={formData.rating} onChange={e => setFormData({ ...formData, rating: e.target.value })}>
                        <option value="">اختر التقييم</option>
                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">السعر اليومي</label>
                      <div className="input-group">
                        <input type="number" className="form-control" value={formData.daily_rate} onChange={e => setFormData({ ...formData, daily_rate: e.target.value })} min="0" step="0.01" />
                        <span className="input-group-text">ر.س</span>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">الحالة</label>
                      <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <option value="available">متاح</option>
                        <option value="busy">مشغول</option>
                        <option value="unavailable">غير متاح</option>
                      </select>
                    </div>
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
