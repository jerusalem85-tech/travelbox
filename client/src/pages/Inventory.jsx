import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function Inventory() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: '', quantity: '', unit: 'piece', unit_cost: '', notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      const res = await api.get(`/inventory?${params.toString()}`);
      setRows(res.data.rows || res.data || []);
    } catch (err) {
      Swal.fire('خطأ', 'فشل تحميل المخزون', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/inventory/categories');
      setCategories(res.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, [search, categoryFilter]);
  useEffect(() => { fetchCategories(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: '', category: '', quantity: '', unit: 'piece', unit_cost: '', notes: '' });
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (item) => {
    setFormData({
      name: item.name, category: item.category, quantity: item.quantity,
      unit: item.unit || 'piece', unit_cost: item.unit_cost, notes: item.notes || ''
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { Swal.fire('تنبيه', 'أدخل اسم الصنف', 'warning'); return; }
    if (!formData.quantity || Number(formData.quantity) < 0) { Swal.fire('تنبيه', 'أدخل كمية صحيحة', 'warning'); return; }
    if (!formData.unit_cost || Number(formData.unit_cost) < 0) { Swal.fire('تنبيه', 'أدخل تكلفة الوحدة صحيحة', 'warning'); return; }
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name, category: formData.category, quantity: Number(formData.quantity),
        unit: formData.unit, unit_cost: Number(formData.unit_cost), notes: formData.notes
      };
      if (editingId) {
        await api.put(`/inventory/${editingId}`, payload);
        Swal.fire({ title: 'تم التحديث', text: 'تم تحديث الصنف بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/inventory', payload);
        Swal.fire({ title: 'تم الإضافة', text: 'تم إضافة الصنف بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
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
      title: 'هل أنت متأكد؟', text: `سيتم حذف الصنف: ${name}`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/inventory/${id}`);
          Swal.fire('تم الحذف', 'تم حذف الصنف بنجاح', 'success');
          fetchData();
        } catch (err) { Swal.fire('خطأ', 'فشل حذف الصنف', 'error'); }
      }
    });
  };

  const unitLabel = (u) => ({ piece: 'قطعة', kg: 'كجم', liter: 'لتر', box: 'كرتونة' })[u] || u;
  const totalItems = rows.length;
  const totalValue = rows.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_cost)), 0);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0"><i className="bi bi-box-seam me-2"></i>المخزون</h4>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-1"></i>إضافة صنف</button>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <i className="bi bi-boxes fs-2 mb-1"></i>
              <div className="small">إجمالي الأصناف</div>
              <h4 className="mb-0">{totalItems}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <i className="bi bi-currency-exchange fs-2 mb-1"></i>
              <div className="small">إجمالي القيمة</div>
              <h4 className="mb-0">{totalValue.toLocaleString()} ر.س</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-5">
              <label className="form-label">بحث</label>
              <input className="form-control" placeholder="بحث بالاسم أو التصنيف..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">التصنيف</label>
              <select className="form-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="">جميع التصنيفات</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setCategoryFilter(''); }}>
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
            <div className="text-center py-4 text-muted"><i className="bi bi-inbox fs-1 d-block mb-2"></i>لا توجد أصناف في المخزون</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>#</th><th>الاسم</th><th>التصنيف</th><th>الكمية</th><th>الوحدة</th><th>تكلفة الوحدة</th><th>القيمة الإجمالية</th><th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => {
                    const itemTotal = Number(item.quantity) * Number(item.unit_cost);
                    return (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td className="fw-bold">{item.name}</td>
                        <td><span className="badge bg-light text-dark"><i className="bi bi-tag me-1"></i>{item.category || '-'}</span></td>
                        <td>{Number(item.quantity).toLocaleString()}</td>
                        <td>{unitLabel(item.unit)}</td>
                        <td>{Number(item.unit_cost).toLocaleString()} ر.س</td>
                        <td className="fw-bold text-success">{itemTotal.toLocaleString()} ر.س</td>
                        <td>
                          <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openEdit(item)} title="تعديل"><i className="bi bi-pencil"></i></button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id, item.name)} title="حذف"><i className="bi bi-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="table-active">
                    <td colSpan="6" className="fw-bold text-end">الإجمالي:</td>
                    <td className="fw-bold text-success">{totalValue.toLocaleString()} ر.س</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-{editingId ? 'pencil' : 'plus-circle'} me-2"></i>{editingId ? 'تعديل الصنف' : 'إضافة صنف جديد'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">الاسم <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} placeholder="اسم الصنف..." required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">التصنيف</label>
                    <input type="text" className="form-control" name="category" value={formData.category} onChange={handleChange} placeholder="مثال: أدوات مكتبية، مستلزمات..." list="categoryList" />
                    <datalist id="categoryList">
                      {categories.map((cat, idx) => <option key={idx} value={cat} />)}
                    </datalist>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">الكمية <span className="text-danger">*</span></label>
                      <input type="number" className="form-control" name="quantity" value={formData.quantity} onChange={handleChange} min="0" step="1" placeholder="0" required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">الوحدة</label>
                      <select className="form-select" name="unit" value={formData.unit} onChange={handleChange}>
                        <option value="piece">قطعة</option>
                        <option value="kg">كجم</option>
                        <option value="liter">لتر</option>
                        <option value="box">كرتونة</option>
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">تكلفة الوحدة <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <input type="number" className="form-control" name="unit_cost" value={formData.unit_cost} onChange={handleChange} min="0" step="0.01" placeholder="0.00" required />
                        <span className="input-group-text">ر.س</span>
                      </div>
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
