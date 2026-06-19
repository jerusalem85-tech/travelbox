import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function Vehicles() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    plate_number: '', brand: '', model: '', year: '', capacity: '',
    vehicle_type: 'car', fuel_type: 'gasoline', status: 'available', daily_rate: ''
  });

  const load = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.vehicle_type = typeFilter;
      const res = await api.get('/vehicles', { params });
      setRows(res.data.rows || res.data || []);
    } catch { Swal.fire('خطأ', 'فشل تحميل المركبات', 'error'); }
  };

  useEffect(() => { load(); }, [search, statusFilter, typeFilter]);

  const resetForm = () => {
    setFormData({
      plate_number: '', brand: '', model: '', year: '', capacity: '',
      vehicle_type: 'car', fuel_type: 'gasoline', status: 'available', daily_rate: ''
    });
    setEditingId(null);
  };

  const openEdit = (item) => {
    setFormData({
      plate_number: item.plate_number, brand: item.brand || '', model: item.model || '',
      year: item.year || '', capacity: item.capacity || '',
      vehicle_type: item.vehicle_type || 'car', fuel_type: item.fuel_type || 'gasoline',
      status: item.status || 'available', daily_rate: item.daily_rate || ''
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.plate_number.trim()) { Swal.fire('تنبيه', 'أدخل رقم اللوحة', 'warning'); return; }
    if (!formData.brand.trim()) { Swal.fire('تنبيه', 'أدخل الماركة', 'warning'); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        year: formData.year ? Number(formData.year) : null,
        capacity: formData.capacity ? Number(formData.capacity) : null,
        daily_rate: formData.daily_rate ? Number(formData.daily_rate) : null
      };
      if (editingId) {
        await api.put(`/vehicles/${editingId}`, payload);
        Swal.fire('تم التحديث', 'تم تحديث بيانات المركبة', 'success');
      } else {
        await api.post('/vehicles', payload);
        Swal.fire('تم الإضافة', 'تم إضافة المركبة', 'success');
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = (id, plate) => {
    Swal.fire({
      title: 'تأكيد الحذف', text: `سيتم حذف المركبة: ${plate}`, icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/vehicles/${id}`).then(() => load());
    });
  };

  const typeLabel = (t) => ({ car: 'سيارة', bus: 'حافلة', van: 'شاحنة صغيرة', minivan: 'ميني فان', luxury: 'فخمة' })[t] || t;
  const fuelLabel = (f) => ({ gasoline: 'بنزين', diesel: 'ديزل', electric: 'كهرباء', hybrid: 'هايبرد' })[f] || f;
  const statusBadge = (s) => {
    const colors = { available: 'success', in_use: 'warning', maintenance: 'danger', retired: 'secondary' };
    const labels = { available: 'متاحة', in_use: 'قيد الاستخدام', maintenance: 'صيانة', retired: 'متقاعدة' };
    return <span className={`badge bg-${colors[s] || 'secondary'}`}>{labels[s] || s}</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0">إدارة المركبات</h5>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-plus-lg"></i> مركبة جديدة
        </button>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input className="form-control" placeholder="بحث برقم اللوحة أو الماركة أو الموديل..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">كل الحالات</option>
                <option value="available">متاحة</option>
                <option value="in_use">قيد الاستخدام</option>
                <option value="maintenance">صيانة</option>
                <option value="retired">متقاعدة</option>
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">كل الأنواع</option>
                <option value="car">سيارة</option>
                <option value="bus">حافلة</option>
                <option value="van">شاحنة صغيرة</option>
                <option value="minivan">ميني فان</option>
                <option value="luxury">فخمة</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); }}>
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
              <tr><th>رقم اللوحة</th><th>الماركة</th><th>الموديل</th><th>السنة</th><th>السعة</th><th>النوع</th><th>الوقود</th><th>الحالة</th><th>السعر اليومي</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="fw-semibold" dir="ltr">{r.plate_number}</td>
                  <td>{r.brand}</td>
                  <td>{r.model || '-'}</td>
                  <td>{r.year || '-'}</td>
                  <td>{r.capacity ? `${r.capacity} أشخاص` : '-'}</td>
                  <td>{typeLabel(r.vehicle_type)}</td>
                  <td>{fuelLabel(r.fuel_type)}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td className="fw-bold">{r.daily_rate ? Number(r.daily_rate).toLocaleString() + ' ر.س' : '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openEdit(r)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id, r.plate_number)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="10" className="text-center text-muted py-4">لا توجد مركبات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-truck me-2"></i>{editingId ? 'تعديل المركبة' : 'إضافة مركبة جديدة'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">رقم اللوحة <span className="text-danger">*</span></label>
                      <input className="form-control" value={formData.plate_number} onChange={e => setFormData({ ...formData, plate_number: e.target.value })} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الماركة <span className="text-danger">*</span></label>
                      <input className="form-control" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} required />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">الموديل</label>
                      <input className="form-control" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">السنة</label>
                      <input type="number" className="form-control" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} min="1990" max="2030" />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">السعة (أشخاص)</label>
                      <input type="number" className="form-control" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} min="1" />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">النوع</label>
                      <select className="form-select" value={formData.vehicle_type} onChange={e => setFormData({ ...formData, vehicle_type: e.target.value })}>
                        <option value="car">سيارة</option>
                        <option value="bus">حافلة</option>
                        <option value="van">شاحنة صغيرة</option>
                        <option value="minivan">ميني فان</option>
                        <option value="luxury">فخمة</option>
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">نوع الوقود</label>
                      <select className="form-select" value={formData.fuel_type} onChange={e => setFormData({ ...formData, fuel_type: e.target.value })}>
                        <option value="gasoline">بنزين</option>
                        <option value="diesel">ديزل</option>
                        <option value="electric">كهرباء</option>
                        <option value="hybrid">هايبرد</option>
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">الحالة</label>
                      <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <option value="available">متاحة</option>
                        <option value="in_use">قيد الاستخدام</option>
                        <option value="maintenance">صيانة</option>
                        <option value="retired">متقاعدة</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">السعر اليومي</label>
                    <div className="input-group">
                      <input type="number" className="form-control" value={formData.daily_rate} onChange={e => setFormData({ ...formData, daily_rate: e.target.value })} min="0" step="0.01" />
                      <span className="input-group-text">ر.س</span>
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
