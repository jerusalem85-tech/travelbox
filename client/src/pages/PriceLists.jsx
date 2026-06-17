import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function PriceLists() {
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', service_type: 'flight', destination: '', season: 'peak',
    price: '', currency: 'SAR', supplier_id: '', valid_from: '', valid_to: '', notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (serviceTypeFilter) params.append('service_type', serviceTypeFilter);
      if (seasonFilter) params.append('season', seasonFilter);
      const res = await api.get(`/price-lists?${params.toString()}`);
      setRows(res.data.rows || res.data || []);
    } catch (err) {
      Swal.fire('خطأ', 'فشل تحميل قوائم الأسعار', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers', { params: { limit: 1000 } });
      setSuppliers(res.data.rows || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, [search, serviceTypeFilter, seasonFilter]);
  useEffect(() => { fetchSuppliers(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '', service_type: 'flight', destination: '', season: 'peak',
      price: '', currency: 'SAR', supplier_id: '', valid_from: '', valid_to: '', notes: ''
    });
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (item) => {
    setFormData({
      name: item.name, service_type: item.service_type, destination: item.destination,
      season: item.season, price: item.price, currency: item.currency || 'SAR',
      supplier_id: item.supplier_id || '', valid_from: item.valid_from?.split('T')[0] || '',
      valid_to: item.valid_to?.split('T')[0] || '', notes: item.notes || ''
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { Swal.fire('تنبيه', 'أدخل اسم التسعيرة', 'warning'); return; }
    if (!formData.price || Number(formData.price) <= 0) { Swal.fire('تنبيه', 'أدخل سعر صحيح', 'warning'); return; }
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name, service_type: formData.service_type, destination: formData.destination,
        season: formData.season, price: Number(formData.price), currency: formData.currency,
        supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null,
        valid_from: formData.valid_from || null, valid_to: formData.valid_to || null,
        notes: formData.notes
      };
      if (editingId) {
        await api.put(`/price-lists/${editingId}`, payload);
        Swal.fire({ title: 'تم التحديث', text: 'تم تحديث التسعيرة بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/price-lists', payload);
        Swal.fire({ title: 'تم الإضافة', text: 'تم إضافة التسعيرة بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, name) => {
    Swal.fire({
      title: 'هل أنت متأكد؟', text: `سيتم حذف التسعيرة: ${name}`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/price-lists/${id}`);
          Swal.fire('تم الحذف', 'تم حذف التسعيرة بنجاح', 'success');
          fetchData();
        } catch (err) { Swal.fire('خطأ', 'فشل حذف التسعيرة', 'error'); }
      }
    });
  };

  const typeLabel = (t) => ({ flight: 'طيران', hotel: 'فندق', package: 'باقة', visa: 'فيزا', transfer: 'انتقال' })[t] || t;
  const seasonLabel = (s) => ({ peak: 'الذروة', shoulder: 'متوسط', off: 'خارج الموسم', low: 'منخفض' })[s] || s;

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0"><i className="bi bi-tags me-2"></i>قوائم الأسعار</h4>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-1"></i>إضافة تسعيرة</button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">بحث</label>
              <input className="form-control" placeholder="بحث بالاسم أو الوجهة..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">نوع الخدمة</label>
              <select className="form-select" value={serviceTypeFilter} onChange={e => setServiceTypeFilter(e.target.value)}>
                <option value="">الكل</option>
                <option value="flight">طيران</option>
                <option value="hotel">فندق</option>
                <option value="package">باقة</option>
                <option value="visa">فيزا</option>
                <option value="transfer">انتقال</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">الموسم</label>
              <select className="form-select" value={seasonFilter} onChange={e => setSeasonFilter(e.target.value)}>
                <option value="">الكل</option>
                <option value="peak">الذروة</option>
                <option value="shoulder">متوسط</option>
                <option value="off">خارج الموسم</option>
                <option value="low">منخفض</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setServiceTypeFilter(''); setSeasonFilter(''); }}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">جاري التحميل...</span></div></div>
          ) : rows.length === 0 ? (
            <div className="text-center py-4 text-muted"><i className="bi bi-inbox fs-1 d-block mb-2"></i>لا توجد تسعيرات</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>#</th><th>الاسم</th><th>نوع الخدمة</th><th>الوجهة</th><th>الموسم</th><th>السعر</th><th>العملة</th><th>المورد</th><th>صالح من</th><th>صالح إلى</th><th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td className="fw-bold">{item.name}</td>
                      <td><span className="badge bg-light text-dark">{typeLabel(item.service_type)}</span></td>
                      <td>{item.destination || '-'}</td>
                      <td><span className="badge bg-info text-dark">{seasonLabel(item.season)}</span></td>
                      <td className="fw-bold text-success">{Number(item.price).toLocaleString()}</td>
                      <td>{item.currency || 'SAR'}</td>
                      <td>{item.supplier_name || '-'}</td>
                      <td className="small">{item.valid_from ? new Date(item.valid_from).toLocaleDateString('ar-SA') : '-'}</td>
                      <td className="small">{item.valid_to ? new Date(item.valid_to).toLocaleDateString('ar-SA') : '-'}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openEdit(item)} title="تعديل"><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id, item.name)} title="حذف"><i className="bi bi-trash"></i></button>
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
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-{editingId ? 'pencil' : 'plus-circle'} me-2"></i>{editingId ? 'تعديل التسعيرة' : 'إضافة تسعيرة جديدة'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الاسم <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} placeholder="اسم التسعيرة..." required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">نوع الخدمة <span className="text-danger">*</span></label>
                      <select className="form-select" name="service_type" value={formData.service_type} onChange={handleChange}>
                        <option value="flight">طيران</option>
                        <option value="hotel">فندق</option>
                        <option value="package">باقة</option>
                        <option value="visa">فيزا</option>
                        <option value="transfer">انتقال</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الوجهة</label>
                      <input type="text" className="form-control" name="destination" value={formData.destination} onChange={handleChange} placeholder="مثال: دبي، اسطنبول..." />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الموسم <span className="text-danger">*</span></label>
                      <select className="form-select" name="season" value={formData.season} onChange={handleChange}>
                        <option value="peak">الذروة</option>
                        <option value="shoulder">متوسط</option>
                        <option value="off">خارج الموسم</option>
                        <option value="low">منخفض</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">السعر <span className="text-danger">*</span></label>
                      <input type="number" className="form-control" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" placeholder="0.00" required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">العملة</label>
                      <select className="form-select" name="currency" value={formData.currency} onChange={handleChange}>
                        <option value="SAR">ريال سعودي</option>
                        <option value="USD">دولار أمريكي</option>
                        <option value="EUR">يورو</option>
                        <option value="GBP">جنيه إسترليني</option>
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">المورد</label>
                      <select className="form-select" name="supplier_id" value={formData.supplier_id} onChange={handleChange}>
                        <option value="">اختر المورد (اختياري)</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">صالح من</label>
                      <input type="date" className="form-control" name="valid_from" value={formData.valid_from} onChange={handleChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">صالح إلى</label>
                      <input type="date" className="form-control" name="valid_to" value={formData.valid_to} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">ملاحظات</label>
                    <textarea className="form-control" name="notes" value={formData.notes} onChange={handleChange} rows="2" placeholder="ملاحظات..."></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span>جاري الحفظ...</> : <><i className="bi bi-check-lg me-1"></i>{editingId ? 'تحديث' : 'حفظ'}</>}
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
