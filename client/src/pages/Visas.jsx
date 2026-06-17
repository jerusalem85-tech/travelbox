import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

const Visas = () => {
  const [visas, setVisas] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '',
    booking_id: '',
    country: '',
    visa_type: 'tourist',
    application_date: '',
    issue_date: '',
    expiry_date: '',
    status: 'pending',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const limit = 10;

  const fetchVisas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/visas?${params.toString()}`);
      setVisas(res.data.rows || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      Swal.fire('خطأ', 'فشل تحميل التأشيرات', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/visas/customers');
      setCustomers(res.data.rows || res.data || []);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    }
  };

  useEffect(() => {
    fetchVisas();
  }, [fetchVisas]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      booking_id: '',
      country: '',
      visa_type: 'tourist',
      application_date: '',
      issue_date: '',
      expiry_date: '',
      status: 'pending',
      notes: ''
    });
    setEditId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (visa) => {
    setEditId(visa.id);
    setFormData({
      customer_id: visa.customer_id || '',
      booking_id: visa.booking_id || '',
      country: visa.country || '',
      visa_type: visa.visa_type || 'tourist',
      application_date: visa.application_date ? visa.application_date.split('T')[0] : '',
      issue_date: visa.issue_date ? visa.issue_date.split('T')[0] : '',
      expiry_date: visa.expiry_date ? visa.expiry_date.split('T')[0] : '',
      status: visa.status || 'pending',
      notes: visa.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) {
      Swal.fire('تنبيه', 'اختر العميل', 'warning');
      return;
    }
    if (!formData.country.trim()) {
      Swal.fire('تنبيه', 'أدخل الدولة', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        ...formData,
        customer_id: Number(formData.customer_id),
        booking_id: formData.booking_id ? Number(formData.booking_id) : null
      };

      if (editId) {
        await api.put(`/visas/${editId}`, body);
        Swal.fire({ title: 'تم التحديث', text: 'تم تحديث التأشيرة بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/visas', body);
        Swal.fire({ title: 'تم الإضافة', text: 'تم إضافة التأشيرة بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      }

      setShowModal(false);
      resetForm();
      fetchVisas();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل حفظ التأشيرة', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, visaNumber) => {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `سيتم حذف التأشيرة: ${visaNumber}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/visas/${id}`);
          Swal.fire('تم الحذف', 'تم حذف التأشيرة بنجاح', 'success');
          fetchVisas();
        } catch (err) {
          Swal.fire('خطأ', 'فشل حذف التأشيرة', 'error');
        }
      }
    });
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: 'bg-warning text-dark',
      approved: 'bg-info',
      rejected: 'bg-danger',
      issued: 'bg-success'
    };
    const labels = {
      pending: 'قيد الانتظار',
      approved: 'موافقة',
      rejected: 'مرفوض',
      issued: 'صادر'
    };
    return <span className={`badge ${map[status] || 'bg-secondary'}`}>{labels[status] || status}</span>;
  };

  const getVisaTypeLabel = (type) => {
    const map = { tourist: 'سياحية', business: 'أعمال', transit: 'ترانزيت', hajj: 'حج', umrah: 'عمرة' };
    return map[type] || type;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-passport me-2"></i>
          التأشيرات
        </h4>
        <button className="btn btn-primary" onClick={openAddModal}>
          <i className="bi bi-plus-lg me-1"></i>
          إضافة تأشيرة
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
                placeholder="رقم التأشيرة, الدولة, اسم العميل..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">الحالة</label>
              <select className="form-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">الكل</option>
                <option value="pending">قيد الانتظار</option>
                <option value="approved">موافقة</option>
                <option value="rejected">مرفوض</option>
                <option value="issued">صادر</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}>
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
          ) : visas.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              لا توجد تأشيرات
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>رقم التأشيرة</th>
                      <th>العميل</th>
                      <th>الدولة</th>
                      <th>نوع التأشيرة</th>
                      <th>تاريخ التقديم</th>
                      <th>تاريخ الانتهاء</th>
                      <th>الحالة</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visas.map((v) => (
                      <tr key={v.id}>
                        <td><code>{v.visa_number}</code></td>
                        <td>{v.customer_name || '-'}</td>
                        <td>{v.country}</td>
                        <td>{getVisaTypeLabel(v.visa_type)}</td>
                        <td>{v.application_date ? new Date(v.application_date).toLocaleDateString('ar-SA') : '-'}</td>
                        <td>{v.expiry_date ? new Date(v.expiry_date).toLocaleDateString('ar-SA') : '-'}</td>
                        <td>{getStatusBadge(v.status)}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-warning" onClick={() => openEditModal(v)} title="تعديل">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(v.id, v.visa_number)} title="حذف">
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
                  {editId ? 'تعديل التأشيرة' : 'إضافة تأشيرة جديدة'}
                </h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">العميل <span className="text-danger">*</span></label>
                      <select className="form-select" name="customer_id" value={formData.customer_id} onChange={handleChange} required>
                        <option value="">اختر العميل</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">رقم الحجز (اختياري)</label>
                      <input type="number" className="form-control" name="booking_id" value={formData.booking_id} onChange={handleChange} placeholder="رقم الحجز..." />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الدولة <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" name="country" value={formData.country} onChange={handleChange} placeholder="اسم الدولة..." required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">نوع التأشيرة</label>
                      <select className="form-select" name="visa_type" value={formData.visa_type} onChange={handleChange}>
                        <option value="tourist">سياحية</option>
                        <option value="business">أعمال</option>
                        <option value="transit">ترانزيت</option>
                        <option value="hajj">حج</option>
                        <option value="umrah">عمرة</option>
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">تاريخ التقديم</label>
                      <input type="date" className="form-control" name="application_date" value={formData.application_date} onChange={handleChange} />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">تاريخ الإصدار</label>
                      <input type="date" className="form-control" name="issue_date" value={formData.issue_date} onChange={handleChange} />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">تاريخ الانتهاء</label>
                      <input type="date" className="form-control" name="expiry_date" value={formData.expiry_date} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الحالة</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
                        <option value="pending">قيد الانتظار</option>
                        <option value="approved">موافقة</option>
                        <option value="rejected">مرفوض</option>
                        <option value="issued">صادر</option>
                      </select>
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
                      <><i className="bi bi-check-lg me-1"></i>{editId ? 'تحديث التأشيرة' : 'حفظ التأشيرة'}</>
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

export default Visas;
