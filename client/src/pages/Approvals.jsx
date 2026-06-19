import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

const Approvals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [requestTypeFilter, setRequestTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState({
    request_type: 'other',
    request_id: '',
    title: '',
    description: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ pending: 0, approvedToday: 0 });

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (requestTypeFilter) params.append('request_type', requestTypeFilter);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/approvals?${params.toString()}`);
      setApprovals(res.data.rows || []);
    } catch (err) {
      Swal.fire('خطأ', 'فشل تحميل الموافقات', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, requestTypeFilter, statusFilter]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/approvals/stats');
      setStats(res.data || { pending: 0, approvedToday: 0 });
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ request_type: 'other', request_id: '', title: '', description: '', notes: '' });
    setEditId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditId(item.id);
    setFormData({
      request_type: item.request_type || 'other',
      request_id: item.request_id || '',
      title: item.title || '',
      description: item.description || '',
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      Swal.fire('تنبيه', 'أدخل العنوان', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      if (editId) {
        await api.put(`/approvals/${editId}`, formData);
        Swal.fire({ title: 'تم التحديث', text: 'تم تحديث الموافقة بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/approvals', formData);
        Swal.fire({ title: 'تم الإضافة', text: 'تم إضافة الموافقة بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      }
      setShowModal(false);
      resetForm();
      fetchApprovals();
      fetchStats();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل حفظ الموافقة', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, title) => {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `سيتم حذف الموافقة: ${title}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/approvals/${id}`);
          Swal.fire('تم الحذف', 'تم حذف الموافقة بنجاح', 'success');
          fetchApprovals();
          fetchStats();
        } catch (err) {
          Swal.fire('خطأ', 'فشل حذف الموافقة', 'error');
        }
      }
    });
  };

  const handleApprove = async (id) => {
    Swal.fire({
      title: 'تأكيد الموافقة',
      text: 'هل أنت متأكد من الموافقة على هذا الطلب؟',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'موافقة',
      cancelButtonText: 'إلغاء'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.put(`/approvals/${id}/approve`);
          Swal.fire({ title: 'تم', text: 'تمت الموافقة بنجاح', icon: 'success', timer: 1500, showConfirmButton: false });
          fetchApprovals();
          fetchStats();
        } catch (err) {
          Swal.fire('خطأ', 'فشل الموافقة', 'error');
        }
      }
    });
  };

  const openRejectModal = (id) => {
    setRejectId(id);
    setRejectNotes('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    try {
      await api.put(`/approvals/${rejectId}/reject`, { notes: rejectNotes });
      Swal.fire({ title: 'تم', text: 'تم الرفض', icon: 'info', timer: 1500, showConfirmButton: false });
      setShowRejectModal(false);
      setRejectId(null);
      setRejectNotes('');
      fetchApprovals();
      fetchStats();
    } catch (err) {
      Swal.fire('خطأ', 'فشل الرفض', 'error');
    }
  };

  const getRequestTypeBadge = (type) => {
    const map = { booking: 'bg-primary', discount: 'bg-success', quotation: 'bg-info', contract: 'bg-warning text-dark', other: 'bg-secondary' };
    const labels = { booking: 'حجز', discount: 'خصم', quotation: 'عرض سعر', contract: 'عقد', other: 'أخرى' };
    return <span className={`badge ${map[type] || 'bg-secondary'}`}>{labels[type] || type}</span>;
  };

  const getStatusBadge = (status) => {
    const map = { pending: 'bg-warning text-dark', approved: 'bg-success', rejected: 'bg-danger' };
    const labels = { pending: 'معلق', approved: 'تمت الموافقة', rejected: 'مرفوض' };
    return <span className={`badge ${map[status] || 'bg-secondary'}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-check-circle me-2"></i>
          الموافقات
        </h4>
        <button className="btn btn-primary" onClick={openAddModal}>
          <i className="bi bi-plus-lg me-1"></i>
          إضافة موافقة
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card text-center border-warning h-100">
            <div className="card-body">
              <div className="fs-1 fw-bold text-warning">{stats.pending}</div>
              <div className="text-muted">قيد الانتظار</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center border-success h-100">
            <div className="card-body">
              <div className="fs-1 fw-bold text-success">{stats.approvedToday}</div>
              <div className="text-muted">تمت الموافقة اليوم</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">بحث</label>
              <input type="text" className="form-control" placeholder="بحث في العنوان..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">نوع الطلب</label>
              <select className="form-select" value={requestTypeFilter} onChange={(e) => setRequestTypeFilter(e.target.value)}>
                <option value="">الكل</option>
                <option value="booking">حجز</option>
                <option value="discount">خصم</option>
                <option value="quotation">عرض سعر</option>
                <option value="contract">عقد</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">الحالة</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">الكل</option>
                <option value="pending">معلق</option>
                <option value="approved">تمت الموافقة</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setRequestTypeFilter(''); setStatusFilter(''); }}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>
                إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">جاري التحميل...</span>
              </div>
            </div>
          ) : approvals.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              لا توجد موافقات
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>العنوان</th>
                    <th>النوع</th>
                    <th>المقدم</th>
                    <th>الحالة</th>
                    <th>تاريخ الطلب</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((item) => (
                    <tr key={item.id}>
                      <td className="fw-bold">{item.title}</td>
                      <td>{getRequestTypeBadge(item.request_type)}</td>
                      <td>{item.requested_by_name || <span className="text-muted">-</span>}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>{item.created_at ? new Date(item.created_at).toLocaleDateString('ar-SA') : '-'}</td>
                      <td>
                        <div className="d-flex gap-1">
                          {item.status === 'pending' && (
                            <>
                              <button className="btn btn-sm btn-success" title="موافقة" onClick={() => handleApprove(item.id)}>
                                <i className="bi bi-check-lg me-1"></i>موافقة
                              </button>
                              <button className="btn btn-sm btn-danger" title="رفض" onClick={() => openRejectModal(item.id)}>
                                <i className="bi bi-x-lg me-1"></i>رفض
                              </button>
                            </>
                          )}
                          <button className="btn btn-sm btn-outline-warning" title="تعديل" onClick={() => openEditModal(item)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" title="حذف" onClick={() => handleDelete(item.id, item.title)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                <h5 className="modal-title">
                  <i className={`bi ${editId ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
                  {editId ? 'تعديل الموافقة' : 'إضافة موافقة جديدة'}
                </h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">العنوان <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="title" value={formData.title} onChange={handleChange} placeholder="عنوان الموافقة..." required />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">نوع الطلب</label>
                      <select className="form-select" name="request_type" value={formData.request_type} onChange={handleChange}>
                        <option value="booking">حجز</option>
                        <option value="discount">خصم</option>
                        <option value="quotation">عرض سعر</option>
                        <option value="contract">عقد</option>
                        <option value="other">أخرى</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">رقم الطلب</label>
                      <input type="text" className="form-control" name="request_id" value={formData.request_id} onChange={handleChange} placeholder="رقم الطلب..." />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">الوصف</label>
                    <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} rows="2" placeholder="وصف الطلب..."></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">ملاحظات</label>
                    <textarea className="form-control" name="notes" value={formData.notes} onChange={handleChange} rows="2" placeholder="ملاحظات إضافية..."></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? (
                      <><span className="spinner-border spinner-border-sm me-1"></span>جاري الحفظ...</>
                    ) : (
                      <><i className="bi bi-check-lg me-1"></i>{editId ? 'تحديث الموافقة' : 'حفظ الموافقة'}</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-x-circle me-2"></i>
                  سبب الرفض
                </h5>
                <button type="button" className="btn-close" onClick={() => { setShowRejectModal(false); setRejectId(null); setRejectNotes(''); }}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">ملاحظات الرفض</label>
                  <textarea className="form-control" rows="3" value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} placeholder="اذكر سبب الرفض..."></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowRejectModal(false); setRejectId(null); setRejectNotes(''); }}>إلغاء</button>
                <button type="button" className="btn btn-danger" onClick={handleReject}>
                  <i className="bi bi-x-lg me-1"></i>تأكيد الرفض
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
