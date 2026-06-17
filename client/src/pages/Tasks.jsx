import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    related_to_type: '',
    related_to_id: '',
    priority: 'medium',
    due_date: '',
    status: 'pending',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const limit = 10;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (assignedToFilter) params.append('assigned_to', assignedToFilter);
      const res = await api.get(`/tasks?${params.toString()}`);
      setTasks(res.data.rows || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      Swal.fire('خطأ', 'فشل تحميل المهام', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, priorityFilter, assignedToFilter]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/tasks/users');
      setUsers(res.data.rows || res.data || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assigned_to: '',
      related_to_type: '',
      related_to_id: '',
      priority: 'medium',
      due_date: '',
      status: 'pending',
      notes: ''
    });
    setEditId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditId(task.id);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      assigned_to: task.assigned_to || '',
      related_to_type: task.related_to_type || '',
      related_to_id: task.related_to_id || '',
      priority: task.priority || 'medium',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      status: task.status || 'pending',
      notes: task.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      Swal.fire('تنبيه', 'أدخل عنوان المهمة', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        ...formData,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
        related_to_id: formData.related_to_id ? Number(formData.related_to_id) : null
      };

      if (editId) {
        await api.put(`/tasks/${editId}`, body);
        Swal.fire({ title: 'تم التحديث', text: 'تم تحديث المهمة بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/tasks', body);
        Swal.fire({ title: 'تم الإضافة', text: 'تم إضافة المهمة بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      }

      setShowModal(false);
      resetForm();
      fetchTasks();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل حفظ المهمة', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, title) => {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `سيتم حذف المهمة: ${title}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/tasks/${id}`);
          Swal.fire('تم الحذف', 'تم حذف المهمة بنجاح', 'success');
          fetchTasks();
        } catch (err) {
          Swal.fire('خطأ', 'فشل حذف المهمة', 'error');
        }
      }
    });
  };

  const handleQuickStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'pending' ? 'in_progress' : currentStatus === 'in_progress' ? 'completed' : 'pending';
    try {
      await api.put(`/tasks/${id}`, { status: nextStatus });
      fetchTasks();
    } catch (err) {
      Swal.fire('خطأ', 'فشل تحديث الحالة', 'error');
    }
  };

  const getPriorityBadge = (priority) => {
    const map = { high: 'bg-danger', medium: 'bg-warning text-dark', low: 'bg-info' };
    const labels = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };
    return <span className={`badge ${map[priority] || 'bg-secondary'}`}>{labels[priority] || priority}</span>;
  };

  const getStatusBadge = (status) => {
    const map = { pending: 'bg-secondary', in_progress: 'bg-primary', completed: 'bg-success' };
    const labels = { pending: 'معلق', in_progress: 'قيد التنفيذ', completed: 'مكتملة' };
    return <span className={`badge ${map[status] || 'bg-secondary'}`}>{labels[status] || status}</span>;
  };

  const getStatusIcon = (status) => {
    const map = { pending: 'bi-circle', in_progress: 'bi-arrow-repeat', completed: 'bi-check-circle-fill' };
    return map[status] || 'bi-circle';
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-check2-square me-2"></i>
          المهام
        </h4>
        <button className="btn btn-primary" onClick={openAddModal}>
          <i className="bi bi-plus-lg me-1"></i>
          إضافة مهمة
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">بحث</label>
              <input
                type="text"
                className="form-control"
                placeholder="بحث في العنوان..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">الحالة</label>
              <select className="form-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">الكل</option>
                <option value="pending">معلق</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="completed">مكتملة</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">الأولوية</label>
              <select className="form-select" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
                <option value="">الكل</option>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">مسند إلى</label>
              <select className="form-select" value={assignedToFilter} onChange={(e) => { setAssignedToFilter(e.target.value); setPage(1); }}>
                <option value="">الكل</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); setAssignedToFilter(''); setPage(1); }}>
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
          ) : tasks.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              لا توجد مهام
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>العنوان</th>
                      <th>مسند إلى</th>
                      <th>الأولوية</th>
                      <th>الحالة</th>
                      <th>تاريخ الاستحقاق</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t) => (
                      <tr key={t.id}>
                        <td className="fw-bold">{t.title}</td>
                        <td>{t.assigned_to_name || <span className="text-muted">-</span>}</td>
                        <td>{getPriorityBadge(t.priority)}</td>
                        <td>{getStatusBadge(t.status)}</td>
                        <td>{t.due_date ? new Date(t.due_date).toLocaleDateString('ar-SA') : '-'}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => handleQuickStatus(t.id, t.status)} title="تغيير الحالة">
                              <i className={`bi ${getStatusIcon(t.status)}`}></i>
                            </button>
                            <button className="btn btn-sm btn-outline-warning" onClick={() => openEditModal(t)} title="تعديل">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(t.id, t.title)} title="حذف">
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <nav>
                  <ul className="pagination justify-content-center mb-0">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(page - 1)}>
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                      .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <li className="page-item disabled"><span className="page-link">...</span></li>
                          )}
                          <li className={`page-item ${page === p ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                          </li>
                        </React.Fragment>
                      ))}
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(page + 1)}>
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
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
                  {editId ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
                </h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">العنوان <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="title" value={formData.title} onChange={handleChange} placeholder="عنوان المهمة..." required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">الوصف</label>
                    <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} rows="2" placeholder="وصف المهمة..."></textarea>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">مسند إلى</label>
                      <select className="form-select" name="assigned_to" value={formData.assigned_to} onChange={handleChange}>
                        <option value="">اختر مستخدم</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">الأولوية</label>
                      <select className="form-select" name="priority" value={formData.priority} onChange={handleChange}>
                        <option value="high">عالية</option>
                        <option value="medium">متوسطة</option>
                        <option value="low">منخفضة</option>
                      </select>
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">الحالة</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
                        <option value="pending">معلق</option>
                        <option value="in_progress">قيد التنفيذ</option>
                        <option value="completed">مكتملة</option>
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">تاريخ الاستحقاق</label>
                      <input type="date" className="form-control" name="due_date" value={formData.due_date} onChange={handleChange} />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">مرتبط بـ</label>
                      <select className="form-select" name="related_to_type" value={formData.related_to_type} onChange={handleChange}>
                        <option value="">لا شيء</option>
                        <option value="booking">حجز</option>
                        <option value="customer">عميل</option>
                        <option value="lead">عميل محتمل</option>
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">رقم المرتبط</label>
                      <input type="number" className="form-control" name="related_to_id" value={formData.related_to_id} onChange={handleChange} placeholder="رقم المعرف..." />
                    </div>
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
                      <><i className="bi bi-check-lg me-1"></i>{editId ? 'تحديث المهمة' : 'حفظ المهمة'}</>
                    )}
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

export default Tasks;
