import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Installments() {
  const { success, error } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({
    customer_id: '', booking_id: '', total_amount: '', down_payment: '0',
    installments_count: '2', notes: ''
  });
  const [payments, setPayments] = useState([]);
  const [payLoading, setPayLoading] = useState(false);
  const [addPaymentModal, setAddPaymentModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', due_date: '' });

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/installments/plans');
      setPlans(res.data);
    } catch { error('فشل تحميل خطط التقسيط'); }
    finally { setLoading(false); }
  };

  const openModal = async () => {
    try {
      const [custRes, bookRes] = await Promise.all([
        api.get('/installments/customers'),
        api.get('/installments/bookings')
      ]);
      setCustomers(custRes.data);
      setBookings(bookRes.data);
    } catch { error('فشل تحميل البيانات'); }
    setForm({ customer_id: '', booking_id: '', total_amount: '', down_payment: '0', installments_count: '2', notes: '' });
    setShowModal(true);
  };

  const createPlan = async (e) => {
    e.preventDefault();
    try {
      await api.post('/installments/plans', form);
      success('تم إنشاء خطة التقسيط بنجاح');
      setShowModal(false);
      fetchPlans();
    } catch { error('فشل إنشاء خطة التقسيط'); }
  };

  const togglePlan = async (planId) => {
    if (expandedPlan === planId) { setExpandedPlan(null); setPayments([]); return; }
    try {
      const res = await api.get(`/installments/plans/${planId}`);
      setPayments(res.data.payments || []);
      setExpandedPlan(planId);
    } catch { error('فشل تحميل جدول السداد'); }
  };

  const payDownPayment = async (planId) => {
    try {
      await api.put(`/installments/plans/${planId}/pay-down-payment`);
      success('تم دفع الدفعة الأولى');
      fetchPlans();
      if (expandedPlan === planId) togglePlan(planId);
    } catch { error('فشل دفع الدفعة الأولى'); }
  };

  const payPayment = async (paymentId) => {
    setPayLoading(true);
    try {
      await api.put(`/installments/payments/${paymentId}/pay`);
      success('تم دفع القسط');
      if (expandedPlan) {
        const res = await api.get(`/installments/plans/${expandedPlan}`);
        setPayments(res.data.payments || []);
      }
      fetchPlans();
    } catch { error('فشل دفع القسط'); }
    finally { setPayLoading(false); }
  };

  const openAddPayment = () => {
    setPayForm({ amount: '', due_date: '' });
    setAddPaymentModal(true);
  };

  const addPayment = async (e) => {
    e.preventDefault();
    if (!expandedPlan) return;
    try {
      await api.post(`/installments/plans/${expandedPlan}/payments`, payForm);
      success('تم إضافة القسط');
      setAddPaymentModal(false);
      const res = await api.get(`/installments/plans/${expandedPlan}`);
      setPayments(res.data.payments || []);
      fetchPlans();
    } catch { error('فشل إضافة القسط'); }
  };

  const deletePayment = async (paymentId) => {
    if (!confirm('تأكيد حذف القسط؟')) return;
    try {
      await api.delete(`/installments/payments/${paymentId}`);
      success('تم حذف القسط');
      if (expandedPlan) {
        const res = await api.get(`/installments/plans/${expandedPlan}`);
        setPayments(res.data.payments || []);
      }
      fetchPlans();
    } catch { error('فشل حذف القسط'); }
  };

  const getStatusBadge = (status) => {
    const map = { active: 'primary', completed: 'success', defaulted: 'danger' };
    const labels = { active: 'نشط', completed: 'مكتمل', defaulted: 'متأخر' };
    return <span className={`badge bg-${map[status] || 'secondary'}`}>{labels[status] || status}</span>;
  };

  const getPaymentStatusBadge = (status) => {
    const map = { paid: 'success', pending: 'warning', overdue: 'danger' };
    const labels = { paid: 'مدفوع', pending: 'قيد الانتظار', overdue: 'متأخر' };
    return <span className={`badge bg-${map[status] || 'secondary'}`}>{labels[status] || status}</span>;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('ar-EG') : '-';
  const formatMoney = (n) => n != null ? Number(n).toLocaleString('ar-EG') + ' ج.م' : '-';

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>خطط التقسيط</h4>
        <button className="btn btn-primary" onClick={openModal}><i className="bi bi-plus-lg me-1"></i>خطة تقسيط جديدة</button>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>العميل</th>
                  <th>رقم الحجز</th>
                  <th>المبلغ الإجمالي</th>
                  <th>الدفعة الأولى</th>
                  <th>عدد الأقساط</th>
                  <th>المتبقي</th>
                  <th>الحالة</th>
                  <th>التقدم</th>
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr><td colSpan="9" className="text-center text-muted py-4">لا توجد خطط تقسيط</td></tr>
                ) : plans.map((plan, idx) => {
                  const paidCount = (plan.payments || []).filter(p => p.status === 'paid').length;
                  const totalCount = plan.installments_count || 1;
                  const progress = Math.round((paidCount / totalCount) * 100);
                  return (
                    <>
                      <tr key={plan.id} style={{ cursor: 'pointer' }} onClick={() => togglePlan(plan.id)} className={expandedPlan === plan.id ? 'table-active' : ''}>
                        <td>{idx + 1}</td>
                        <td>{plan.customer_name || '-'}</td>
                        <td>{plan.booking_id || '-'}</td>
                        <td>{formatMoney(plan.total_amount)}</td>
                        <td>
                          {plan.down_payment > 0 ? (
                            plan.down_payment_paid ? (
                              <span className="text-success"><i className="bi bi-check-circle me-1"></i>{formatMoney(plan.down_payment)}</span>
                            ) : (
                              <span>
                                {formatMoney(plan.down_payment)}
                                <button className="btn btn-sm btn-outline-success ms-2 py-0" onClick={(e) => { e.stopPropagation(); payDownPayment(plan.id); }}>
                                  <i className="bi bi-credit-card"></i>
                                </button>
                              </span>
                            )
                          ) : '-'}
                        </td>
                        <td>{plan.installments_count}</td>
                        <td>{formatMoney(plan.remaining_amount)}</td>
                        <td>{getStatusBadge(plan.status)}</td>
                        <td style={{ minWidth: '120px' }}>
                          <div className="progress" style={{ height: '8px' }}>
                            <div className="progress-bar" role="progressbar" style={{ width: `${progress}%` }}
                              aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"></div>
                          </div>
                          <small className="text-muted">{paidCount}/{totalCount}</small>
                        </td>
                      </tr>
                      {expandedPlan === plan.id && (
                        <tr key={`detail-${plan.id}`}>
                          <td colSpan="9" className="p-3" style={{ background: '#f8f9fa' }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="mb-0">جدول السداد</h6>
                              <button className="btn btn-sm btn-outline-primary" onClick={openAddPayment}><i className="bi bi-plus me-1"></i>إضافة قسط</button>
                            </div>
                            <div className="table-responsive">
                              <table className="table table-sm mb-0">
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>المبلغ</th>
                                    <th>تاريخ الاستحقاق</th>
                                    <th>تاريخ الدفع</th>
                                    <th>المبلغ المدفوع</th>
                                    <th>الحالة</th>
                                    <th></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {payments.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center text-muted">لا توجد أقساط</td></tr>
                                  ) : payments.map((pmt, i) => (
                                    <tr key={pmt.id}>
                                      <td>{i + 1}</td>
                                      <td>{formatMoney(pmt.amount)}</td>
                                      <td>{formatDate(pmt.due_date)}</td>
                                      <td>{formatDate(pmt.paid_date)}</td>
                                      <td>{pmt.paid_amount ? formatMoney(pmt.paid_amount) : '-'}</td>
                                      <td>{getPaymentStatusBadge(pmt.status)}</td>
                                      <td>
                                        {pmt.status === 'pending' && (
                                          <button className="btn btn-sm btn-success me-1" disabled={payLoading} onClick={() => payPayment(pmt.id)}>
                                            <i className="bi bi-credit-card"></i>
                                          </button>
                                        )}
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => deletePayment(pmt.id)}>
                                          <i className="bi bi-trash"></i>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">خطة تقسيط جديدة</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={createPlan}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">العميل</label>
                      <select className="form-select" required value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})}>
                        <option value="">اختر العميل</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">الحجز</label>
                      <select className="form-select" required value={form.booking_id} onChange={e => setForm({...form, booking_id: e.target.value})}>
                        <option value="">اختر الحجز</option>
                        {bookings.map(b => <option key={b.id} value={b.id}>{b.id}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">المبلغ الإجمالي</label>
                      <input type="number" className="form-control" required min="0" step="0.01" value={form.total_amount} onChange={e => setForm({...form, total_amount: e.target.value})} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">الدفعة الأولى</label>
                      <input type="number" className="form-control" min="0" step="0.01" value={form.down_payment} onChange={e => setForm({...form, down_payment: e.target.value})} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">عدد الأقساط</label>
                      <select className="form-select" value={form.installments_count} onChange={e => setForm({...form, installments_count: e.target.value})}>
                        {[2, 3, 4, 6, 12].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">ملاحظات</label>
                      <textarea className="form-control" rows="2" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-primary">إنشاء</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {addPaymentModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">إضافة قسط</h5>
                <button type="button" className="btn-close" onClick={() => setAddPaymentModal(false)}></button>
              </div>
              <form onSubmit={addPayment}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">المبلغ</label>
                    <input type="number" className="form-control" required min="0" step="0.01" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">تاريخ الاستحقاق</label>
                    <input type="date" className="form-control" required value={payForm.due_date} onChange={e => setPayForm({...payForm, due_date: e.target.value})} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setAddPaymentModal(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-primary">إضافة</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
