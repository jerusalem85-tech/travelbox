import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

const FollowUps = () => {
  const [followUps, setFollowUps] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '', customer_id: '', lead_id: '', booking_id: '',
    type: 'call', priority: 'medium', description: '',
    assigned_to: '', due_date: '', notes: ''
  });

  const fetchFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('type', filterType);
      if (filterPriority) params.append('priority', filterPriority);
      const res = await api.get(`/follow-ups?${params.toString()}`);
      setFollowUps(res.data.rows || res.data || []);
    } catch {
      Swal.fire('خطأ', 'فشل تحميل المتابعات', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterType, filterPriority]);

  useEffect(() => { fetchFollowUps(); }, [fetchFollowUps]);

  useEffect(() => {
    api.get('/follow-ups/users').then(r => setUsers(r.data.rows || r.data || [])).catch(() => {});
    api.get('/follow-ups/customers').then(r => setCustomers(r.data.rows || r.data || [])).catch(() => {});
  }, []);

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const resetForm = () => {
    setFormData({ title: '', customer_id: '', lead_id: '', booking_id: '', type: 'call', priority: 'medium', description: '', assigned_to: '', due_date: '', notes: '' });
    setEditId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (f) => {
    setEditId(f.id);
    setFormData({
      title: f.title || '',
      customer_id: f.customer_id || '',
      lead_id: f.lead_id || '',
      booking_id: f.booking_id || '',
      type: f.type || 'call',
      priority: f.priority || 'medium',
      description: f.description || '',
      assigned_to: f.assigned_to || '',
      due_date: f.due_date ? f.due_date.split('T')[0] : '',
      notes: f.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.customer_id) {
      Swal.fire('تنبيه', 'العنوان والعميل مطلوبان', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        ...formData,
        customer_id: Number(formData.customer_id),
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
        lead_id: formData.lead_id ? Number(formData.lead_id) : null,
        booking_id: formData.booking_id ? Number(formData.booking_id) : null
      };
      if (editId) {
        await api.put(`/follow-ups/${editId}`, body);
        Swal.fire({ title: 'تم التحديث', text: 'تم تحديث المتابعة بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/follow-ups', body);
        Swal.fire({ title: 'تم الإضافة', text: 'تم إضافة المتابعة بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      }
      setShowModal(false);
      resetForm();
      fetchFollowUps();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.put(`/follow-ups/${id}/complete`);
      Swal.fire({ title: 'تم', text: 'تم إكمال المتابعة', icon: 'success', timer: 2000, showConfirmButton: false });
      fetchFollowUps();
    } catch {
      Swal.fire('خطأ', 'فشل إكمال المتابعة', 'error');
    }
  };

  const handleDelete = (id, title) => {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `سيتم حذف المتابعة: ${title}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          await api.delete(`/follow-ups/${id}`);
          Swal.fire('تم الحذف', 'تم حذف المتابعة بنجاح', 'success');
          fetchFollowUps();
        } catch {
          Swal.fire('خطأ', 'فشل الحذف', 'error');
        }
      }
    });
  };

  const typeMap = { call: 'اتصال', email: 'بريد', visit: 'زيارة', meeting: 'اجتماع', other: 'أخرى' };
  const typeColor = { call: 'primary', email: 'info', visit: 'success', meeting: 'warning', other: 'secondary' };
  const priorityLabel = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };
  const priorityColor = { high: 'danger', medium: 'warning text-dark', low: 'info' };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0"><i className="bi bi-bell me-2"></i>المتابعات</h4>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-1"></i>إضافة متابعة</button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">بحث</label>
              <input type="text" className="form-control" placeholder="عنوان أو اسم عميل..." value={search} onChange={e => { setSearch(e.target.value); }} />
            </div>
            <div className="col-md-2">
              <label className="form-label">الحالة</label>
              <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">الكل</option>
                <option value="pending">معلق</option>
                <option value="completed">مكتملة</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">النوع</label>
              <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">الكل</option>
                {Object.entries(typeMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">الأولوية</label>
              <select className="form-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                <option value="">الكل</option>
                {Object.entries(priorityLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setFilterStatus(''); setFilterType(''); setFilterPriority(''); }}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">جاري التحميل...</span></div></div>
          ) : followUps.length === 0 ? (
            <div className="text-center py-4 text-muted"><i className="bi bi-inbox fs-1 d-block mb-2"></i>لا توجد متابعات</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>العنوان</th>
                    <th>العميل</th>
                    <th>النوع</th>
                    <th>الأولوية</th>
                    <th>الحالة</th>
                    <th>مسند إلى</th>
                    <th>تاريخ الاستحقاق</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {followUps.map(f => {
                    const isOverdue = f.due_date && new Date(f.due_date) < new Date() && f.status === 'pending';
                    return (
                      <tr key={f.id} className={isOverdue ? 'table-danger' : ''}>
                        <td className="fw-bold">{f.title}</td>
                        <td>{f.customer_name || <span className="text-muted">-</span>}</td>
                        <td><span className={`badge bg-${typeColor[f.type] || 'secondary'}`}>{typeMap[f.type] || f.type}</span></td>
                        <td><span className={`badge bg-${priorityColor[f.priority] || 'secondary'}`}>{priorityLabel[f.priority] || f.priority}</span></td>
                        <td>
                          {f.status === 'completed' ? (
                            <span className="badge bg-success">مكتملة</span>
                          ) : (
                            <span className={`badge ${isOverdue ? 'bg-danger' : 'bg-secondary'}`}>
                              {isOverdue ? 'متأخرة' : 'معلق'}
                            </span>
                          )}
                        </td>
                        <td>{f.assigned_to_name || <span className="text-muted">-</span>}</td>
                        <td>
                          {f.due_date ? new Date(f.due_date).toLocaleDateString('ar-SA') : '-'}
                          {isOverdue && <i className="bi bi-exclamation-triangle text-danger ms-1" title="متأخرة"></i>}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            {f.status === 'pending' && (
                              <button className="btn btn-sm btn-outline-success" onClick={() => handleComplete(f.id)} title="إكمال">
                                <i className="bi bi-check-lg"></i>
                              </button>
                            )}
                            <button className="btn btn-sm btn-outline-warning" onClick={() => openEdit(f)} title="تعديل">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(f.id, f.title)} title="حذف">
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className={`bi ${editId ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>{editId ? 'تعديل المتابعة' : 'إضافة متابعة جديدة'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">العنوان <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="title" value={formData.title} onChange={handleChange} required />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">العميل <span className="text-danger">*</span></label>
                      <select className="form-select" name="customer_id" value={formData.customer_id} onChange={handleChange} required>
                        <option value="">اختر عميل</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name || c.full_name}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">العميل المحتمل</label>
                      <input type="number" className="form-control" name="lead_id" value={formData.lead_id} onChange={handleChange} placeholder="رقم..." />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">الحجز</label>
                      <input type="number" className="form-control" name="booking_id" value={formData.booking_id} onChange={handleChange} placeholder="رقم..." />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">النوع</label>
                      <select className="form-select" name="type" value={formData.type} onChange={handleChange}>
                        {Object.entries(typeMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">الأولوية</label>
                      <select className="form-select" name="priority" value={formData.priority} onChange={handleChange}>
                        {Object.entries(priorityLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">مسند إلى</label>
                      <select className="form-select" name="assigned_to" value={formData.assigned_to} onChange={handleChange}>
                        <option value="">اختر مستخدم</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">تاريخ الاستحقاق</label>
                      <input type="date" className="form-control" name="due_date" value={formData.due_date} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">الوصف</label>
                    <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} rows="2"></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">ملاحظات</label>
                    <textarea className="form-control" name="notes" value={formData.notes} onChange={handleChange} rows="2"></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span>جاري الحفظ...</> : <><i className="bi bi-check-lg me-1"></i>{editId ? 'تحديث' : 'حفظ'}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUps;
