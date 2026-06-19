import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

const typeLabels = { booking: 'حجز', employment: 'توظيف', service: 'خدمة', other: 'أخرى' };
const typeColors = { booking: 'primary', employment: 'success', service: 'info', other: 'secondary' };

export default function ContractTemplates() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewVars, setPreviewVars] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: 'booking', content: '', variables: '', is_active: true
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterType) params.type = filterType;
      const res = await api.get('/contract-templates', { params });
      setRows(res.data.rows || res.data || []);
    } catch {
      Swal.fire('خطأ', 'فشل تحميل قوالب العقود', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, filterType]);

  const resetForm = () => {
    setFormData({ name: '', type: 'booking', content: '', variables: '', is_active: true });
    setEditId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (t) => {
    setEditId(t.id);
    setFormData({
      name: t.name || '',
      type: t.type || 'booking',
      content: t.content || '',
      variables: Array.isArray(t.variables) ? t.variables.join(', ') : (t.variables || ''),
      is_active: t.is_active != null ? t.is_active : true
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.content.trim()) {
      Swal.fire('تنبيه', 'الاسم والمحتوى مطلوبان', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        name: formData.name, type: formData.type, content: formData.content,
        variables: formData.variables ? formData.variables.split(',').map(v => v.trim()).filter(Boolean) : [],
        is_active: formData.is_active
      };
      if (editId) {
        await api.put(`/contract-templates/${editId}`, body);
        Swal.fire({ title: 'تم التحديث', text: 'تم تحديث القالب', icon: 'success', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/contract-templates', body);
        Swal.fire({ title: 'تم الإضافة', text: 'تم إضافة القالب', icon: 'success', timer: 2000, showConfirmButton: false });
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل حفظ القالب', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openPreview = (t) => {
    setPreviewContent(t.content || '');
    setPreviewVars(Array.isArray(t.variables) ? t.variables : []);
    setShowPreview(true);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'هل أنت متأكد؟', text: 'سيتم حذف قالب العقد هذا',
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6', confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء'
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          await api.delete(`/contract-templates/${id}`);
          Swal.fire('تم الحذف', 'تم حذف القالب', 'success');
          load();
        } catch { Swal.fire('خطأ', 'فشل حذف القالب', 'error'); }
      }
    });
  };

  const highlightContent = (content, vars) => {
    if (!vars.length) return content;
    let html = content;
    vars.forEach(v => {
      const regex = new RegExp(`\\{${v}\\}`, 'gi');
      html = html.replace(regex, `<span class="text-primary fw-bold bg-light px-1 rounded">{${v}}</span>`);
    });
    return html;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0"><i className="bi bi-file-text me-2"></i>قوالب العقود</h5>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-1"></i>إضافة قالب</button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input className="form-control" placeholder="بحث بالاسم..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">كل الأنواع</option>
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setFilterType(''); }}>
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
              <tr>
                <th>الاسم</th>
                <th>النوع</th>
                <th>الحالة</th>
                <th>المتغيرات</th>
                <th>تاريخ الإضافة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(t => (
                <tr key={t.id}>
                  <td className="fw-semibold">{t.name}</td>
                  <td><span className={`badge bg-${typeColors[t.type] || 'secondary'}`}>{typeLabels[t.type] || t.type}</span></td>
                  <td>{t.is_active ? <span className="badge bg-success">نشط</span> : <span className="badge bg-secondary">غير نشط</span>}</td>
                  <td><small className="text-muted">{Array.isArray(t.variables) ? t.variables.slice(0, 3).join(', ') : t.variables || '-'}{Array.isArray(t.variables) && t.variables.length > 3 ? `...` : ''}</small></td>
                  <td className="small">{t.created_at ? new Date(t.created_at).toLocaleDateString('ar-SA') : '-'}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-info" onClick={() => openPreview(t)} title="معاينة"><i className="bi bi-eye"></i></button>
                      <button className="btn btn-sm btn-outline-warning" onClick={() => openEdit(t)} title="تعديل"><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(t.id)} title="حذف"><i className="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-4">لا توجد قوالب</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className={`bi ${editId ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>{editId ? 'تعديل القالب' : 'إضافة قالب جديد'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الاسم <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} placeholder="اسم القالب" required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">النوع <span className="text-danger">*</span></label>
                      <select className="form-select" name="type" value={formData.type} onChange={handleChange}>
                        {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">المحتوى <span className="text-danger">*</span></label>
                    <small className="text-muted d-block mb-1">يمكنك استخدام المتغيرات: {`{customer_name}`}, {`{date}`}, {`{amount}`}, {`{booking_id}`}</small>
                    <textarea className="form-control" name="content" value={formData.content} onChange={handleChange} rows="10" required></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">المتغيرات</label>
                    <input type="text" className="form-control" name="variables" value={formData.variables} onChange={handleChange} placeholder="customer_name, date, amount" />
                    <small className="text-muted">أسماء المتغيرات مفصولة بفواصل</small>
                  </div>
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" name="is_active" id="isActive" checked={formData.is_active} onChange={handleChange} />
                    <label className="form-check-label" htmlFor="isActive">نشط</label>
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

      {showPreview && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-eye me-2"></i>معاينة القالب</h5>
                <button type="button" className="btn-close" onClick={() => setShowPreview(false)}></button>
              </div>
              <div className="modal-body">
                {previewVars.length > 0 && (
                  <div className="mb-2">
                    <small className="text-muted">المتغيرات المتاحة: </small>
                    {previewVars.map(v => <span key={v} className="badge bg-light text-primary me-1">{`{${v}}`}</span>)}
                  </div>
                )}
                <div className="p-3 border rounded" style={{ whiteSpace: 'pre-wrap', background: '#f8f9fa', minHeight: '200px' }}
                  dangerouslySetInnerHTML={{ __html: highlightContent(previewContent, previewVars) }}>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPreview(false)}>إغلاق</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
