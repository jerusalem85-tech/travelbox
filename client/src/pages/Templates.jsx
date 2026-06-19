import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const typeLabels = { whatsapp: 'واتساب', email: 'بريد إلكتروني', sms: 'رسالة نصية' };
const typeColors = { whatsapp: 'success', email: 'primary', sms: 'warning' };

const emptyTemplate = { name: '', type: 'whatsapp', subject: '', body: '', is_active: true };

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyTemplate });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (search) params.append('search', search);
      const res = await api.get(`/templates?${params.toString()}`);
      setTemplates(res.data.rows || res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterType, search]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyTemplate });
    setShowModal(true);
  };

  const openEdit = (tmpl) => {
    setEditing(tmpl);
    setForm({ name: tmpl.name, type: tmpl.type, subject: tmpl.subject || '', body: tmpl.body || '', is_active: tmpl.is_active });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.body) {
      Swal.fire({ icon: 'warning', title: 'تنبيه', text: 'الاسم والمحتوى مطلوبان' });
      return;
    }
    try {
      if (editing) {
        await api.put(`/templates/${editing.id}`, form);
      } else {
        await api.post('/templates', form);
      }
      Swal.fire({ icon: 'success', title: 'تم الحفظ', timer: 1500, showConfirmButton: false });
      setShowModal(false);
      fetchTemplates();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'خطأ', text: e.response?.data?.error || 'حدث خطأ' });
    }
  };

  const handleDelete = (tmpl) => {
    Swal.fire({
      title: 'تأكيد الحذف',
      text: `حذف القالب "${tmpl.name}"؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'حذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#dc3545',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/templates/${tmpl.id}`);
          Swal.fire({ icon: 'success', title: 'تم الحذف', timer: 1500, showConfirmButton: false });
          fetchTemplates();
        } catch (e) {
          Swal.fire({ icon: 'error', title: 'خطأ', text: e.response?.data?.error || 'حدث خطأ' });
        }
      }
    });
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-envelope-paper me-2"></i>
          القوالب
        </h4>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="bi bi-plus-lg me-1"></i>
          قالب جديد
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">النوع</label>
              <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">الكل</option>
                {Object.entries(typeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">بحث</label>
              <input type="text" className="form-control" placeholder="بحث بالاسم..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setFilterType(''); setSearch(''); }}>
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
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-file-text fs-1 d-block mb-2"></i>
              لا توجد قوالب
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الاسم</th>
                    <th>النوع</th>
                    <th>الموضوع</th>
                    <th>المحتوى</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((tmpl) => (
                    <tr key={tmpl.id}>
                      <td>{tmpl.id}</td>
                      <td className="fw-semibold">{tmpl.name}</td>
                      <td>
                        <span className={`badge bg-${typeColors[tmpl.type] || 'secondary'}`}>
                          {typeLabels[tmpl.type] || tmpl.type}
                        </span>
                      </td>
                      <td className="small">{tmpl.subject || '-'}</td>
                      <td className="small text-muted" style={{ maxWidth: 250 }}>
                        <div className="text-truncate">{tmpl.body || '-'}</div>
                      </td>
                      <td>
                        <span className={`badge ${tmpl.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {tmpl.is_active ? 'مفعل' : 'معطل'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(tmpl)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(tmpl)}>
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
        <>
          <div className="modal-backdrop fade show" onClick={() => setShowModal(false)}></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editing ? 'تعديل القالب' : 'إضافة قالب جديد'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">الاسم <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">النوع <span className="text-danger">*</span></label>
                      <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                        {Object.entries(typeLabels).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">الموضوع</label>
                      <input type="text" className="form-control" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">المحتوى <span className="text-danger">*</span></label>
                      <textarea className="form-control" rows="5" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}></textarea>
                      <div className="form-text">
                        يمكنك استخدام المتغيرات التالية: {'{customer_name}'}, {'{booking_id}'}, {'{date}'}
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" role="switch" id="activeSwitch" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                        <label className="form-check-label" htmlFor="activeSwitch">نشط</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                  <button className="btn btn-primary" onClick={handleSave}>
                    <i className="bi bi-check-lg me-1"></i>
                    حفظ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
