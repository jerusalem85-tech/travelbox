import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function ServicesCatalog() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: '', description: '', price: '',
    currency: 'USD', supplier_id: '', notes: ''
  });

  const load = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (activeFilter !== '') params.is_active = activeFilter;
      const res = await api.get('/services-catalog', { params });
      setServices(res.data.rows || res.data || []);
    } catch { Swal.fire('خطأ', 'فشل تحميل الخدمات', 'error'); }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/services-catalog/categories');
      setCategories(res.data.rows || res.data || []);
    } catch {}
  };

  const loadSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data.rows || res.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, [search, categoryFilter, activeFilter]);
  useEffect(() => { loadCategories(); loadSuppliers(); }, []);

  const resetForm = () => {
    setFormData({
      name: '', category: '', description: '', price: '',
      currency: 'USD', supplier_id: '', notes: ''
    });
    setEditingId(null);
  };

  const openEdit = (item) => {
    setFormData({
      name: item.name || '',
      category: item.category || '',
      description: item.description || '',
      price: item.price || '',
      currency: item.currency || 'USD',
      supplier_id: item.supplier_id || '',
      notes: item.notes || ''
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { Swal.fire('تنبيه', 'أدخل اسم الخدمة', 'warning'); return; }
    if (!formData.price || Number(formData.price) <= 0) { Swal.fire('تنبيه', 'أدخل السعر', 'warning'); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null
      };
      if (editingId) {
        await api.put(`/services-catalog/${editingId}`, payload);
        Swal.fire('تم التحديث', 'تم تحديث الخدمة', 'success');
      } else {
        await api.post('/services-catalog', payload);
        Swal.fire('تم الإضافة', 'تم إضافة الخدمة', 'success');
      }
      setShowModal(false);
      resetForm();
      load();
      loadCategories();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally { setSubmitting(false); }
  };

  const handleToggleActive = async (id, current) => {
    try {
      await api.put(`/services-catalog/${id}`, { is_active: !current });
      load();
    } catch { Swal.fire('خطأ', 'فشل تحديث الحالة', 'error'); }
  };

  const handleDelete = (id, name) => {
    Swal.fire({
      title: 'تأكيد الحذف', text: `سيتم حذف الخدمة: ${name}`, icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/services-catalog/${id}`).then(() => load());
    });
  };

  const currencySymbol = (c) => ({ USD: '$', ILS: '₪', EUR: '€', JOD: 'د.أ' })[c] || c;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0">
          <i className="bi bi-box-seam me-2"></i>
          كتالوج الخدمات الإضافية
        </h5>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-plus-lg"></i> خدمة جديدة
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input className="form-control" placeholder="بحث باسم الخدمة..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="">كل التصنيفات</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={activeFilter} onChange={e => setActiveFilter(e.target.value)}>
                <option value="">الكل</option>
                <option value="1">نشط</option>
                <option value="0">غير نشط</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setCategoryFilter(''); setActiveFilter(''); }}>
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
              <tr><th>الاسم</th><th>التصنيف</th><th>الوصف</th><th>السعر</th><th>المورد</th><th>الحالة</th><th></th></tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td className="fw-semibold">{s.name}</td>
                  <td><span className="badge bg-info bg-opacity-10 text-dark">{s.category}</span></td>
                  <td style={{ maxWidth: 200 }} className="text-truncate">{s.description || '-'}</td>
                  <td className="fw-bold">{Number(s.price).toLocaleString()} {currencySymbol(s.currency)}</td>
                  <td>{s.supplier_name || '-'}</td>
                  <td>{s.is_active ? <span className="badge bg-success">نشط</span> : <span className="badge bg-secondary">غير نشط</span>}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-info me-1" onClick={() => handleToggleActive(s.id, s.is_active)} title={s.is_active ? 'تعطيل' : 'تفعيل'}>
                      <i className={`bi bi-${s.is_active ? 'pause-circle' : 'play-circle'}`}></i>
                    </button>
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openEdit(s)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.id, s.name)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {services.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-4">لا توجد خدمات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-box-seam me-2"></i>{editingId ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">اسم الخدمة <span className="text-danger">*</span></label>
                      <input className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">التصنيف</label>
                      <input className="form-control" list="categoriesList" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="أو اختر من القائمة" />
                      <datalist id="categoriesList">
                        {categories.map(c => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">الوصف</label>
                    <textarea className="form-control" rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">السعر <span className="text-danger">*</span></label>
                      <input type="number" className="form-control" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} min="0" step="0.01" required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">العملة</label>
                      <select className="form-select" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                        <option value="USD">دولار أمريكي (USD)</option>
                        <option value="ILS">شيكل إسرائيلي (ILS)</option>
                        <option value="EUR">يورو (EUR)</option>
                        <option value="JOD">دينار أردني (JOD)</option>
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">المورد</label>
                      <select className="form-select" value={formData.supplier_id} onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}>
                        <option value="">اختر المورد</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name || s.supplier_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">ملاحظات</label>
                    <textarea className="form-control" rows="2" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span> جاري الحفظ...</> : <><i className="bi bi-check-lg me-1"></i> حفظ</>}
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
