import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function Checklist() {
  const [steps, setSteps] = useState([]);
  const [bookingId, setBookingId] = useState('');
  const [stepName, setStepName] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSteps = async () => {
    if (!bookingId.trim()) { setSteps([]); return; }
    setLoading(true);
    try {
      const res = await api.get(`/checklist?booking_id=${bookingId}`);
      setSteps(res.data.rows || res.data || []);
    } catch (err) {
      Swal.fire('خطأ', 'فشل تحميل قائمة المهام', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSteps(); }, [bookingId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!stepName.trim()) { Swal.fire('تنبيه', 'أدخل اسم الخطوة', 'warning'); return; }
    if (!bookingId.trim()) { Swal.fire('تنبيه', 'أدخل رقم الحجز أولاً', 'warning'); return; }
    try {
      await api.post('/checklist', { booking_id: Number(bookingId), step_name: stepName.trim() });
      setStepName('');
      fetchSteps();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل إضافة الخطوة', 'error');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.put(`/checklist/${id}/toggle`);
      fetchSteps();
    } catch (err) {
      Swal.fire('خطأ', 'فشل تحديث الخطوة', 'error');
    }
  };

  const handleDelete = (id, stepName) => {
    Swal.fire({
      title: 'هل أنت متأكد؟', text: `سيتم حذف الخطوة: ${stepName}`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/checklist/${id}`);
          Swal.fire('تم الحذف', 'تم حذف الخطوة بنجاح', 'success');
          fetchSteps();
        } catch (err) { Swal.fire('خطأ', 'فشل حذف الخطوة', 'error'); }
      }
    });
  };

  const completedCount = steps.filter((s) => s.is_completed).length;

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0"><i className="bi bi-check2-square me-2"></i>قائمة مهام الحجز</h4>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">رقم الحجز</label>
              <input
                type="number"
                className="form-control"
                placeholder="أدخل رقم الحجز..."
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
              />
            </div>
            {steps.length > 0 && (
              <div className="col-md-6 d-flex align-items-end">
                <div className="w-100">
                  <div className="progress" style={{ height: '8px' }}>
                    <div
                      className="progress-bar bg-success"
                      style={{ width: `${steps.length > 0 ? (completedCount / steps.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="small text-muted mt-1">{completedCount} من {steps.length} مكتملة</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {!bookingId.trim() ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              أدخل رقم الحجز لعرض المهام
            </div>
          ) : loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">جاري التحميل...</span>
              </div>
            </div>
          ) : steps.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-list-task fs-1 d-block mb-2"></i>
              لا توجد مهام لهذا الحجز - أضف المهام أدناه
            </div>
          ) : (
            <div className="list-group mb-3">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`list-group-item list-group-item-action d-flex align-items-center ${step.is_completed ? 'bg-light' : ''}`}
                >
                  <div className="form-check me-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={!!step.is_completed}
                      onChange={() => handleToggle(step.id)}
                      id={`step-${step.id}`}
                    />
                  </div>
                  <div className="flex-grow-1">
                    <label
                      htmlFor={`step-${step.id}`}
                      className={`mb-0 cursor-pointer ${step.is_completed ? 'text-decoration-line-through text-muted' : 'fw-bold'}`}
                      style={{ cursor: 'pointer' }}
                    >
                      {step.step_name}
                    </label>
                    {step.is_completed && (
                      <div className="small text-muted mt-1">
                        <i className="bi bi-person-check me-1"></i>
                        {step.completed_by || 'غير معروف'} • {step.completed_at ? new Date(step.completed_at).toLocaleString('ar-SA') : ''}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-sm btn-outline-danger ms-2"
                    onClick={() => handleDelete(step.id, step.step_name)}
                    title="حذف"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAdd}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="أضف خطوة جديدة..."
                value={stepName}
                onChange={(e) => setStepName(e.target.value)}
              />
              <button className="btn btn-primary" type="submit">
                <i className="bi bi-plus-lg me-1"></i>
                إضافة
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
