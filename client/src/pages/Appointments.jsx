import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    customer_id: '',
    appointment_date: '',
    appointment_time: '',
    duration: '30',
    type: 'meeting',
    assigned_to: '',
    description: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.append('appointment_date', dateFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      const res = await api.get(`/appointments?${params.toString()}`);
      setAppointments(res.data.rows || []);
    } catch (err) {
      Swal.fire('خطأ', 'فشل تحميل المواعيد', 'error');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter, typeFilter]);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/appointments/customers');
      setCustomers(res.data.rows || res.data || []);
    } catch (err) {
      console.error('Failed to load customers', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/appointments/users');
      setUsers(res.data.rows || res.data || []);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchCustomers();
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      customer_id: '',
      appointment_date: '',
      appointment_time: '',
      duration: '30',
      type: 'meeting',
      assigned_to: '',
      description: '',
      notes: ''
    });
    setEditId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (appt) => {
    setEditId(appt.id);
    setFormData({
      title: appt.title || '',
      customer_id: appt.customer_id || '',
      appointment_date: appt.appointment_date ? appt.appointment_date.split('T')[0] : '',
      appointment_time: appt.appointment_time || '',
      duration: appt.duration ? String(appt.duration) : '30',
      type: appt.type || 'meeting',
      assigned_to: appt.assigned_to || '',
      description: appt.description || '',
      notes: appt.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.appointment_date) {
      Swal.fire('تنبيه', 'أدخل العنوان والتاريخ', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        ...formData,
        duration: Number(formData.duration),
        customer_id: formData.customer_id ? Number(formData.customer_id) : null,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null
      };
      if (editId) {
        await api.put(`/appointments/${editId}`, body);
        Swal.fire({ title: 'تم التحديث', text: 'تم تحديث الموعد بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/appointments', body);
        Swal.fire({ title: 'تم الإضافة', text: 'تم إضافة الموعد بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      }
      setShowModal(false);
      resetForm();
      fetchAppointments();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل حفظ الموعد', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, title) => {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `سيتم حذف الموعد: ${title}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/appointments/${id}`);
          Swal.fire('تم الحذف', 'تم حذف الموعد بنجاح', 'success');
          fetchAppointments();
        } catch (err) {
          Swal.fire('خطأ', 'فشل حذف الموعد', 'error');
        }
      }
    });
  };

  const handleQuickStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      Swal.fire({ title: 'تم التحديث', text: 'تم تحديث الحالة', icon: 'success', timer: 1500, showConfirmButton: false });
      fetchAppointments();
    } catch (err) {
      Swal.fire('خطأ', 'فشل تحديث الحالة', 'error');
    }
  };

  const getTypeBadge = (type) => {
    const map = { meeting: 'bg-primary', call: 'bg-info', site_visit: 'bg-warning text-dark', other: 'bg-secondary' };
    const labels = { meeting: 'اجتماع', call: 'اتصال', site_visit: 'زيارة ميدانية', other: 'أخرى' };
    return <span className={`badge ${map[type] || 'bg-secondary'}`}>{labels[type] || type}</span>;
  };

  const getStatusBadge = (status) => {
    const map = { scheduled: 'bg-primary', completed: 'bg-success', cancelled: 'bg-danger' };
    const labels = { scheduled: 'مجدول', completed: 'مكتمل', cancelled: 'ملغي' };
    return <span className={`badge ${map[status] || 'bg-secondary'}`}>{labels[status] || status}</span>;
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const groupedByDate = {};
  appointments.forEach((appt) => {
    const d = appt.appointment_date ? appt.appointment_date.split('T')[0] : '';
    if (!groupedByDate[d]) groupedByDate[d] = [];
    groupedByDate[d].push(appt);
  });
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => a.localeCompare(b));

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-calendar-check me-2"></i>
          المواعيد
        </h4>
        <button className="btn btn-primary" onClick={openAddModal}>
          <i className="bi bi-plus-lg me-1"></i>
          إضافة موعد
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">التاريخ</label>
              <input type="date" className="form-control" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">الحالة</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">الكل</option>
                <option value="scheduled">مجدول</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">النوع</label>
              <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">الكل</option>
                <option value="meeting">اجتماع</option>
                <option value="call">اتصال</option>
                <option value="site_visit">زيارة ميدانية</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setDateFilter(''); setStatusFilter(''); setTypeFilter(''); }}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>
                إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">جاري التحميل...</span>
          </div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-4 text-muted">
          <i className="bi bi-inbox fs-1 d-block mb-2"></i>
          لا توجد مواعيد
        </div>
      ) : (
        sortedDates.map((date) => {
          const isToday = date === todayStr;
          return (
            <div key={date} className={`card mb-3 ${isToday ? 'border-primary' : ''}`}>
              <div className={`card-header d-flex align-items-center ${isToday ? 'bg-primary text-white' : ''}`}>
                <i className={`bi ${isToday ? 'bi-calendar-check-fill' : 'bi-calendar3'} me-2`}></i>
                <span className="fw-bold">
                  {date ? new Date(date + 'T00:00:00').toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'بدون تاريخ'}
                </span>
                {isToday && <span className="badge bg-light text-primary me-2">اليوم</span>}
                <span className="badge bg-secondary ms-auto">{groupedByDate[date].length}</span>
              </div>
              <div className="card-body">
                {groupedByDate[date].map((appt) => (
                  <div key={appt.id} className="d-flex align-items-start border-bottom pb-2 mb-2">
                    <div className="flex-shrink-0 text-center ms-3" style={{ minWidth: '60px' }}>
                      <div className="fw-bold fs-5">{appt.appointment_time || '--:--'}</div>
                      <small className="text-muted">{appt.duration} دقيقة</small>
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-bold">{appt.title}</div>
                      <div className="small text-muted">
                        <i className="bi bi-person me-1"></i>{appt.customer_name || <span className="text-muted">-</span>}
                        {appt.assigned_to_name && (
                          <><span className="mx-2">|</span><i className="bi bi-person-badge me-1"></i>{appt.assigned_to_name}</>
                        )}
                      </div>
                      <div className="mt-1 d-flex gap-2 align-items-center">
                        {getTypeBadge(appt.type)}
                        {getStatusBadge(appt.status)}
                      </div>
                    </div>
                    <div className="flex-shrink-0 d-flex gap-1">
                      {appt.status === 'scheduled' && (
                        <>
                          <button className="btn btn-sm btn-outline-success" title="إكمال" onClick={() => handleQuickStatus(appt.id, 'completed')}>
                            <i className="bi bi-check-lg"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" title="إلغاء" onClick={() => handleQuickStatus(appt.id, 'cancelled')}>
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </>
                      )}
                      <button className="btn btn-sm btn-outline-warning" title="تعديل" onClick={() => openEditModal(appt)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" title="حذف" onClick={() => handleDelete(appt.id, appt.title)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi ${editId ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
                  {editId ? 'تعديل الموعد' : 'إضافة موعد جديد'}
                </h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">العنوان <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="title" value={formData.title} onChange={handleChange} placeholder="عنوان الموعد..." required />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">العميل</label>
                      <select className="form-select" name="customer_id" value={formData.customer_id} onChange={handleChange}>
                        <option value="">اختر عميل</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">مسند إلى</label>
                      <select className="form-select" name="assigned_to" value={formData.assigned_to} onChange={handleChange}>
                        <option value="">اختر مستخدم</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">التاريخ <span className="text-danger">*</span></label>
                      <input type="date" className="form-control" name="appointment_date" value={formData.appointment_date} onChange={handleChange} required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">الوقت</label>
                      <input type="time" className="form-control" name="appointment_time" value={formData.appointment_time} onChange={handleChange} />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">المدة</label>
                      <select className="form-select" name="duration" value={formData.duration} onChange={handleChange}>
                        <option value="15">15 دقيقة</option>
                        <option value="30">30 دقيقة</option>
                        <option value="45">45 دقيقة</option>
                        <option value="60">60 دقيقة</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">النوع</label>
                      <select className="form-select" name="type" value={formData.type} onChange={handleChange}>
                        <option value="meeting">اجتماع</option>
                        <option value="call">اتصال</option>
                        <option value="site_visit">زيارة ميدانية</option>
                        <option value="other">أخرى</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">الوصف</label>
                    <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} rows="2" placeholder="وصف الموعد..."></textarea>
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
                      <><i className="bi bi-check-lg me-1"></i>{editId ? 'تحديث الموعد' : 'حفظ الموعد'}</>
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

export default Appointments;
