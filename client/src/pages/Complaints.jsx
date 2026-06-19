import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

const priorityMap = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };
const priorityColor = { high: 'danger', medium: 'warning', low: 'info' };
const statusMap = { open: 'مفتوحة', in_progress: 'قيد المعالجة', resolved: 'تم الحل', closed: 'مغلقة' };
const statusColor = { open: 'secondary', in_progress: 'primary', resolved: 'success', closed: 'dark' };

export default function Complaints() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '', booking_id: '', subject: '', description: '', priority: 'medium', assigned_to: ''
  });

  const load = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      const res = await api.get('/complaints', { params });
      setRows(res.data.rows || res.data || []);
    } catch { Swal.fire('خطأ', 'فشل تحميل الشكاوى', 'error'); }
  };

  useEffect(() => { load(); }, [search, filterStatus, filterPriority]);

  useEffect(() => {
    api.get('/complaints/customers').then(r => setCustomers(r.data.rows || r.data || [])).catch(() => {});
    api.get('/users').then(r => setUsers(r.data.rows || r.data || [])).catch(() => {});
  }, []);

  const resetForm = () => {
    setFormData({ customer_id: '', booking_id: '', subject: '', description: '', priority: 'medium', assigned_to: '' });
    setEditId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (c) => {
    setEditId(c.id);
    setFormData({
      customer_id: c.customer_id || '',
      booking_id: c.booking_id || '',
      subject: c.subject || '',
      description: c.description || '',
      priority: c.priority || 'medium',
      assigned_to: c.assigned_to || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) { Swal.fire('تنبيه', 'اختر العميل', 'warning'); return; }
    if (!formData.subject.trim()) { Swal.fire('تنبيه', 'العنوان مطلوب', 'warning'); return; }
    setSubmitting(true);
    try {
      const body = {
        ...formData,
        customer_id: Number(formData.customer_id),
        booking_id: formData.booking_id ? Number(formData.booking_id) : null,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null
      };
      if (editId) {
        await api.put(`/complaints/${editId}`, body);
        Swal.fire('تم التحديث', 'تم تحديث الشكوى', 'success');
      } else {
        await api.post('/complaints', body);
        Swal.fire('تم الإضافة', 'تم إضافة الشكوى', 'success');
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally { setSubmitting(false); }
  };

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === 'resolved') {
      Swal.fire({
        title: 'حل الشكوى',
        input: 'textarea',
        inputLabel: 'وصف الحل',
        inputPlaceholder: 'أدخل تفاصيل الحل...',
        showCancelButton: true,
        confirmButtonText: 'تم الحل',
        cancelButtonText: 'إلغاء'
      }).then(r => {
        if (r.isConfirmed && r.value) {
          api.put(`/complaints/${id}/resolve`, { resolution: r.value }).then(() => load());
        }
      });
    } else {
      api.put(`/complaints/${id}`, { status: newStatus }).then(() => load()).catch(() => Swal.fire('خطأ', 'فشل تغيير الحالة', 'error'));
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'تأكيد الحذف', text: 'سيتم حذف الشكوى', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/complaints/${id}`).then(() => load());
    });
  };

  const statusFlow = (status) => {
    if (status === 'open') return 'in_progress';
    if (status === 'in_progress') return 'resolved';
    if (status === 'resolved') return 'closed';
    return null;
  };

  const statusActionLabel = (status) => {
    if (status === 'open') return 'بدء المعالجة';
    if (status === 'in_progress') return 'حل';
    if (status === 'resolved') return 'إغلاق';
    return '';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0"><i className="bi bi-exclamation-triangle me-2"></i>إدارة الشكاوى</h5>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="bi bi-plus-lg"></i> شكوى جديدة
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <label className="form-label">بحث</label>
              <input type="text" className="form-control" placeholder="بحث بالموضوع..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">الحالة</label>
              <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">الكل</option>
                {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">الأولوية</label>
              <select className="form-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                <option value="">الكل</option>
                {Object.entries(priorityMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); }}>
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
                <th>الموضوع</th>
                <th>العميل</th>
                <th>الحجز</th>
                <th>الأولوية</th>
                <th>الحالة</th>
                <th>مسند إلى</th>
                <th>تاريخ الإضافة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id}>
                  <td className="fw-semibold">{c.subject}</td>
                  <td>{c.customer_name || c.customer_id}</td>
                  <td>{c.booking_id || '-'}</td>
                  <td><span className={`badge bg-${priorityColor[c.priority] || 'secondary'}`}>{priorityMap[c.priority] || c.priority}</span></td>
                  <td><span className={`badge bg-${statusColor[c.status] || 'secondary'}`}>{statusMap[c.status] || c.status}</span></td>
                  <td>{c.assigned_to_name || '-'}</td>
                  <td className="small">{c.created_at ? new Date(c.created_at).toLocaleDateString('ar-SA') : '-'}</td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {statusFlow(c.status) && (
                        <button className={`btn btn-sm btn-outline-${statusColor[statusFlow(c.status)]}`}
                          onClick={() => handleStatusChange(c.id, statusFlow(c.status))}>
                          {statusActionLabel(c.status)}
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline-warning" onClick={() => openEdit(c)} title="تعديل">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)} title="حذف">
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="8" className="text-center text-muted py-4">لا توجد شكاوى</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className={`bi ${editId ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>{editId ? 'تعديل الشكوى' : 'إضافة شكوى جديدة'}</h5>
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
                      <label className="form-label">رقم الحجز (اختياري)</label>
                      <input type="number" className="form-control" placeholder="رقم الحجز..." value={formData.booking_id} onChange={e => setFormData({ ...formData, booking_id: e.target.value })} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">الموضوع <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">الوصف</label>
                    <textarea className="form-control" rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الأولوية</label>
                      <select className="form-select" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                        {Object.entries(priorityMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">مسند إلى</label>
                      <select className="form-select" value={formData.assigned_to} onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}>
                        <option value="">اختر مستخدم</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name || u.full_name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span> جاري الحفظ...</> : <><i className="bi bi-check-lg me-1"></i> {editId ? 'تحديث' : 'حفظ'}</>}
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
