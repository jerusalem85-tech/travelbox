import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

const StarRating = ({ rating, onChange }) => (
  <div className="d-flex gap-1">
    {[1, 2, 3, 4, 5].map(n => (
      <i key={n} className={`bi ${n <= rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`}
        style={{ cursor: onChange ? 'pointer' : 'default', fontSize: '1.2rem' }}
        onClick={() => onChange?.(n)}></i>
    ))}
  </div>
);

export default function Surveys() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ average_rating: 0, nps_score: 0, total_responses: 0 });
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [minRating, setMinRating] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '', booking_id: '', rating: 0, nps_score: 5,
    service_quality: 5, communication: 5, value_for_money: 5,
    feedback: '', recommend: 'yes'
  });

  const loadStats = async () => {
    try {
      const res = await api.get('/surveys/stats');
      setStats(res.data || { average_rating: 0, nps_score: 0, total_responses: 0 });
    } catch {}
  };

  const load = async () => {
    try {
      const params = {};
      if (minRating) params.min_rating = minRating;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await api.get('/surveys', { params });
      setRows(res.data.rows || res.data || []);
    } catch { Swal.fire('خطأ', 'فشل تحميل الاستبيانات', 'error'); }
  };

  useEffect(() => { load(); loadStats(); }, [minRating, dateFrom, dateTo]);

  useEffect(() => {
    api.get('/customers').then(r => setCustomers(r.data.rows || r.data || [])).catch(() => {});
  }, []);

  const resetForm = () => {
    setFormData({
      customer_id: '', booking_id: '', rating: 0, nps_score: 5,
      service_quality: 5, communication: 5, value_for_money: 5,
      feedback: '', recommend: 'yes'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) { Swal.fire('تنبيه', 'اختر العميل', 'warning'); return; }
    if (!formData.rating) { Swal.fire('تنبيه', 'اختر التقييم', 'warning'); return; }
    setSubmitting(true);
    try {
      await api.post('/surveys', {
        ...formData,
        customer_id: Number(formData.customer_id),
        booking_id: formData.booking_id ? Number(formData.booking_id) : null,
        rating: Number(formData.rating),
        nps_score: Number(formData.nps_score),
        service_quality: Number(formData.service_quality),
        communication: Number(formData.communication),
        value_for_money: Number(formData.value_for_money)
      });
      Swal.fire('تم الإضافة', 'تم إضافة الاستبيان', 'success');
      setShowModal(false);
      resetForm();
      load();
      loadStats();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'تأكيد الحذف', text: 'سيتم حذف الاستبيان', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/surveys/${id}`).then(() => { load(); loadStats(); });
    });
  };

  const renderStars = (val) => {
    const n = Number(val) || 0;
    return (
      <span className="d-flex gap-1" style={{ direction: 'ltr' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <i key={i} className={`bi ${i <= n ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`} style={{ fontSize: '0.9rem' }}></i>
        ))}
      </span>
    );
  };

  const renderNPS = (val) => {
    const n = Number(val) || 0;
    const color = n >= 9 ? 'success' : n >= 7 ? 'primary' : n >= 5 ? 'warning' : 'danger';
    return <span className={`badge bg-${color}`}>{n}</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0"><i className="bi bi-emoji-smile me-2"></i>استبيانات رضا العملاء</h5>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-plus-lg"></i> استبيان جديد
        </button>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="card bg-primary text-white h-100">
            <div className="card-body text-center">
              <h6 className="card-title">متوسط التقييم</h6>
              <div className="d-flex justify-content-center" style={{ direction: 'ltr' }}>
                {renderStars(stats.average_rating)}
              </div>
              <div className="mt-1 fs-5 fw-bold">{Number(stats.average_rating).toFixed(1)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-success text-white h-100">
            <div className="card-body text-center">
              <h6 className="card-title">NPS</h6>
              <div className="fs-1 fw-bold">{stats.nps_score}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-info text-white h-100">
            <div className="card-body text-center">
              <h6 className="card-title">إجمالي الردود</h6>
              <div className="fs-1 fw-bold">{stats.total_responses}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label">أقل تقييم</label>
              <select className="form-select" value={minRating} onChange={e => setMinRating(e.target.value)}>
                <option value="">الكل</option>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} نجوم</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">من تاريخ</label>
              <input type="date" className="form-control" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">إلى تاريخ</label>
              <input type="date" className="form-control" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setMinRating(''); setDateFrom(''); setDateTo(''); }}>
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
              <tr>
                <th>العميل</th>
                <th>الحجز</th>
                <th>التقييم</th>
                <th>NPS</th>
                <th>جودة الخدمة</th>
                <th>التواصل</th>
                <th>القيمة</th>
                <th>يوصي</th>
                <th>تاريخ الرد</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="fw-semibold">{r.customer_name || r.customer_id}</td>
                  <td>{r.booking_id || '-'}</td>
                  <td style={{ direction: 'ltr' }}>{renderStars(r.rating)}</td>
                  <td>{renderNPS(r.nps_score)}</td>
                  <td>{renderStars(r.service_quality)}</td>
                  <td>{renderStars(r.communication)}</td>
                  <td>{renderStars(r.value_for_money)}</td>
                  <td>
                    {r.recommend === 'yes' ? <span className="badge bg-success">نعم</span> : <span className="badge bg-danger">لا</span>}
                  </td>
                  <td className="small">{r.responded_at ? new Date(r.responded_at).toLocaleDateString('ar-SA') : '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="10" className="text-center text-muted py-4">لا توجد استبيانات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-emoji-smile me-2"></i>استبيان جديد</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">العميل <span className="text-danger">*</span></label>
                      <select className="form-select" value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })} required>
                        <option value="">اختر عميل</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name || c.full_name || c.id}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">رقم الحجز</label>
                      <input type="number" className="form-control" placeholder="رقم الحجز..." value={formData.booking_id} onChange={e => setFormData({ ...formData, booking_id: e.target.value })} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">التقييم العام <span className="text-danger">*</span></label>
                      <StarRating rating={formData.rating} onChange={v => setFormData({ ...formData, rating: v })} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">NPS (0-10)</label>
                      <input type="range" className="form-range" min="0" max="10" value={formData.nps_score}
                        onChange={e => setFormData({ ...formData, nps_score: e.target.value })} />
                      <div className="text-center fw-bold">{formData.nps_score}</div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">جودة الخدمة</label>
                      <StarRating rating={formData.service_quality} onChange={v => setFormData({ ...formData, service_quality: v })} />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">التواصل</label>
                      <StarRating rating={formData.communication} onChange={v => setFormData({ ...formData, communication: v })} />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">القيمة مقابل المال</label>
                      <StarRating rating={formData.value_for_money} onChange={v => setFormData({ ...formData, value_for_money: v })} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">التوصية</label>
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="recommend" id="rec-yes" value="yes"
                          checked={formData.recommend === 'yes'} onChange={e => setFormData({ ...formData, recommend: e.target.value })} />
                        <label className="form-check-label" htmlFor="rec-yes">نعم</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="recommend" id="rec-no" value="no"
                          checked={formData.recommend === 'no'} onChange={e => setFormData({ ...formData, recommend: e.target.value })} />
                        <label className="form-check-label" htmlFor="rec-no">لا</label>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">ملاحظات إضافية</label>
                    <textarea className="form-control" rows="3" value={formData.feedback} onChange={e => setFormData({ ...formData, feedback: e.target.value })}></textarea>
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
