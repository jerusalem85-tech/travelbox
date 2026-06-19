import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

const PhoneDirectory = () => {
  const [contacts, setContacts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [emergencyFilter, setEmergencyFilter] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    department: '',
    position: '',
    is_emergency: false,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (departmentFilter) params.append('department', departmentFilter);
      if (emergencyFilter) params.append('is_emergency', 'true');
      const res = await api.get(`/phone-directory?${params.toString()}`);
      setContacts(res.data.rows || []);
    } catch (err) {
      Swal.fire('خطأ', 'فشل تحميل دليل الهاتف', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, departmentFilter, emergencyFilter]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/phone-directory/departments');
      setDepartments(res.data.rows || res.data || []);
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const resetForm = () => {
    setFormData({ full_name: '', phone: '', email: '', department: '', position: '', is_emergency: false, notes: '' });
    setEditId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (contact) => {
    setEditId(contact.id);
    setFormData({
      full_name: contact.full_name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      department: contact.department || '',
      position: contact.position || '',
      is_emergency: Boolean(contact.is_emergency),
      notes: contact.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.phone.trim()) {
      Swal.fire('تنبيه', 'أدخل الاسم ورقم الهاتف', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      if (editId) {
        await api.put(`/phone-directory/${editId}`, formData);
        Swal.fire({ title: 'تم التحديث', text: 'تم تحديث جهة الاتصال بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/phone-directory', formData);
        Swal.fire({ title: 'تم الإضافة', text: 'تم إضافة جهة الاتصال بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      }
      setShowModal(false);
      resetForm();
      fetchContacts();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل حفظ جهة الاتصال', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, name) => {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `سيتم حذف: ${name}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/phone-directory/${id}`);
          Swal.fire('تم الحذف', 'تم حذف جهة الاتصال بنجاح', 'success');
          fetchContacts();
        } catch (err) {
          Swal.fire('خطأ', 'فشل حذف جهة الاتصال', 'error');
        }
      }
    });
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-telephone me-2"></i>
          دليل الهاتف
        </h4>
        <button className="btn btn-primary" onClick={openAddModal}>
          <i className="bi bi-plus-lg me-1"></i>
          إضافة جهة اتصال
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">بحث</label>
              <input
                type="text"
                className="form-control"
                placeholder="بحث في الاسم / الهاتف / البريد / القسم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">القسم</label>
              <select className="form-select" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                <option value="">الكل</option>
                {departments.map((d) => (
                  <option key={d.id || d} value={d.name || d}>{d.name || d}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="emergencyFilter"
                  checked={emergencyFilter}
                  onChange={(e) => setEmergencyFilter(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="emergencyFilter">طوارئ فقط</label>
              </div>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setDepartmentFilter(''); setEmergencyFilter(false); }}>
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
      ) : contacts.length === 0 ? (
        <div className="text-center py-4 text-muted">
          <i className="bi bi-inbox fs-1 d-block mb-2"></i>
          لا توجد جهات اتصال
        </div>
      ) : (
        <div className="row g-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="col-lg-4 col-md-6 col-12">
              <div className={`card h-100 ${contact.is_emergency ? 'border-danger' : ''}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <h5 className="card-title mb-1">{contact.full_name}</h5>
                    {contact.is_emergency && (
                      <span className="badge bg-danger"><i className="bi bi-exclamation-triangle-fill me-1"></i>طوارئ</span>
                    )}
                  </div>
                  {contact.position && <div className="text-muted small mb-2">{contact.position}</div>}
                  {contact.department && (
                    <span className="badge bg-info text-dark mb-2 d-inline-block">{contact.department}</span>
                  )}
                  <div className="mt-2">
                    {contact.phone && (
                      <div className="mb-1">
                        <a href={`tel:${contact.phone}`} className="text-decoration-none">
                          <i className="bi bi-telephone-fill me-1 text-primary"></i>{contact.phone}
                        </a>
                      </div>
                    )}
                    {contact.email && (
                      <div className="mb-1">
                        <a href={`mailto:${contact.email}`} className="text-decoration-none">
                          <i className="bi bi-envelope-fill me-1 text-primary"></i>{contact.email}
                        </a>
                      </div>
                    )}
                  </div>
                  {contact.notes && (
                    <div className="small text-muted mt-2 border-top pt-2">
                      <i className="bi bi-sticky me-1"></i>{contact.notes}
                    </div>
                  )}
                </div>
                <div className="card-footer bg-transparent d-flex gap-1 justify-content-end">
                  <button className="btn btn-sm btn-outline-warning" title="تعديل" onClick={() => openEditModal(contact)}>
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button className="btn btn-sm btn-outline-danger" title="حذف" onClick={() => handleDelete(contact.id, contact.full_name)}>
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi ${editId ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
                  {editId ? 'تعديل جهة اتصال' : 'إضافة جهة اتصال جديدة'}
                </h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الاسم <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="الاسم الكامل..." required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">رقم الهاتف <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleChange} placeholder="رقم الهاتف..." required />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">البريد الإلكتروني</label>
                      <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} placeholder="البريد الإلكتروني..." />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">القسم</label>
                      <input type="text" className="form-control" name="department" value={formData.department} onChange={handleChange} placeholder="القسم..." />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">المنصب</label>
                      <input type="text" className="form-control" name="position" value={formData.position} onChange={handleChange} placeholder="المنصب..." />
                    </div>
                    <div className="col-md-6 mb-3 d-flex align-items-end">
                      <div className="form-check">
                        <input type="checkbox" className="form-check-input" id="is_emergency" name="is_emergency" checked={formData.is_emergency} onChange={handleChange} />
                        <label className="form-check-label" htmlFor="is_emergency">رقم طوارئ</label>
                      </div>
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
                      <><i className="bi bi-check-lg me-1"></i>{editId ? 'تحديث جهة الاتصال' : 'حفظ جهة الاتصال'}</>
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

export default PhoneDirectory;
