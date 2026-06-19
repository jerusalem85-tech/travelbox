import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function Airports() {
  const [tab, setTab] = useState('airports');
  const [airports, setAirports] = useState({ rows: [], total: 0, page: 1 });
  const [airlines, setAirlines] = useState({ rows: [], total: 0, page: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', city: '', country: '', terminal_info: '', is_active: true });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (activeFilter !== '') params.is_active = activeFilter === 'true';
    if (tab === 'airports') {
      api.get('/airports', { params }).then(res => setAirports(res.data));
    } else {
      api.get('/airlines', { params }).then(res => setAirlines(res.data));
    }
  };

  useEffect(() => { load(); }, [page, tab]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); load(); }, 300); return () => clearTimeout(t); }, [search, activeFilter]);

  const resetForm = () => {
    setFormData({ code: '', name: '', city: '', country: '', terminal_info: '', is_active: true });
    setEditItem(null);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      code: item.code || '',
      name: item.name || '',
      city: item.city || '',
      country: item.country || '',
      terminal_info: item.terminal_info || '',
      is_active: item.is_active !== undefined ? item.is_active : true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { Swal.fire('تنبيه', 'أدخل الاسم', 'warning'); return; }
    if (!formData.code.trim()) { Swal.fire('تنبيه', 'أدخل الكود', 'warning'); return; }
    setSubmitting(true);
    try {
      const payload = { ...formData, code: formData.code.toUpperCase() };
      if (editItem) {
        await api.put(`/${tab === 'airports' ? 'airports' : 'airlines'}/${editItem.id}`, payload);
        Swal.fire('تم التحديث', 'تم تحديث البيانات', 'success');
      } else {
        await api.post(`/${tab === 'airports' ? 'airports' : 'airlines'}`, payload);
        Swal.fire('تم الإضافة', 'تم الإضافة بنجاح', 'success');
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
      title: 'تأكيد الحذف', text: `سيتم حذف: ${name}`, icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/${tab === 'airports' ? 'airports' : 'airlines'}/${id}`).then(() => load());
    });
  };

  const data = tab === 'airports' ? airports : airlines;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0">
          {tab === 'airports' ? 'المطارات' : 'شركات الطيران'}
        </h5>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-plus-lg"></i> {tab === 'airports' ? 'مطار جديد' : 'شركة جديدة'}
        </button>
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'airports' ? 'active' : ''}`} onClick={() => { setTab('airports'); setPage(1); setSearch(''); }}>
            <i className="bi bi-airplane me-1"></i>المطارات
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'airlines' ? 'active' : ''}`} onClick={() => { setTab('airlines'); setPage(1); setSearch(''); }}>
            <i className="bi bi-airplane-engines me-1"></i>شركات الطيران
          </button>
        </li>
      </ul>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-6">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input className="form-control" placeholder={tab === 'airports' ? 'بحث بالكود أو الاسم أو المدينة...' : 'بحث بالكود أو الاسم...'} value={search} onChange={e => setSearch(e.target.value)} />
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
              {tab === 'airports' ? (
                <tr><th>الكود</th><th>الاسم</th><th>المدينة</th><th>الدولة</th><th>معلومات المطار</th><th>الحالة</th><th></th></tr>
              ) : (
                <tr><th>الكود</th><th>الاسم</th><th>الدولة</th><th>الموقع</th><th>الهاتف</th><th>الحالة</th><th></th></tr>
              )}
            </thead>
            <tbody>
              {data.rows?.map(item => (
                <tr key={item.id}>
                  {tab === 'airports' ? (
                    <>
                      <td><span className="badge bg-secondary">{item.code}</span></td>
                      <td className="fw-semibold">{item.name}</td>
                      <td>{item.city || '-'}</td>
                      <td>{item.country || '-'}</td>
                      <td style={{ maxWidth: 200 }} className="text-truncate">{item.terminal_info || '-'}</td>
                      <td><span className={`badge ${item.is_active ? 'bg-success' : 'bg-danger'}`}>{item.is_active ? 'نشط' : 'غير نشط'}</span></td>
                    </>
                  ) : (
                    <>
                      <td><span className="badge bg-secondary">{item.code}</span></td>
                      <td className="fw-semibold">{item.name}</td>
                      <td>{item.country || '-'}</td>
                      <td>{item.website ? <a href={item.website} target="_blank" rel="noopener noreferrer">{item.website}</a> : '-'}</td>
                      <td>{item.phone || '-'}</td>
                      <td><span className={`badge ${item.is_active ? 'bg-success' : 'bg-danger'}`}>{item.is_active ? 'نشط' : 'غير نشط'}</span></td>
                    </>
                  )}
                  <td>
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openEdit(item)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id, item.name)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {(!data.rows || data.rows.length === 0) && (
                <tr><td colSpan="7" className="text-center text-muted py-4">لا توجد بيانات</td></tr>
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
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi ${tab === 'airports' ? 'bi-airplane' : 'bi-airplane-engines'} me-2`}></i>
                  {editItem ? 'تعديل' : 'إضافة'} {tab === 'airports' ? 'مطار' : 'شركة طيران'}
                </h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الكود <span className="text-danger">*</span></label>
                      <input className="form-control" name="code" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الاسم <span className="text-danger">*</span></label>
                      <input className="form-control" name="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                  </div>
                  {tab === 'airports' ? (
                    <>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">المدينة</label>
                          <input className="form-control" name="city" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">الدولة</label>
                          <input className="form-control" name="country" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">معلومات المطار</label>
                        <textarea className="form-control" name="terminal_info" rows="2" value={formData.terminal_info} onChange={e => setFormData({ ...formData, terminal_info: e.target.value })}></textarea>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">الدولة</label>
                          <input className="form-control" name="country" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">الموقع الإلكتروني</label>
                          <input className="form-control" name="website" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://" />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">الهاتف</label>
                          <input className="form-control" name="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                      </div>
                    </>
                  )}
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="isActive" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                      <label className="form-check-label" htmlFor="isActive">نشط</label>
                    </div>
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
