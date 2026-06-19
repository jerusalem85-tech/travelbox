import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: 'apartment', location: '', bedrooms: '', capacity: '',
    price_per_night: '', currency: 'USD', owner_name: '', owner_phone: '', status: 'available'
  });

  const load = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (capacityFilter) params.capacity_min = capacityFilter;
      const res = await api.get('/properties', { params });
      setProperties(res.data.rows || res.data || []);
    } catch { Swal.fire('خطأ', 'فشل تحميل العقارات', 'error'); }
  };

  useEffect(() => { load(); }, [search, typeFilter, statusFilter, capacityFilter]);

  const resetForm = () => {
    setFormData({
      name: '', type: 'apartment', location: '', bedrooms: '', capacity: '',
      price_per_night: '', currency: 'USD', owner_name: '', owner_phone: '', status: 'available'
    });
    setEditingId(null);
  };

  const openEdit = (item) => {
    setFormData({
      name: item.name || '',
      type: item.type || 'apartment',
      location: item.location || '',
      bedrooms: item.bedrooms || '',
      capacity: item.capacity || '',
      price_per_night: item.price_per_night || '',
      currency: item.currency || 'USD',
      owner_name: item.owner_name || '',
      owner_phone: item.owner_phone || '',
      status: item.status || 'available'
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { Swal.fire('تنبيه', 'أدخل اسم العقار', 'warning'); return; }
    if (!formData.price_per_night || Number(formData.price_per_night) <= 0) { Swal.fire('تنبيه', 'أدخل سعر الليلة', 'warning'); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
        capacity: formData.capacity ? Number(formData.capacity) : null,
        price_per_night: Number(formData.price_per_night)
      };
      if (editingId) {
        await api.put(`/properties/${editingId}`, payload);
        Swal.fire('تم التحديث', 'تم تحديث العقار', 'success');
      } else {
        await api.post('/properties', payload);
        Swal.fire('تم الإضافة', 'تم إضافة العقار', 'success');
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = (id, name) => {
    Swal.fire({
      title: 'تأكيد الحذف', text: `سيتم حذف العقار: ${name}`, icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/properties/${id}`).then(() => load());
    });
  };

  const typeLabel = (t) => ({ apartment: 'شقة', villa: 'فيلا', cabin: 'كابينة', studio: 'استوديو' })[t] || t;
  const statusBadge = (s) => {
    const colors = { available: 'success', rented: 'warning', maintenance: 'danger', unavailable: 'secondary' };
    const labels = { available: 'متاح', rented: 'مؤجر', maintenance: 'صيانة', unavailable: 'غير متاح' };
    return <span className={`badge bg-${colors[s] || 'secondary'}`}>{labels[s] || s}</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0">
          <i className="bi bi-building me-2"></i>
          إدارة العقارات
        </h5>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-plus-lg"></i> عقار جديد
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input className="form-control" placeholder="بحث بالاسم أو الموقع..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-2">
              <select className="form-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">كل الأنواع</option>
                <option value="apartment">شقة</option>
                <option value="villa">فيلا</option>
                <option value="cabin">كابينة</option>
                <option value="studio">استوديو</option>
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">كل الحالات</option>
                <option value="available">متاح</option>
                <option value="rented">مؤجر</option>
                <option value="maintenance">صيانة</option>
                <option value="unavailable">غير متاح</option>
              </select>
            </div>
            <div className="col-md-2">
              <input type="number" className="form-control" placeholder="الحد الأدنى للسعة..." value={capacityFilter} onChange={e => setCapacityFilter(e.target.value)} min="1" />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter(''); setCapacityFilter(''); }}>
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
              <tr><th>الاسم</th><th>النوع</th><th>الموقع</th><th>غرف النوم</th><th>السعة</th><th>سعر الليلة</th><th>المالك</th><th>هاتف المالك</th><th>الحالة</th><th></th></tr>
            </thead>
            <tbody>
              {properties.map(p => (
                <tr key={p.id}>
                  <td className="fw-semibold">{p.name}</td>
                  <td><span className="badge bg-light text-dark">{typeLabel(p.type)}</span></td>
                  <td>{p.location || '-'}</td>
                  <td>{p.bedrooms || '-'}</td>
                  <td>{p.capacity ? `${p.capacity} أشخاص` : '-'}</td>
                  <td className="fw-bold">{Number(p.price_per_night).toLocaleString()} {p.currency}</td>
                  <td>{p.owner_name || '-'}</td>
                  <td dir="ltr">{p.owner_phone || '-'}</td>
                  <td>{statusBadge(p.status)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openEdit(p)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id, p.name)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {properties.length === 0 && <tr><td colSpan="10" className="text-center text-muted py-4">لا توجد عقارات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-building me-2"></i>{editingId ? 'تعديل العقار' : 'إضافة عقار جديد'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">اسم العقار <span className="text-danger">*</span></label>
                      <input className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">النوع <span className="text-danger">*</span></label>
                      <select className="form-select" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                        <option value="apartment">شقة</option>
                        <option value="villa">فيلا</option>
                        <option value="cabin">كابينة</option>
                        <option value="studio">استوديو</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الموقع</label>
                      <input className="form-control" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">غرف النوم</label>
                      <input type="number" className="form-control" value={formData.bedrooms} onChange={e => setFormData({ ...formData, bedrooms: e.target.value })} min="0" />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">السعة (أشخاص)</label>
                      <input type="number" className="form-control" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} min="1" />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">سعر الليلة <span className="text-danger">*</span></label>
                      <input type="number" className="form-control" value={formData.price_per_night} onChange={e => setFormData({ ...formData, price_per_night: e.target.value })} min="0" step="0.01" required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">العملة</label>
                      <select className="form-select" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                        <option value="USD">دولار أمريكي</option>
                        <option value="ILS">شيكل إسرائيلي</option>
                        <option value="EUR">يورو</option>
                        <option value="JOD">دينار أردني</option>
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">الحالة</label>
                      <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <option value="available">متاح</option>
                        <option value="rented">مؤجر</option>
                        <option value="maintenance">صيانة</option>
                        <option value="unavailable">غير متاح</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">اسم المالك</label>
                      <input className="form-control" value={formData.owner_name} onChange={e => setFormData({ ...formData, owner_name: e.target.value })} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">هاتف المالك</label>
                      <input className="form-control" value={formData.owner_phone} onChange={e => setFormData({ ...formData, owner_phone: e.target.value })} />
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
