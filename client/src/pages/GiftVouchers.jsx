import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function GiftVouchers() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '', customer_id: '', amount: '', expiry_date: '', notes: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterActive !== 'all') params.is_active = filterActive === 'active' ? 'true' : 'false';
      const res = await api.get('/gift-vouchers', { params });
      setRows(res.data.rows || res.data || []);
    } catch {
      Swal.fire('خطأ', 'فشل تحميل قسائم الهدايا', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, filterActive]);

  useEffect(() => {
    api.get('/customers').then(r => setCustomers(r.data.rows || r.data || [])).catch(() => {});
  }, []);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData(prev => ({ ...prev, code }));
  };

  const resetForm = () => {
    setFormData({ code: '', customer_id: '', amount: '', expiry_date: '', notes: '' });
    setEditId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (v) => {
    setEditId(v.id);
    setFormData({
      code: v.code || '',
      customer_id: v.customer_id || '',
      amount: v.amount ?? '',
      expiry_date: v.expiry_date ? v.expiry_date.slice(0, 10) : '',
      notes: v.notes || ''
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.customer_id || !formData.amount || !formData.expiry_date) {
      Swal.fire('تنبيه', 'الرجاء إكمال الحقول المطلوبة', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        code: formData.code.toUpperCase(),
        customer_id: Number(formData.customer_id),
        amount: Number(formData.amount),
        remaining: Number(formData.amount),
        expiry_date: formData.expiry_date,
        notes: formData.notes || null
      };
      if (editId) {
        await api.put(`/gift-vouchers/${editId}`, body);
        Swal.fire({ title: 'تم التحديث', text: 'تم تحديث القسيمة بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/gift-vouchers', body);
        Swal.fire({ title: 'تم الإضافة', text: 'تم إضافة القسيمة بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل حفظ القسيمة', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (v) => {
    Swal.fire({
      title: 'هل أنت متأكد؟', text: `سيتم حذف القسيمة: ${v.code}`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6', confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء'
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          await api.delete(`/gift-vouchers/${v.id}`);
          Swal.fire('تم الحذف', 'تم حذف القسيمة بنجاح', 'success');
          load();
        } catch { Swal.fire('خطأ', 'فشل حذف القسيمة', 'error'); }
      }
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0"><i className="bi bi-gift me-2"></i>قسائم هدايا</h5>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-1"></i>إضافة قسيمة</button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input className="form-control" placeholder="بحث بالكود..." value={search} onChange={e => setSearch(e.target.value)} />
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
          ) : rows.length === 0 ? (
            <div className="text-center py-4 text-muted"><i className="bi bi-inbox fs-1 d-block mb-2"></i>لا توجد قسائم هدايا</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>الكود</th>
                    <th>العميل</th>
                    <th>المبلغ</th>
                    <th>المتبقي</th>
                    <th>تاريخ الانتهاء</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(v => (
                    <tr key={v.id}>
                      <td><span className="badge bg-dark fs-6">{v.code}</span></td>
                      <td>{v.customer_name || v.customer_id}</td>
                      <td>{Number(v.amount).toLocaleString()}</td>
                      <td>{Number(v.remaining).toLocaleString()}</td>
                      <td>{v.expiry_date ? new Date(v.expiry_date).toLocaleDateString('ar-SA') : '-'}</td>
                      <td>
                        <span className={`badge ${v.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {v.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-warning" onClick={() => openEdit(v)} title="تعديل"><i className="bi bi-pencil"></i></button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(v)} title="حذف"><i className="bi bi-trash"></i></button>
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
                <h5 className="modal-title"><i className={`bi ${editId ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>{editId ? 'تعديل القسيمة' : 'إضافة قسيمة جديدة'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الكود <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <input type="text" className="form-control" name="code" value={formData.code} onChange={handleChange} placeholder="رمز القسيمة" required />
                        <button type="button" className="btn btn-outline-secondary" onClick={generateCode} title="توليد كود"><i className="bi bi-dice-5"></i></button>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">العميل <span className="text-danger">*</span></label>
                      <select className="form-select" name="customer_id" value={formData.customer_id} onChange={handleChange} required>
                        <option value="">اختر عميل</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name || c.full_name || c.id}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">المبلغ <span className="text-danger">*</span></label>
                      <input type="number" className="form-control" name="amount" value={formData.amount} onChange={handleChange} min="0" step="0.01" required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">تاريخ الانتهاء <span className="text-danger">*</span></label>
                      <input type="date" className="form-control" name="expiry_date" value={formData.expiry_date} onChange={handleChange} required />
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
