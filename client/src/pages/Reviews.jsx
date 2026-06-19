import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function Reviews() {
  const [rows, setRows] = useState([]);
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [entityIdFilter, setEntityIdFilter] = useState('');
  const [minRatingFilter, setMinRatingFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    entity_type: 'hotel', entity_id: '', customer_id: '', booking_id: '',
    rating: '5', reviewer_name: '', review_text: ''
  });

  const load = async () => {
    try {
      const params = {};
      if (entityTypeFilter) params.entity_type = entityTypeFilter;
      if (entityIdFilter) params.entity_id = entityIdFilter;
      if (minRatingFilter) params.min_rating = minRatingFilter;
      const res = await api.get('/reviews', { params });
      setRows(res.data.rows || res.data || []);
    } catch { Swal.fire('خطأ', 'فشل تحميل التقييمات', 'error'); }
  };

  useEffect(() => { load(); }, [entityTypeFilter, entityIdFilter, minRatingFilter]);

  const resetForm = () => {
    setFormData({
      entity_type: 'hotel', entity_id: '', customer_id: '', booking_id: '',
      rating: '5', reviewer_name: '', review_text: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.entity_id.trim()) { Swal.fire('تنبيه', 'أدخل معرف الكيان', 'warning'); return; }
    if (!formData.reviewer_name.trim()) { Swal.fire('تنبيه', 'أدخل اسم المراجع', 'warning'); return; }
    if (!formData.review_text.trim()) { Swal.fire('تنبيه', 'أدخل نص التقييم', 'warning'); return; }
    setSubmitting(true);
    try {
      const payload = {
        entity_type: formData.entity_type,
        entity_id: Number(formData.entity_id),
        customer_id: formData.customer_id ? Number(formData.customer_id) : null,
        booking_id: formData.booking_id ? Number(formData.booking_id) : null,
        rating: Number(formData.rating),
        reviewer_name: formData.reviewer_name,
        review_text: formData.review_text
      };
      await api.post('/reviews', payload);
      Swal.fire('تم الإضافة', 'تم إضافة التقييم', 'success');
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'تأكيد الحذف', text: 'سيتم حذف التقييم', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/reviews/${id}`).then(() => load());
    });
  };

  const entityTypeLabel = (t) => ({ hotel: 'فندق', guide: 'مرشد', supplier: 'مورد', booking: 'حجز' })[t] || t;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0">التقييمات والمراجعات</h5>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-plus-lg"></i> تقييم جديد
        </button>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label">نوع الكيان</label>
              <select className="form-select" value={entityTypeFilter} onChange={e => setEntityTypeFilter(e.target.value)}>
                <option value="">الكل</option>
                <option value="hotel">فندق</option>
                <option value="guide">مرشد</option>
                <option value="supplier">مورد</option>
                <option value="booking">حجز</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">معرف الكيان</label>
              <input type="number" className="form-control" placeholder="معرف الكيان..." value={entityIdFilter} onChange={e => setEntityIdFilter(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">أقل تقييم</label>
              <select className="form-select" value={minRatingFilter} onChange={e => setMinRatingFilter(e.target.value)}>
                <option value="">الكل</option>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setEntityTypeFilter(''); setEntityIdFilter(''); setMinRatingFilter(''); }}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr><th>النوع</th><th>معرف الكيان</th><th>المراجع</th><th>التقييم</th><th>نص التقييم</th><th>تاريخ الإضافة</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td><span className="badge bg-primary">{entityTypeLabel(r.entity_type)}</span></td>
                  <td>{r.entity_id}</td>
                  <td className="fw-semibold">{r.reviewer_name}</td>
                  <td>{'★'.repeat(Number(r.rating)) + '☆'.repeat(5 - Number(r.rating))}</td>
                  <td className="small" style={{ maxWidth: 300, whiteSpace: 'pre-wrap' }}>{r.review_text}</td>
                  <td className="small">{r.created_at ? new Date(r.created_at).toLocaleDateString('ar-SA') : '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-4">لا توجد تقييمات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-star me-2"></i>إضافة تقييم جديد</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">نوع الكيان <span className="text-danger">*</span></label>
                      <select className="form-select" value={formData.entity_type} onChange={e => setFormData({ ...formData, entity_type: e.target.value })}>
                        <option value="hotel">فندق</option>
                        <option value="guide">مرشد</option>
                        <option value="supplier">مورد</option>
                        <option value="booking">حجز</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">معرف الكيان <span className="text-danger">*</span></label>
                      <input type="number" className="form-control" value={formData.entity_id} onChange={e => setFormData({ ...formData, entity_id: e.target.value })} required />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">التقييم (1-5)</label>
                      <select className="form-select" value={formData.rating} onChange={e => setFormData({ ...formData, rating: e.target.value })}>
                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">معرف العميل (اختياري)</label>
                      <input type="number" className="form-control" value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })} />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">معرف الحجز (اختياري)</label>
                      <input type="number" className="form-control" value={formData.booking_id} onChange={e => setFormData({ ...formData, booking_id: e.target.value })} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">اسم المراجع <span className="text-danger">*</span></label>
                    <input className="form-control" value={formData.reviewer_name} onChange={e => setFormData({ ...formData, reviewer_name: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">نص التقييم <span className="text-danger">*</span></label>
                    <textarea className="form-control" rows="3" value={formData.review_text} onChange={e => setFormData({ ...formData, review_text: e.target.value })} required></textarea>
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
