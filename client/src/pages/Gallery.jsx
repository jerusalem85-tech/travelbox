import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

const entityTypeLabels = { destination: 'وجهة', hotel: 'فندق', guide: 'مرشد', supplier: 'مورد' };

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterEntity, setFilterEntity] = useState('');
  const [filterEntityId, setFilterEntityId] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [captionEdit, setCaptionEdit] = useState({ id: null, caption: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    entity_type: 'destination', entity_id: '', image_url: '', caption: '', category: '', sort_order: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterEntity) params.entity_type = filterEntity;
      if (filterEntityId) params.entity_id = filterEntityId;
      if (filterCategory) params.category = filterCategory;
      const res = await api.get('/gallery', { params });
      setImages(res.data.rows || res.data || []);
    } catch {
      Swal.fire('خطأ', 'فشل تحميل المعرض', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/gallery/categories');
      setCategories(res.data.rows || res.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, [filterEntity, filterEntityId, filterCategory]);
  useEffect(() => { loadCategories(); }, []);

  const resetForm = () => {
    setFormData({ entity_type: 'destination', entity_id: '', image_url: '', caption: '', category: '', sort_order: '' });
    setEditId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (img) => {
    setEditId(img.id);
    setFormData({
      entity_type: img.entity_type || 'destination',
      entity_id: img.entity_id || '',
      image_url: img.image_url || '',
      caption: img.caption || '',
      category: img.category || '',
      sort_order: img.sort_order ?? ''
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image_url.trim()) {
      Swal.fire('تنبيه', 'رابط الصورة مطلوب', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        entity_type: formData.entity_type, entity_id: formData.entity_id ? Number(formData.entity_id) : null,
        image_url: formData.image_url, caption: formData.caption || null,
        category: formData.category || null, sort_order: formData.sort_order ? Number(formData.sort_order) : null
      };
      if (editId) {
        await api.put(`/gallery/${editId}`, body);
        Swal.fire({ title: 'تم التحديث', text: 'تم تحديث الصورة', icon: 'success', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/gallery', body);
        Swal.fire({ title: 'تم الإضافة', text: 'تم إضافة الصورة', icon: 'success', timer: 2000, showConfirmButton: false });
      }
      setShowModal(false);
      resetForm();
      loadCategories();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل حفظ الصورة', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openCaptionEdit = (img) => {
    setCaptionEdit({ id: img.id, caption: img.caption || '' });
    setShowCaptionModal(true);
  };

  const saveCaption = async () => {
    try {
      await api.put(`/gallery/${captionEdit.id}`, { caption: captionEdit.caption });
      Swal.fire({ title: 'تم التحديث', text: 'تم تحديث التعليق', icon: 'success', timer: 2000, showConfirmButton: false });
      setShowCaptionModal(false);
      load();
    } catch {
      Swal.fire('خطأ', 'فشل تحديث التعليق', 'error');
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'هل أنت متأكد؟', text: 'سيتم حذف هذه الصورة',
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6', confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء'
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          await api.delete(`/gallery/${id}`);
          Swal.fire('تم الحذف', 'تم حذف الصورة', 'success');
          load();
        } catch { Swal.fire('خطأ', 'فشل حذف الصورة', 'error'); }
      }
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0"><i className="bi bi-images me-2"></i>المعرض</h5>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-1"></i>إضافة صورة</button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <select className="form-select" value={filterEntity} onChange={e => setFilterEntity(e.target.value)}>
                <option value="">كل الأنواع</option>
                {Object.entries(entityTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <input className="form-control" placeholder="رقم الكيان" value={filterEntityId} onChange={e => setFilterEntityId(e.target.value)} />
            </div>
            <div className="col-md-3">
              <select className="form-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">كل التصنيفات</option>
                {categories.map(c => <option key={c.id || c} value={c.id || c}>{c.name || c}</option>)}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setFilterEntity(''); setFilterEntityId(''); setFilterCategory(''); }}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>إعادة
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : (
        <div className="row g-3">
          {images.map(img => (
            <div className="col-md-4 col-lg-3" key={img.id}>
              <div className="card h-100">
                {img.image_url ? (
                  <img src={img.image_url} className="card-img-top" alt={img.caption || 'صورة'} style={{ height: '200px', objectFit: 'cover' }} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center bg-light" style={{ height: '200px' }}>
                    <i className="bi bi-image text-muted" style={{ fontSize: '3rem' }}></i>
                  </div>
                )}
                <div className="card-body p-2">
                  {img.category && <span className="badge bg-info mb-1">{img.category}</span>}
                  <p className="card-text small mb-2">{img.caption || <span className="text-muted fst-italic">بدون تعليق</span>}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">{entityTypeLabels[img.entity_type] || img.entity_type} #{img.entity_id}</small>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-warning" onClick={() => openCaptionEdit(img)} title="تعديل التعليق"><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-sm btn-outline-info" onClick={() => openEdit(img)} title="تعديل"><i className="bi bi-gear"></i></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(img.id)} title="حذف"><i className="bi bi-x-lg"></i></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {images.length === 0 && <div className="col-12 text-center text-muted py-5">لا توجد صور</div>}
        </div>
      )}

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className={`bi ${editId ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>{editId ? 'تعديل الصورة' : 'إضافة صورة جديدة'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">نوع الكيان <span className="text-danger">*</span></label>
                      <select className="form-select" name="entity_type" value={formData.entity_type} onChange={handleChange}>
                        {Object.entries(entityTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">رقم الكيان</label>
                      <input type="number" className="form-control" name="entity_id" value={formData.entity_id} onChange={handleChange} placeholder="اختياري" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">رابط الصورة <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="image_url" value={formData.image_url} onChange={handleChange} placeholder="https://..." required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">التعليق</label>
                    <textarea className="form-control" name="caption" value={formData.caption} onChange={handleChange} rows="2"></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">التصنيف</label>
                      <input type="text" className="form-control" name="category" value={formData.category} onChange={handleChange} list="category-list" placeholder="اختياري" />
                      <datalist id="category-list">
                        {categories.map(c => <option key={c.id || c} value={c.name || c} />)}
                      </datalist>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">ترتيب العرض</label>
                      <input type="number" className="form-control" name="sort_order" value={formData.sort_order} onChange={handleChange} placeholder="اختياري" />
                    </div>
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

      {showCaptionModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-pencil me-2"></i>تعديل التعليق</h5>
                <button type="button" className="btn-close" onClick={() => setShowCaptionModal(false)}></button>
              </div>
              <div className="modal-body">
                <textarea className="form-control" rows="3" value={captionEdit.caption} onChange={e => setCaptionEdit(prev => ({ ...prev, caption: e.target.value }))}></textarea>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCaptionModal(false)}>إلغاء</button>
                <button type="button" className="btn btn-primary" onClick={saveCaption}>حفظ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
