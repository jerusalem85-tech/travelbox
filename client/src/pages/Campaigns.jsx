import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

const typeLabels = { email: 'بريد إلكتروني', sms: 'رسالة نصية', social: 'تواصل اجتماعي', whatsapp: 'واتساب' };
const typeColors = { email: 'primary', sms: 'info', social: 'purple', whatsapp: 'success' };
const statusLabels = { draft: 'مسودة', sent: 'مرسلة', scheduled: 'مجدولة' };
const statusColors = { draft: 'secondary', sent: 'success', scheduled: 'warning' };
const audienceLabels = { all_customers: 'كل العملاء', recent: 'العملاء الجدد', leads: 'العملاء المحتملون', vip: 'كبار العملاء' };

export default function Campaigns() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: 'email', audience: 'all_customers', subject: '', content: '', scheduled_at: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/campaigns', { params });
      setRows(res.data.rows || res.data || []);
    } catch {
      Swal.fire('خطأ', 'فشل تحميل الحملات', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, filterType, filterStatus]);

  const resetForm = () => {
    setFormData({ name: '', type: 'email', audience: 'all_customers', subject: '', content: '', scheduled_at: '' });
    setEditId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (c) => {
    setEditId(c.id);
    setFormData({
      name: c.name || '',
      type: c.type || 'email',
      audience: c.audience || 'all_customers',
      subject: c.subject || '',
      content: c.content || '',
      scheduled_at: c.scheduled_at ? c.scheduled_at.slice(0, 16) : ''
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.subject.trim()) {
      Swal.fire('تنبيه', 'الاسم والموضوع مطلوبان', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        name: formData.name, type: formData.type, audience: formData.audience,
        subject: formData.subject, content: formData.content || null,
        scheduled_at: formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : null
      };
      if (editId) {
        await api.put(`/campaigns/${editId}`, body);
        Swal.fire({ title: 'تم التحديث', text: 'تم تحديث الحملة', icon: 'success', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/campaigns', body);
        Swal.fire({ title: 'تم الإضافة', text: 'تم إضافة الحملة', icon: 'success', timer: 2000, showConfirmButton: false });
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل حفظ الحملة', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async (id) => {
    Swal.fire({
      title: 'تأكيد الإرسال', text: 'هل تريد إرسال هذه الحملة الآن؟',
      icon: 'question', showCancelButton: true, confirmButtonText: 'إرسال', cancelButtonText: 'إلغاء'
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          await api.put(`/campaigns/${id}/send`);
          Swal.fire({ title: 'تم الإرسال', text: 'تم إرسال الحملة بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
          load();
        } catch { Swal.fire('خطأ', 'فشل إرسال الحملة', 'error'); }
      }
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'هل أنت متأكد؟', text: 'سيتم حذف هذه الحملة',
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6', confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء'
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          await api.delete(`/campaigns/${id}`);
          Swal.fire('تم الحذف', 'تم حذف الحملة', 'success');
          load();
        } catch { Swal.fire('خطأ', 'فشل حذف الحملة', 'error'); }
      }
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0"><i className="bi bi-megaphone me-2"></i>حملات تسويقية</h5>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-1"></i>إضافة حملة</button>
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
            <div className="col-md-3">
              <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">كل الحالات</option>
                {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); }}>
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
                <th>الجمهور</th>
                <th>الحالة</th>
                <th>عدد المرسلات</th>
                <th>مجدولة في</th>
                <th>أُرسلت في</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id}>
                  <td className="fw-semibold">{c.name}</td>
                  <td><span className={`badge bg-${typeColors[c.type] || 'secondary'}`}>{typeLabels[c.type] || c.type}</span></td>
                  <td>{audienceLabels[c.audience] || c.audience}</td>
                  <td><span className={`badge bg-${statusColors[c.status] || 'secondary'}`}>{statusLabels[c.status] || c.status}</span></td>
                  <td>{c.sent_count || 0}</td>
                  <td>{c.scheduled_at ? new Date(c.scheduled_at).toLocaleString('ar-SA') : '-'}</td>
                  <td>{c.sent_at ? new Date(c.sent_at).toLocaleString('ar-SA') : '-'}</td>
                  <td>
                    <div className="d-flex gap-1">
                      {c.status === 'draft' && (
                        <button className="btn btn-sm btn-outline-success" onClick={() => handleSend(c.id)} title="إرسال">
                          <i className="bi bi-send"></i>
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline-warning" onClick={() => openEdit(c)} title="تعديل"><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)} title="حذف"><i className="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="8" className="text-center text-muted py-4">لا توجد حملات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className={`bi ${editId ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>{editId ? 'تعديل الحملة' : 'إضافة حملة جديدة'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الاسم <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} placeholder="اسم الحملة" required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">النوع <span className="text-danger">*</span></label>
                      <select className="form-select" name="type" value={formData.type} onChange={handleChange}>
                        {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الجمهور المستهدف <span className="text-danger">*</span></label>
                      <select className="form-select" name="audience" value={formData.audience} onChange={handleChange}>
                        {Object.entries(audienceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">تاريخ الإرسال (اختياري)</label>
                      <input type="datetime-local" className="form-control" name="scheduled_at" value={formData.scheduled_at} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">الموضوع <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="subject" value={formData.subject} onChange={handleChange} placeholder="عنوان الرسالة" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">المحتوى</label>
                    <textarea className="form-control" name="content" value={formData.content} onChange={handleChange} rows="4" placeholder="محتوى الرسالة..."></textarea>
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
}
