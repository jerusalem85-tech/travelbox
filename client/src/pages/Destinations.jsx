import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function Destinations() {
  const [data, setData] = useState({ rows: [], total: 0, page: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '', country: '', is_active: true,
    description: '', attractions: '', best_season: '',
    visa_info: '', health_info: '', currency: '', language: '', timezone: '',
    image_url: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (activeFilter !== '') params.is_active = activeFilter === 'true';
    api.get('/destinations', { params }).then(res => setData(res.data));
  };

  useEffect(() => { load(); }, [page]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); load(); }, 300); return () => clearTimeout(t); }, [search, activeFilter]);

  const resetForm = () => {
    setFormData({
      name: '', country: '', is_active: true,
      description: '', attractions: '', best_season: '',
      visa_info: '', health_info: '', currency: '', language: '', timezone: '',
      image_url: ''
    });
    setEditItem(null);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      name: item.name || '',
      country: item.country || '',
      is_active: item.is_active !== undefined ? item.is_active : true,
      description: item.description || '',
      attractions: item.attractions || '',
      best_season: item.best_season || '',
      visa_info: item.visa_info || '',
      health_info: item.health_info || '',
      currency: item.currency || '',
      language: item.language || '',
      timezone: item.timezone || '',
      image_url: item.image_url || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { Swal.fire('تنبيه', 'أدخل اسم الوجهة', 'warning'); return; }
    setSubmitting(true);
    try {
      if (editItem) {
        await api.put(`/destinations/${editItem.id}`, formData);
        Swal.fire('تم التحديث', 'تم تحديث الوجهة', 'success');
      } else {
        await api.post('/destinations', formData);
        Swal.fire('تم الإضافة', 'تم إضافة الوجهة', 'success');
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, name) => {
    Swal.fire({
      title: 'تأكيد الحذف', text: `سيتم حذف الوجهة: ${name}`, icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/destinations/${id}`).then(() => load());
    });
  };

  const trunc = (str, len = 50) => str?.length > len ? str.slice(0, len) + '...' : str || '-';

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0">الوجهات</h5>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-plus-lg"></i> وجهة جديدة
        </button>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-6">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input className="form-control" placeholder="بحث بالاسم أو الدولة..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={activeFilter} onChange={e => setActiveFilter(e.target.value)}>
                <option value="">جميع الحالات</option>
                <option value="true">نشط</option>
                <option value="false">غير نشط</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr><th>الاسم</th><th>الدولة</th><th>الوصف</th><th>المعالم</th><th>الموسم الأفضل</th><th>العملة</th><th>اللغة</th><th>الحالة</th><th></th></tr>
            </thead>
            <tbody>
              {data.rows.map(d => (
                <tr key={d.id}>
                  <td className="fw-semibold">{d.name}</td>
                  <td>{d.country || '-'}</td>
                  <td className="text-muted" style={{ maxWidth: 150 }} title={d.description}>{trunc(d.description)}</td>
                  <td className="text-muted" style={{ maxWidth: 120 }} title={d.attractions}>{trunc(d.attractions)}</td>
                  <td>{d.best_season || '-'}</td>
                  <td>{d.currency || '-'}</td>
                  <td>{d.language || '-'}</td>
                  <td><span className={`badge ${d.is_active ? 'bg-success' : 'bg-danger'}`}>{d.is_active ? 'نشط' : 'غير نشط'}</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openEdit(d)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(d.id, d.name)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {data.rows.length === 0 && (
                <tr><td colSpan="9" className="text-center text-muted py-4">لا توجد وجهات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {data.total > 20 && (
        <nav className="mt-3">
          <ul className="pagination justify-content-center">
            {Array.from({ length: Math.ceil(data.total / 20) }, (_, i) => i + 1).map(p => (
              <li key={p} className={`page-item ${p === data.page ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setPage(p)}>{p}</button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-globe me-2"></i>{editItem ? 'تعديل الوجهة' : 'إضافة وجهة جديدة'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <h6 className="border-bottom pb-2 mb-3 text-primary"><i className="bi bi-info-circle me-1"></i>أساسي</h6>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الاسم <span className="text-danger">*</span></label>
                      <input className="form-control" name="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الدولة</label>
                      <input className="form-control" name="country" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="isActiveDest" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                      <label className="form-check-label" htmlFor="isActiveDest">نشط</label>
                    </div>
                  </div>

                  <h6 className="border-bottom pb-2 mb-3 text-primary"><i className="bi bi-info-lg me-1"></i>معلومات</h6>
                  <div className="mb-3">
                    <label className="form-label">الوصف</label>
                    <textarea className="form-control" name="description" rows="2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">المعالم (مفصولة بفاصلة)</label>
                      <textarea className="form-control" name="attractions" rows="2" value={formData.attractions} onChange={e => setFormData({ ...formData, attractions: e.target.value })} placeholder="برج إيفل, متحف اللوفر"></textarea>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">أفضل موسم للزيارة</label>
                      <input className="form-control" name="best_season" value={formData.best_season} onChange={e => setFormData({ ...formData, best_season: e.target.value })} placeholder="الربيع" />
                    </div>
                  </div>

                  <h6 className="border-bottom pb-2 mb-3 text-primary"><i className="bi bi-airplane me-1"></i>السفر</h6>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">معلومات التأشيرة</label>
                      <textarea className="form-control" name="visa_info" rows="2" value={formData.visa_info} onChange={e => setFormData({ ...formData, visa_info: e.target.value })} placeholder="متطلبات التأشيرة"></textarea>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">معلومات صحية</label>
                      <textarea className="form-control" name="health_info" rows="2" value={formData.health_info} onChange={e => setFormData({ ...formData, health_info: e.target.value })} placeholder="التطعيمات المطلوبة"></textarea>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">العملة</label>
                      <input className="form-control" name="currency" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} placeholder="SAR" />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">اللغة</label>
                      <input className="form-control" name="language" value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })} placeholder="العربية" />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">المنطقة الزمنية</label>
                      <input className="form-control" name="timezone" value={formData.timezone} onChange={e => setFormData({ ...formData, timezone: e.target.value })} placeholder="UTC+3" />
                    </div>
                  </div>

                  <h6 className="border-bottom pb-2 mb-3 text-primary"><i className="bi bi-image me-1"></i>الوسائط</h6>
                  <div className="mb-3">
                    <label className="form-label">رابط الصورة</label>
                    <input className="form-control" name="image_url" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://" />
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
