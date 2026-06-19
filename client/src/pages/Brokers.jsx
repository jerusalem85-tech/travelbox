import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function Brokers() {
  const [activeTab, setActiveTab] = useState('brokers');

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0">
          <i className="bi bi-people me-2"></i>
          إدارة السماسرة
        </h5>
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'brokers' ? 'active' : ''}`} onClick={() => setActiveTab('brokers')}>
            <i className="bi bi-person-badge me-1"></i>
            السماسرة
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'commissions' ? 'active' : ''}`} onClick={() => setActiveTab('commissions')}>
            <i className="bi bi-cash-coin me-1"></i>
            عمولات السمسرة
          </button>
        </li>
      </ul>

      {activeTab === 'brokers' ? <BrokersTab /> : <CommissionsTab />}
    </div>
  );
}

function BrokersTab() {
  const [brokers, setBrokers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', phone: '', email: '', company: '',
    commission_rate: '', contract_start: '', contract_end: '', status: 'active'
  });

  const load = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/brokers', { params });
      setBrokers(res.data.rows || res.data || []);
    } catch { Swal.fire('خطأ', 'فشل تحميل السماسرة', 'error'); }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setFormData({
      full_name: '', phone: '', email: '', company: '',
      commission_rate: '', contract_start: '', contract_end: '', status: 'active'
    });
    setEditingId(null);
  };

  const openEdit = (item) => {
    setFormData({
      full_name: item.full_name || '',
      phone: item.phone || '',
      email: item.email || '',
      company: item.company || '',
      commission_rate: item.commission_rate || '',
      contract_start: item.contract_start ? item.contract_start.split('T')[0] : '',
      contract_end: item.contract_end ? item.contract_end.split('T')[0] : '',
      status: item.status || 'active'
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) { Swal.fire('تنبيه', 'أدخل اسم السمسار', 'warning'); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        commission_rate: formData.commission_rate ? Number(formData.commission_rate) : null
      };
      if (editingId) {
        await api.put(`/brokers/${editingId}`, payload);
        Swal.fire('تم التحديث', 'تم تحديث بيانات السمسار', 'success');
      } else {
        await api.post('/brokers', payload);
        Swal.fire('تم الإضافة', 'تم إضافة السمسار', 'success');
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
      title: 'تأكيد الحذف', text: `سيتم حذف السمسار: ${name}`, icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/brokers/${id}`).then(() => load());
    });
  };

  const statusBadge = (s) => {
    const colors = { active: 'success', inactive: 'secondary' };
    const labels = { active: 'نشط', inactive: 'غير نشط' };
    return <span className={`badge bg-${colors[s] || 'secondary'}`}>{labels[s] || s}</span>;
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">السماسرة</h6>
        <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-plus-lg"></i> سمسار جديد
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input className="form-control" placeholder="بحث بالاسم أو الهاتف أو الشركة..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">كل الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
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
              <tr><th>الاسم</th><th>الهاتف</th><th>البريد</th><th>الشركة</th><th>نسبة العمولة</th><th>بداية العقد</th><th>نهاية العقد</th><th>الحالة</th><th></th></tr>
            </thead>
            <tbody>
              {brokers.map(b => (
                <tr key={b.id}>
                  <td className="fw-semibold">{b.full_name}</td>
                  <td dir="ltr">{b.phone}</td>
                  <td>{b.email || '-'}</td>
                  <td>{b.company || '-'}</td>
                  <td className="fw-bold text-primary">{b.commission_rate ? `${Number(b.commission_rate).toFixed(1)}%` : '-'}</td>
                  <td>{b.contract_start ? new Date(b.contract_start).toLocaleDateString('ar-SA') : '-'}</td>
                  <td>{b.contract_end ? new Date(b.contract_end).toLocaleDateString('ar-SA') : '-'}</td>
                  <td>{statusBadge(b.status)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openEdit(b)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(b.id, b.full_name)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {brokers.length === 0 && <tr><td colSpan="9" className="text-center text-muted py-4">لا يوجد سماسرة</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-person-badge me-2"></i>{editingId ? 'تعديل سمسار' : 'إضافة سمسار جديد'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الاسم الكامل <span className="text-danger">*</span></label>
                      <input className="form-control" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الهاتف</label>
                      <input className="form-control" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">البريد الإلكتروني</label>
                      <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الشركة</label>
                      <input className="form-control" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">نسبة العمولة (%)</label>
                      <input type="number" className="form-control" value={formData.commission_rate} onChange={e => setFormData({ ...formData, commission_rate: e.target.value })} min="0" max="100" step="0.1" />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">بداية العقد</label>
                      <input type="date" className="form-control" value={formData.contract_start} onChange={e => setFormData({ ...formData, contract_start: e.target.value })} />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">نهاية العقد</label>
                      <input type="date" className="form-control" value={formData.contract_end} onChange={e => setFormData({ ...formData, contract_end: e.target.value })} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">الحالة</label>
                    <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                      <option value="active">نشط</option>
                      <option value="inactive">غير نشط</option>
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
    </>
  );
}

function CommissionsTab() {
  const [commissions, setCommissions] = useState([]);
  const [brokersList, setBrokersList] = useState([]);
  const [brokerFilter, setBrokerFilter] = useState('');
  const [paidFilter, setPaidFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    broker_id: '', booking_id: '', commission: '', notes: ''
  });

  const load = useCallback(async () => {
    try {
      const params = {};
      if (brokerFilter) params.broker_id = brokerFilter;
      if (paidFilter !== '') params.paid = paidFilter;
      const res = await api.get('/broker-commissions', { params });
      setCommissions(res.data.rows || res.data || []);
    } catch { Swal.fire('خطأ', 'فشل تحميل العمولات', 'error'); }
  }, [brokerFilter, paidFilter]);

  const loadBrokers = async () => {
    try {
      const res = await api.get('/broker-commissions/brokers');
      setBrokersList(res.data.rows || res.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadBrokers(); }, []);

  const resetForm = () => {
    setFormData({ broker_id: '', booking_id: '', commission: '', notes: '' });
    setEditingId(null);
  };

  const openEdit = (item) => {
    setFormData({
      broker_id: item.broker_id || '',
      booking_id: item.booking_id || '',
      commission: item.commission || '',
      notes: item.notes || ''
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.broker_id) { Swal.fire('تنبيه', 'اختر السمسار', 'warning'); return; }
    if (!formData.commission || Number(formData.commission) <= 0) { Swal.fire('تنبيه', 'أدخل مبلغ العمولة', 'warning'); return; }
    setSubmitting(true);
    try {
      const payload = {
        broker_id: Number(formData.broker_id),
        booking_id: formData.booking_id ? Number(formData.booking_id) : null,
        commission: Number(formData.commission),
        notes: formData.notes
      };
      if (editingId) {
        await api.put(`/broker-commissions/${editingId}`, payload);
        Swal.fire('تم التحديث', 'تم تحديث العمولة', 'success');
      } else {
        await api.post('/broker-commissions', payload);
        Swal.fire('تم الإضافة', 'تم إضافة العمولة', 'success');
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
      await api.put(`/broker-commissions/${id}/pay`);
      Swal.fire('تم الدفع', 'تم دفع العمولة', 'success');
      load();
    } catch { Swal.fire('خطأ', 'فشل دفع العمولة', 'error'); }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'تأكيد الحذف', text: 'سيتم حذف هذه العمولة', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/broker-commissions/${id}`).then(() => load());
    });
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">عمولات السمسرة</h6>
        <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-plus-lg"></i> إضافة عمولة
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <label className="form-label small">السمسار</label>
              <select className="form-select" value={brokerFilter} onChange={e => setBrokerFilter(e.target.value)}>
                <option value="">جميع السماسرة</option>
                {brokersList.map(b => (
                  <option key={b.id} value={b.id}>{b.full_name || b.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small">حالة الدفع</label>
              <select className="form-select" value={paidFilter} onChange={e => setPaidFilter(e.target.value)}>
                <option value="">الكل</option>
                <option value="1">مدفوع</option>
                <option value="0">غير مدفوع</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setBrokerFilter(''); setPaidFilter(''); }}>
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
              <tr><th>السمسار</th><th>رقم الحجز</th><th>العمولة</th><th>مدفوع</th><th>تاريخ الدفع</th><th>ملاحظات</th><th></th></tr>
            </thead>
            <tbody>
              {commissions.map(c => (
                <tr key={c.id}>
                  <td className="fw-semibold">{c.broker_name}</td>
                  <td><code>{c.booking_id || '-'}</code></td>
                  <td className="fw-bold text-success">{Number(c.commission).toLocaleString()}</td>
                  <td>{c.paid ? <span className="badge bg-success">مدفوع</span> : <span className="badge bg-warning text-dark">غير مدفوع</span>}</td>
                  <td>{c.paid_at ? new Date(c.paid_at).toLocaleDateString('ar-SA') : '-'}</td>
                  <td>{c.notes || '-'}</td>
                  <td>
                    {!c.paid && (
                      <button className="btn btn-sm btn-outline-success me-1" onClick={() => handlePay(c.id)} title="دفع">
                        <i className="bi bi-check-circle"></i>
                      </button>
                    )}
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openEdit(c)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {commissions.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-4">لا توجد عمولات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-cash-coin me-2"></i>{editingId ? 'تعديل العمولة' : 'إضافة عمولة جديدة'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">السمسار <span className="text-danger">*</span></label>
                    <select className="form-select" value={formData.broker_id} onChange={e => setFormData({ ...formData, broker_id: e.target.value })} required>
                      <option value="">اختر السمسار</option>
                      {brokersList.map(b => (
                        <option key={b.id} value={b.id}>{b.full_name || b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">رقم الحجز</label>
                    <input type="number" className="form-control" value={formData.booking_id} onChange={e => setFormData({ ...formData, booking_id: e.target.value })} placeholder="رقم الحجز" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">قيمة العمولة <span className="text-danger">*</span></label>
                    <input type="number" className="form-control" value={formData.commission} onChange={e => setFormData({ ...formData, commission: e.target.value })} min="0" step="0.01" required />
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
    </>
  );
}
