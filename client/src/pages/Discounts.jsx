import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', code: '', type: 'percentage', value: '',
    applies_to: 'all', min_amount: '', max_uses: '',
    valid_from: '', valid_to: '', notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterActive !== 'all') params.is_active = filterActive === 'active' ? 'true' : 'false';
      const res = await api.get('/discounts', { params });
      setDiscounts(res.data.rows || res.data || []);
    } catch {
      Swal.fire('خطأ', 'فشل تحميل الخصومات', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterActive]);

  useEffect(() => { fetchDiscounts(); }, [fetchDiscounts]);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData(prev => ({ ...prev, code }));
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', type: 'percentage', value: '', applies_to: 'all', min_amount: '', max_uses: '', valid_from: '', valid_to: '', notes: '' });
    setEditId(null);
  };

  const openAddModal = () => { resetForm(); setShowModal(true); };
  const openEditModal = (d) => {
    setEditId(d.id);
    setFormData({
      name: d.name || '', code: d.code || '', type: d.type || 'percentage',
      value: d.value ?? '', applies_to: d.applies_to || 'all',
      min_amount: d.min_amount ?? '', max_uses: d.max_uses ?? '',
      valid_from: d.valid_from ? d.valid_from.slice(0, 10) : '',
      valid_to: d.valid_to ? d.valid_to.slice(0, 10) : '',
      notes: d.notes || ''
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.value) {
      Swal.fire('تنبيه', 'الرجاء إكمال الحقول المطلوبة', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        name: formData.name, code: formData.code.toUpperCase(), type: formData.type,
        value: Number(formData.value), applies_to: formData.applies_to,
        min_amount: formData.min_amount ? Number(formData.min_amount) : null,
        max_uses: formData.max_uses ? Number(formData.max_uses) : null,
        valid_from: formData.valid_from || null,
        valid_to: formData.valid_to || null, notes: formData.notes || null
      };
      if (editId) {
        await api.put(`/discounts/${editId}`, body);
        Swal.fire({ title: 'تم التحديث', text: 'تم تحديث الخصم بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/discounts', body);
        Swal.fire({ title: 'تم الإضافة', text: 'تم إضافة الخصم بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      }
      setShowModal(false);
      resetForm();
      fetchDiscounts();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل حفظ الخصم', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = (d) => {
    Swal.fire({
      title: 'تأكيد', text: `هل تريد ${d.is_active ? 'تعطيل' : 'تفعيل'} هذا الخصم؟`,
      icon: 'question', showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          await api.put(`/discounts/${d.id}`, { is_active: !d.is_active });
          Swal.fire({ title: 'تم', text: `تم ${d.is_active ? 'تعطيل' : 'تفعيل'} الخصم`, icon: 'success', timer: 2000, showConfirmButton: false });
          fetchDiscounts();
        } catch { Swal.fire('خطأ', 'فشل تحديث الحالة', 'error'); }
      }
    });
  };

  const handleDelete = (d) => {
    Swal.fire({
      title: 'هل أنت متأكد؟', text: `سيتم حذف الخصم: ${d.name}`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6', confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء'
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          await api.delete(`/discounts/${d.id}`);
          Swal.fire('تم الحذف', 'تم حذف الخصم بنجاح', 'success');
          fetchDiscounts();
        } catch { Swal.fire('خطأ', 'فشل حذف الخصم', 'error'); }
      }
    });
  };

  const filtered = discounts.filter(d =>
    (search === '' || d.name?.toLowerCase().includes(search.toLowerCase()) || d.code?.toLowerCase().includes(search.toLowerCase()))
  );

  const typeLabels = { percentage: 'نسبة مئوية', fixed: 'قيمة ثابتة' };
  const appliesLabels = { all: 'الكل', flight: 'طيران', hotel: 'فندق', package: 'بكج', visa: 'تأشيرة' };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0"><i className="bi bi-tags me-2"></i>الخصومات وأكواد الترويج</h5>
        <button className="btn btn-primary" onClick={openAddModal}><i className="bi bi-plus-lg me-1"></i>إضافة خصم</button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-6">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input className="form-control" placeholder="بحث بالاسم أو الكود..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={filterActive} onChange={e => setFilterActive(e.target.value)}>
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary"></div></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-4 text-muted"><i className="bi bi-inbox fs-1 d-block mb-2"></i>لا توجد خصومات</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>الكود</th>
                    <th>النوع</th>
                    <th>القيمة</th>
                    <th>يُطبق على</th>
                    <th>الحد الأدنى</th>
                    <th>الاستخدام</th>
                    <th>صالح من</th>
                    <th>صالح إلى</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={d.id}>
                      <td className="fw-semibold">{d.name}</td>
                      <td><span className="badge bg-dark fs-6">{d.code}</span></td>
                      <td>{typeLabels[d.type] || d.type}</td>
                      <td>{d.type === 'percentage' ? `${d.value}%` : d.value?.toLocaleString()}</td>
                      <td>{appliesLabels[d.applies_to] || d.applies_to}</td>
                      <td>{d.min_amount ? d.min_amount?.toLocaleString() : '-'}</td>
                      <td>{d.use_count ?? 0}{d.max_uses ? ` / ${d.max_uses}` : ''}</td>
                      <td>{d.valid_from ? new Date(d.valid_from).toLocaleDateString('ar-SA') : '-'}</td>
                      <td>{d.valid_to ? new Date(d.valid_to).toLocaleDateString('ar-SA') : '-'}</td>
                      <td>
                        <span className={`badge ${d.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {d.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-warning" onClick={() => openEditModal(d)} title="تعديل"><i className="bi bi-pencil"></i></button>
                          <button className="btn btn-sm btn-outline-info" onClick={() => toggleActive(d)} title={d.is_active ? 'تعطيل' : 'تفعيل'}>
                            <i className={`bi ${d.is_active ? 'bi-pause-circle' : 'bi-play-circle'}`}></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(d)} title="حذف"><i className="bi bi-trash"></i></button>
                        </div>
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
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className={`bi ${editId ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>{editId ? 'تعديل الخصم' : 'إضافة خصم جديد'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">اسم الخصم <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} placeholder="مثال: خصم الصيف" required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">كود الخصم <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <input type="text" className="form-control" name="code" value={formData.code} onChange={handleChange} placeholder="مثال: SUMMER20" required />
                        <button type="button" className="btn btn-outline-secondary" onClick={generateCode} title="توليد كود عشوائي"><i className="bi bi-dice-5"></i></button>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">النوع <span className="text-danger">*</span></label>
                      <select className="form-select" name="type" value={formData.type} onChange={handleChange}>
                        <option value="percentage">نسبة مئوية</option>
                        <option value="fixed">قيمة ثابتة</option>
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">القيمة <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <input type="number" className="form-control" name="value" value={formData.value} onChange={handleChange} min="0" step="0.01" required />
                        <span className="input-group-text">{formData.type === 'percentage' ? '%' : 'ر.س'}</span>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">يُطبق على</label>
                      <select className="form-select" name="applies_to" value={formData.applies_to} onChange={handleChange}>
                        <option value="all">الكل</option>
                        <option value="flight">طيران</option>
                        <option value="hotel">فندق</option>
                        <option value="package">بكج</option>
                        <option value="visa">تأشيرة</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">الحد الأدنى للطلب</label>
                      <input type="number" className="form-control" name="min_amount" value={formData.min_amount} onChange={handleChange} min="0" placeholder="0" />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">أقصى عدد استخدام</label>
                      <input type="number" className="form-control" name="max_uses" value={formData.max_uses} onChange={handleChange} min="0" placeholder="غير محدود" />
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
                    <textarea className="form-control" name="notes" value={formData.notes} onChange={handleChange} rows="2"></textarea>
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
