import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showArticle, setShowArticle] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [formData, setFormData] = useState({
    title: '', category: '', content: '', tags: '', is_published: true
  });

  const load = async () => {
    try {
      const params = {};
      if (activeCategory) params.category = activeCategory;
      if (search) params.search = search;
      const res = await api.get('/knowledge', { params });
      setArticles(res.data.rows || res.data || []);
    } catch { Swal.fire('خطأ', 'فشل تحميل المقالات', 'error'); }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/knowledge/categories');
      setCategories(res.data.rows || res.data || []);
    } catch {}
  };

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { load(); }, [activeCategory, search]);

  const resetForm = () => {
    setFormData({ title: '', category: '', content: '', tags: '', is_published: true });
    setEditId(null);
    setNewCategory('');
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (a) => {
    setEditId(a.id);
    setFormData({
      title: a.title || '',
      category: a.category || '',
      content: a.content || '',
      tags: Array.isArray(a.tags) ? a.tags.join(', ') : (a.tags || ''),
      is_published: a.is_published !== false
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { Swal.fire('تنبيه', 'العنوان مطلوب', 'warning'); return; }
    if (!formData.content.trim()) { Swal.fire('تنبيه', 'المحتوى مطلوب', 'warning'); return; }
    setSubmitting(true);
    try {
      const categoryVal = newCategory.trim() || formData.category;
      const tagsArr = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      const body = { ...formData, category: categoryVal, tags: tagsArr };
      if (editId) {
        await api.put(`/knowledge/${editId}`, body);
        Swal.fire('تم التحديث', 'تم تحديث المقالة', 'success');
      } else {
        await api.post('/knowledge', body);
        Swal.fire('تم الإضافة', 'تم إضافة المقالة', 'success');
      }
      setShowModal(false);
      resetForm();
      load();
      loadCategories();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = (id, title) => {
    Swal.fire({
      title: 'تأكيد الحذف', text: `حذف المقالة: ${title}`, icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/knowledge/${id}`).then(() => load());
    });
  };

  const truncate = (str, len = 100) => {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  const allCategories = [...new Set([...categories, ...articles.map(a => a.category).filter(Boolean)])];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0"><i className="bi bi-book me-2"></i>قاعدة المعرفة</h5>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="bi bi-plus-lg"></i> مقالة جديدة
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <button className={`btn btn-sm ${!activeCategory ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setActiveCategory('')}>الكل</button>
            {allCategories.map(cat => (
              <button key={cat} className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setActiveCategory(cat)}>{cat}</button>
            ))}
          </div>
          <input type="text" className="form-control" placeholder="بحث في المقالات..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="row g-3">
        {articles.map(a => (
          <div key={a.id} className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="card-title mb-0">{a.title}</h6>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-warning" onClick={() => openEdit(a)} title="تعديل">
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(a.id, a.title)} title="حذف">
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="mb-2">
                  {a.category && <span className="badge bg-info me-1">{a.category}</span>}
                  {Array.isArray(a.tags) ? a.tags.map(t => <span key={t} className="badge bg-secondary me-1">{t}</span>)
                    : typeof a.tags === 'string' && a.tags ? <span className="badge bg-secondary me-1">{a.tags}</span> : null}
                </div>
                <p className="card-text small text-muted flex-grow-1">{truncate(a.content)}</p>
                <div className="d-flex justify-content-between align-items-center mt-auto">
                  <small className="text-muted"><i className="bi bi-eye me-1"></i>{a.views || 0}</small>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => setShowArticle(a)}>
                    <i className="bi bi-book me-1"></i>قراءة المزيد
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {articles.length === 0 && (
          <div className="col-12">
            <div className="text-center py-5 text-muted">
              <i className="bi bi-book fs-1 d-block mb-2"></i>لا توجد مقالات
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className={`bi ${editId ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>{editId ? 'تعديل المقالة' : 'إضافة مقالة جديدة'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">العنوان <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">التصنيف</label>
                    <div className="input-group">
                      <select className="form-select" value={formData.category} onChange={e => { setFormData({ ...formData, category: e.target.value }); setNewCategory(''); }}>
                        <option value="">اختر تصنيف</option>
                        {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        <option value="__new__">إضافة تصنيف جديد</option>
                      </select>
                    </div>
                    {formData.category === '__new__' && (
                      <input type="text" className="form-control mt-2" placeholder="اسم التصنيف الجديد"
                        value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                    )}
                    {!formData.category && newCategory && (
                      <input type="text" className="form-control mt-2" placeholder="اسم التصنيف الجديد"
                        value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">المحتوى <span className="text-danger">*</span></label>
                    <textarea className="form-control" rows="8" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">الوسوم (مفصولة بفواصل)</label>
                    <input type="text" className="form-control" placeholder="tag1, tag2, tag3" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} />
                  </div>
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="pubToggle" checked={formData.is_published}
                      onChange={e => setFormData({ ...formData, is_published: e.target.checked })} />
                    <label className="form-check-label" htmlFor="pubToggle">منشور</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span> جاري الحفظ...</> : <><i className="bi bi-check-lg me-1"></i> {editId ? 'تحديث' : 'حفظ'}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showArticle && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{showArticle.title}</h5>
                <button type="button" className="btn-close" onClick={() => setShowArticle(null)}></button>
              </div>
              <div className="modal-body">
                {showArticle.category && <span className="badge bg-info mb-2 d-inline-block">{showArticle.category}</span>}
                {Array.isArray(showArticle.tags) && showArticle.tags.map(t => <span key={t} className="badge bg-secondary me-1 mb-2">{t}</span>)}
                <div style={{ whiteSpace: 'pre-wrap' }}>{showArticle.content}</div>
              </div>
              <div className="modal-footer">
                <small className="text-muted"><i className="bi bi-eye me-1"></i>{showArticle.views || 0} مشاهدة</small>
                <button type="button" className="btn btn-secondary" onClick={() => setShowArticle(null)}>إغلاق</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
