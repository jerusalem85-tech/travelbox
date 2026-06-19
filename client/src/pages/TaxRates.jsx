import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function TaxRates() {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', rate: '', applies_to: 'all', notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTaxes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tax-rates');
      setTaxes(res.data.rows || res.data || []);
    } catch {
      Swal.fire('خطأ', 'فشل تحميل الضرائب', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTaxes(); }, [fetchTaxes]);

  const resetForm = () => {
    setFormData({ name: '', rate: '', applies_to: 'all', notes: '' });
    setEditId(null);
  };

  const openAddModal = () => { resetForm(); setShowModal(true); };
  const openEditModal = (t) => {
    setEditId(t.id);
    setFormData({
      name: t.name || '', rate: t.rate ?? '',
      applies_to: t.applies_to || 'all', notes: t.notes || ''
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.rate === '' || Number(formData.rate) < 0) {
      Swal.fire('تنبيه', 'الرجاء إدخال اسم ونسبة ضريبة صحيحة', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        name: formData.name, rate: Number(formData.rate),
        applies_to: formData.applies_to, notes: formData.notes || null
      };
      if (editId) {
        await api.put(`/tax-rates/${editId}`, body);
        Swal.fire({ title: 'تم التحديث', text: 'تم تحديث الضريبة بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/tax-rates', body);
        Swal.fire({ title: 'تم الإضافة', text: 'تم إضافة الضريبة بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      }
      setShowModal(false);
      resetForm();
      fetchTaxes();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل حفظ الضريبة', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = (t) => {
    Swal.fire({
      title: 'تأكيد', text: `هل تريد ${t.is_active ? 'تعطيل' : 'تفعيل'} هذه الضريبة؟`,
      icon: 'question', showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          await api.put(`/tax-rates/${t.id}`, { is_active: !t.is_active });
          Swal.fire({ title: 'تم', text: `تم ${t.is_active ? 'تعطيل' : 'تفعيل'} الضريبة`, icon: 'success', timer: 2000, showConfirmButton: false });
          fetchTaxes();
        } catch { Swal.fire('خطأ', 'فشل تحديث الحالة', 'error'); }
      }
    });
  };

  const handleDelete = (t) => {
    Swal.fire({
      title: 'هل أنت متأكد؟', text: `سيتم حذف الضريبة: ${t.name}`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6', confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء'
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          await api.delete(`/tax-rates/${t.id}`);
          Swal.fire('تم الحذف', 'تم حذف الضريبة بنجاح', 'success');
          fetchTaxes();
        } catch { Swal.fire('خطأ', 'فشل حذف الضريبة', 'error'); }
      }
    });
  };

  const appliesLabels = { all: 'الكل', flight: 'طيران', hotel: 'فندق', package: 'بكج', visa: 'تأشيرة', service: 'خدمة' };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0"><i className="bi bi-percent me-2"></i>نسب الضرائب</h5>
        <button className="btn btn-primary" onClick={openAddModal}><i className="bi bi-plus-lg me-1"></i>إضافة ضريبة</button>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary"></div></div>
          ) : taxes.length === 0 ? (
            <div className="text-center py-4 text-muted"><i className="bi bi-inbox fs-1 d-block mb-2"></i>لا توجد ضرائب</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>النسبة</th>
                    <th>يُطبق على</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {taxes.map(t => (
                    <tr key={t.id}>
                      <td className="fw-semibold">{t.name}</td>
                      <td><span className="badge bg-info fs-6">{Number(t.rate).toFixed(2)}%</span></td>
                      <td>{appliesLabels[t.applies_to] || t.applies_to}</td>
                      <td>
                        <span className={`badge ${t.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {t.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-warning" onClick={() => openEditModal(t)} title="تعديل"><i className="bi bi-pencil"></i></button>
                          <button className="btn btn-sm btn-outline-info" onClick={() => toggleActive(t)} title={t.is_active ? 'تعطيل' : 'تفعيل'}>
                            <i className={`bi ${t.is_active ? 'bi-pause-circle' : 'bi-play-circle'}`}></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(t)} title="حذف"><i className="bi bi-trash"></i></button>
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
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className={`bi ${editId ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>{editId ? 'تعديل الضريبة' : 'إضافة ضريبة جديدة'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">اسم الضريبة <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} placeholder="مثال: ضريبة القيمة المضافة" required />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">النسبة (%) <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <input type="number" className="form-control" name="rate" value={formData.rate} onChange={handleChange} min="0" step="0.01" placeholder="15.00" required />
                        <span className="input-group-text">%</span>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">يُطبق على</label>
                      <select className="form-select" name="applies_to" value={formData.applies_to} onChange={handleChange}>
                        <option value="all">الكل</option>
                        <option value="flight">طيران</option>
                        <option value="hotel">فندق</option>
                        <option value="package">بكج</option>
                        <option value="visa">تأشيرة</option>
                        <option value="service">خدمة</option>
                      </select>
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
