import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

const typeLabels = { earned: 'مكتسبة', redeemed: 'مستردة' };
const refTypeLabels = { booking: 'حجز', payment: 'دفعة', review: 'تقييم', referral: 'إحالة' };

export default function LoyaltyPoints() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterType, setFilterType] = useState('');
  const [balance, setBalance] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '', points: '', type: 'earned', reference_type: 'booking', reference_id: '', notes: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCustomer) params.customer_id = filterCustomer;
      if (filterType) params.type = filterType;
      const res = await api.get('/loyalty-points', { params });
      setRows(res.data.rows || res.data || []);
    } catch {
      Swal.fire('خطأ', 'فشل تحميل نقاط الولاء', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterCustomer, filterType]);

  useEffect(() => {
    api.get('/customers').then(r => setCustomers(r.data.rows || r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (filterCustomer) {
      api.get(`/loyalty-points/balance/${filterCustomer}`).then(res => {
        setBalance(res.data.balance ?? res.data.points ?? 0);
      }).catch(() => setBalance(0));
    } else {
      setBalance(null);
    }
  }, [filterCustomer]);

  const resetForm = () => {
    setFormData({ customer_id: '', points: '', type: 'earned', reference_type: 'booking', reference_id: '', notes: '' });
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.points || Number(formData.points) <= 0) {
      Swal.fire('تنبيه', 'اختر العميل وأدخل نقاط صحيحة', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        customer_id: Number(formData.customer_id),
        points: Number(formData.points),
        type: formData.type,
        reference_type: formData.reference_type,
        reference_id: formData.reference_id ? Number(formData.reference_id) : null,
        notes: formData.notes || null
      };
      await api.post('/loyalty-points', body);
      Swal.fire({ title: 'تم الإضافة', text: 'تم إضافة النقاط بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل إضافة النقاط', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'هل أنت متأكد؟', text: 'سيتم حذف سجل النقاط هذا',
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6', confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء'
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          await api.delete(`/loyalty-points/${id}`);
          Swal.fire('تم الحذف', 'تم حذف السجل', 'success');
          load();
        } catch { Swal.fire('خطأ', 'فشل حذف السجل', 'error'); }
      }
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0"><i className="bi bi-stars me-2"></i>نقاط الولاء</h5>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-1"></i>إضافة نقاط</button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label">اختر العميل</label>
              <select className="form-select" value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)}>
                <option value="">كل العملاء</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name || c.full_name || c.id}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">النوع</label>
              <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">الكل</option>
                <option value="earned">مكتسبة</option>
                <option value="redeemed">مستردة</option>
              </select>
            </div>
            <div className="col-md-3">
              {balance !== null && (
                <div className="p-2 bg-success bg-opacity-10 rounded text-center">
                  <small className="text-muted d-block">الرصيد الحالي</small>
                  <strong className="text-success fs-5">{balance}</strong>
                </div>
              )}
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
                <th>النقاط</th>
                <th>النوع</th>
                <th>المرجع</th>
                <th>رقم المرجع</th>
                <th>ملاحظات</th>
                <th>التاريخ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="fw-semibold">{r.customer_name || r.customer_id}</td>
                  <td>
                    <span className={`badge ${r.type === 'earned' ? 'bg-success' : 'bg-danger'} fs-6`}>
                      {r.type === 'earned' ? '+' : '-'}{r.points}
                    </span>
                  </td>
                  <td>{typeLabels[r.type] || r.type}</td>
                  <td>{refTypeLabels[r.reference_type] || r.reference_type || '-'}</td>
                  <td><code>{r.reference_id || '-'}</code></td>
                  <td className="small text-muted">{r.notes || '-'}</td>
                  <td className="small">{r.created_at ? new Date(r.created_at).toLocaleDateString('ar-SA') : '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id)} title="حذف"><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="8" className="text-center text-muted py-4">لا توجد نقاط ولاء</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-plus-circle me-2"></i>إضافة نقاط ولاء</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">العميل <span className="text-danger">*</span></label>
                      <select className="form-select" name="customer_id" value={formData.customer_id} onChange={handleChange} required>
                        <option value="">اختر عميل</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name || c.full_name || c.id}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">النقاط <span className="text-danger">*</span></label>
                      <input type="number" className="form-control" name="points" value={formData.points} onChange={handleChange} min="1" required />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">النوع <span className="text-danger">*</span></label>
                      <select className="form-select" name="type" value={formData.type} onChange={handleChange}>
                        <option value="earned">مكتسبة</option>
                        <option value="redeemed">مستردة</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">نوع المرجع</label>
                      <select className="form-select" name="reference_type" value={formData.reference_type} onChange={handleChange}>
                        <option value="booking">حجز</option>
                        <option value="payment">دفعة</option>
                        <option value="review">تقييم</option>
                        <option value="referral">إحالة</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">رقم المرجع</label>
                      <input type="number" className="form-control" name="reference_id" value={formData.reference_id} onChange={handleChange} placeholder="اختياري" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">ملاحظات</label>
                    <textarea className="form-control" name="notes" value={formData.notes} onChange={handleChange} rows="2"></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span>جاري الحفظ...</> : <><i className="bi bi-check-lg me-1"></i>حفظ</>}
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
