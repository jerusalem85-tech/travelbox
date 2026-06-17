import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [entityIdFilter, setEntityIdFilter] = useState('');
  const [formData, setFormData] = useState({
    entity_type: 'booking',
    entity_id: '',
    document_type: 'passport',
    file_name: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const limit = 10;

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      if (entityTypeFilter) params.append('entity_type', entityTypeFilter);
      if (entityIdFilter) params.append('entity_id', entityIdFilter);
      const res = await api.get(`/documents?${params.toString()}`);
      setDocuments(res.data.rows || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      Swal.fire('خطأ', 'فشل تحميل المستندات', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, entityTypeFilter, entityIdFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      entity_type: 'booking',
      entity_id: '',
      document_type: 'passport',
      file_name: '',
      notes: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.entity_id.trim()) {
      Swal.fire('تنبيه', 'أدخل رقم الكيان', 'warning');
      return;
    }
    if (!formData.file_name.trim()) {
      Swal.fire('تنبيه', 'أدخل اسم الملف', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/documents', {
        entity_type: formData.entity_type,
        entity_id: Number(formData.entity_id),
        document_type: formData.document_type,
        file_name: formData.file_name,
        notes: formData.notes
      });
      Swal.fire({ title: 'تم الإضافة', text: 'تم إضافة المستند بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      setShowModal(false);
      resetForm();
      fetchDocuments();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل حفظ المستند', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, fileName) => {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `سيتم حذف المستند: ${fileName}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/documents/${id}`);
          Swal.fire('تم الحذف', 'تم حذف المستند بنجاح', 'success');
          fetchDocuments();
        } catch (err) {
          Swal.fire('خطأ', 'فشل حذف المستند', 'error');
        }
      }
    });
  };

  const getEntityTypeLabel = (type) => {
    const map = { booking: 'حجز', customer: 'عميل', supplier: 'مورد' };
    return map[type] || type;
  };

  const getDocumentTypeLabel = (type) => {
    const map = { passport: 'جواز سفر', contract: 'عقد', ticket: 'تذكرة', invoice: 'فاتورة', other: 'أخرى' };
    return map[type] || type;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-file-earmark me-2"></i>
          المستندات
        </h4>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-lg me-1"></i>
          إضافة مستند
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">نوع الكيان</label>
              <select className="form-select" value={entityTypeFilter} onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}>
                <option value="">الكل</option>
                <option value="booking">حجز</option>
                <option value="customer">عميل</option>
                <option value="supplier">مورد</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">رقم الكيان</label>
              <input
                type="text"
                className="form-control"
                placeholder="رقم الكيان..."
                value={entityIdFilter}
                onChange={(e) => { setEntityIdFilter(e.target.value); setPage(1); }}
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setEntityTypeFilter(''); setEntityIdFilter(''); setPage(1); }}>
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
          ) : documents.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              لا توجد مستندات
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>نوع الكيان</th>
                      <th>رقم الكيان</th>
                      <th>نوع المستند</th>
                      <th>اسم الملف</th>
                      <th>تاريخ الإضافة</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((d) => (
                      <tr key={d.id}>
                        <td>{d.id}</td>
                        <td><span className="badge bg-secondary">{getEntityTypeLabel(d.entity_type)}</span></td>
                        <td><code>{d.entity_id}</code></td>
                        <td>{getDocumentTypeLabel(d.document_type)}</td>
                        <td><i className="bi bi-file-earmark me-1"></i>{d.file_name}</td>
                        <td>{d.created_at ? new Date(d.created_at).toLocaleDateString('ar-SA') : '-'}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(d.id, d.file_name)} title="حذف">
                            <i className="bi bi-trash"></i>
                          </button>
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
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle me-2"></i>
                  إضافة مستند جديد
                </h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">نوع الكيان <span className="text-danger">*</span></label>
                    <select className="form-select" name="entity_type" value={formData.entity_type} onChange={handleChange} required>
                      <option value="booking">حجز</option>
                      <option value="customer">عميل</option>
                      <option value="supplier">مورد</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">رقم الكيان <span className="text-danger">*</span></label>
                    <input type="number" className="form-control" name="entity_id" value={formData.entity_id} onChange={handleChange} placeholder="رقم الكيان..." required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">نوع المستند <span className="text-danger">*</span></label>
                    <select className="form-select" name="document_type" value={formData.document_type} onChange={handleChange} required>
                      <option value="passport">جواز سفر</option>
                      <option value="contract">عقد</option>
                      <option value="ticket">تذكرة</option>
                      <option value="invoice">فاتورة</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">اسم الملف <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="file_name" value={formData.file_name} onChange={handleChange} placeholder="اسم الملف..." required />
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
                      <><i className="bi bi-check-lg me-1"></i>حفظ المستند</>
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

export default Documents;
