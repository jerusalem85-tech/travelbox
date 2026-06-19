import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function SignedContracts() {
  const [rows, setRows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewContract, setViewContract] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const [formData, setFormData] = useState({
    template_id: '', customer_id: '', booking_id: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterCustomer) params.customer_id = filterCustomer;
      const res = await api.get('/signed-contracts', { params });
      setRows(res.data.rows || res.data || []);
    } catch {
      Swal.fire('خطأ', 'فشل تحميل العقود الإلكترونية', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatus, filterCustomer]);

  useEffect(() => {
    api.get('/signed-contracts/templates').then(r => setTemplates(r.data.rows || r.data || [])).catch(() => {});
    api.get('/customers').then(r => setCustomers(r.data.rows || r.data || [])).catch(() => {});
  }, []);

  const resetForm = () => {
    setFormData({ template_id: '', customer_id: '', booking_id: '' });
    setSelectedTemplate(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
    setTimeout(() => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
      }
    }, 100);
  };

  const handleTemplateChange = (e) => {
    const id = e.target.value;
    setFormData(prev => ({ ...prev, template_id: id }));
    const tpl = templates.find(t => t.id == id);
    setSelectedTemplate(tpl || null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const getSignatureData = () => canvasRef.current?.toDataURL('image/png');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.template_id || !formData.customer_id) {
      Swal.fire('تنبيه', 'اختر القالب والعميل', 'warning');
      return;
    }
    const sigData = getSignatureData();
    const emptyCanvas = canvasRef.current?.toDataURL('image/png') ===
      (() => { const c = document.createElement('canvas'); c.width = canvasRef.current?.width || 400; c.height = canvasRef.current?.height || 200; return c.toDataURL(); })();
    if (emptyCanvas) {
      Swal.fire('تنبيه', 'يرجى التوقيع في المكان المخصص', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        template_id: Number(formData.template_id),
        customer_id: Number(formData.customer_id),
        booking_id: formData.booking_id ? Number(formData.booking_id) : null,
        signature_data: sigData
      };
      await api.post('/signed-contracts', body);
      Swal.fire({ title: 'تم التوقيع', text: 'تم توقيع العقد إلكترونياً', icon: 'success', timer: 2000, showConfirmButton: false });
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل حفظ العقد', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'هل أنت متأكد؟', text: 'سيتم حذف هذا العقد الإلكتروني',
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6', confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء'
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          await api.delete(`/signed-contracts/${id}`);
          Swal.fire('تم الحذف', 'تم حذف العقد', 'success');
          load();
        } catch { Swal.fire('خطأ', 'فشل حذف العقد', 'error'); }
      }
    });
  };

  const viewContractDetails = async (id) => {
    try {
      const res = await api.get(`/signed-contracts/${id}`);
      setViewContract(res.data.rows?.[0] || res.data || {});
    } catch {
      Swal.fire('خطأ', 'فشل تحميل العقد', 'error');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0"><i className="bi bi-pen me-2"></i>العقود الإلكترونية</h5>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-1"></i>توقيع عقد جديد</button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">كل الحالات</option>
                <option value="draft">مسودة</option>
                <option value="signed">موقع</option>
              </select>
            </div>
            <div className="col-md-4">
              <select className="form-select" value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)}>
                <option value="">كل العملاء</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name || c.full_name || c.id}</option>)}
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setFilterStatus(''); setFilterCustomer(''); }}>
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
              <tr>
                <th>العميل</th>
                <th>القالب</th>
                <th>رقم الحجز</th>
                <th>الحالة</th>
                <th>تاريخ التوقيع</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id}>
                  <td className="fw-semibold">{c.customer_name || c.customer_id}</td>
                  <td>{c.template_name || c.template_id}</td>
                  <td>{c.booking_id || '-'}</td>
                  <td>{c.status === 'signed' ? <span className="badge bg-success">موقع</span> : <span className="badge bg-warning text-dark">مسودة</span>}</td>
                  <td className="small">{c.signed_at ? new Date(c.signed_at).toLocaleString('ar-SA') : '-'}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-info" onClick={() => viewContractDetails(c.id)} title="عرض"><i className="bi bi-eye"></i></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)} title="حذف"><i className="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-4">لا توجد عقود إلكترونية</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-pen me-2"></i>توقيع عقد جديد</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">القالب <span className="text-danger">*</span></label>
                      <select className="form-select" name="template_id" value={formData.template_id} onChange={handleTemplateChange} required>
                        <option value="">اختر القالب</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">العميل <span className="text-danger">*</span></label>
                      <select className="form-select" name="customer_id" value={formData.customer_id} onChange={handleChange} required>
                        <option value="">اختر العميل</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name || c.full_name || c.id}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">رقم الحجز</label>
                    <input type="number" className="form-control" name="booking_id" value={formData.booking_id} onChange={handleChange} placeholder="اختياري" />
                  </div>
                  {selectedTemplate && (
                    <div className="mb-3">
                      <label className="form-label">محتوى العقد</label>
                      <div className="p-3 border rounded bg-light" style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', fontSize: '0.9rem' }}>
                        {selectedTemplate.content || 'لا يوجد محتوى'}
                      </div>
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">التوقيع <span className="text-danger">*</span></label>
                    <div className="border rounded" style={{ background: '#fff', direction: 'ltr' }}>
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={200}
                        style={{ width: '100%', height: '150px', cursor: 'crosshair', touchAction: 'none' }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      />
                    </div>
                    <button type="button" className="btn btn-sm btn-outline-secondary mt-1" onClick={clearSignature}>
                      <i className="bi bi-arrow-counterclockwise me-1"></i>مسح التوقيع
                    </button>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span>جاري الحفظ...</> : <><i className="bi bi-pen me-1"></i>توقيع</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {viewContract && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-file-text me-2"></i>عقد {viewContract.customer_name || ''}</h5>
                <button type="button" className="btn-close" onClick={() => setViewContract(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <strong>العميل: </strong>{viewContract.customer_name || '-'}
                  <span className="mx-2">|</span>
                  <strong>القالب: </strong>{viewContract.template_name || '-'}
                  <span className="mx-2">|</span>
                  <strong>الحالة: </strong>
                  {viewContract.status === 'signed' ? <span className="badge bg-success">موقع</span> : <span className="badge bg-warning text-dark">مسودة</span>}
                </div>
                <div className="p-3 border rounded mb-3" style={{ whiteSpace: 'pre-wrap', background: '#f8f9fa', minHeight: '150px', fontSize: '0.9rem' }}>
                  {viewContract.content || viewContract.template_content || 'لا يوجد محتوى'}
                </div>
                {viewContract.signature_data && (
                  <div>
                    <label className="form-label">التوقيع:</label>
                    <div className="border rounded p-2" style={{ background: '#fff', maxWidth: '300px' }}>
                      <img src={viewContract.signature_data} alt="التوقيع" style={{ width: '100%' }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setViewContract(null)}>إغلاق</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
