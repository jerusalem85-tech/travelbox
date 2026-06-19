import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const CustomerTimeline = () => {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    api.get('/customers?limit=1000')
      .then(res => setCustomers(res.data.rows || res.data || []))
      .catch(() => Swal.fire('خطأ', 'فشل تحميل العملاء', 'error'));
  }, []);

  const fetchTimeline = useCallback(async () => {
    if (!customerId) { setActivities([]); return; }
    setLoading(true);
    try {
      const res = await api.get(`/customer-timeline/${customerId}`);
      const data = res.data.rows || res.data || [];
      const sorted = (Array.isArray(data) ? data : []).sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
      setActivities(sorted);
    } catch {
      Swal.fire('خطأ', 'فشل تحميل النشاطات', 'error');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

  const iconMap = {
    booking: 'bi-journal-text',
    payment: 'bi-cash',
    communication: 'bi-chat',
    document: 'bi-file',
    review: 'bi-star',
    follow_up: 'bi-bell',
  };

  const colorMap = {
    booking: 'primary',
    payment: 'success',
    communication: 'info',
    document: 'warning',
    review: 'text-secondary',
    follow_up: 'danger',
  };

  const labelMap = {
    booking: 'حجز',
    payment: 'دفعة',
    communication: 'اتصال',
    document: 'مستند',
    review: 'تقييم',
    follow_up: 'متابعة',
  };

  const summary = activities.reduce((acc, item) => {
    const t = item.type;
    if (t === 'booking') acc.bookings++;
    if (t === 'payment') acc.payments += Number(item.amount || 0);
    if (t === 'communication') acc.communications++;
    return acc;
  }, { bookings: 0, payments: 0, communications: 0 });

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0"><i className="bi bi-clock-history me-2"></i>سجل العميل</h4>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <label className="form-label">اختر العميل</label>
              <select className="form-select" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">-- اختر عميل --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name || c.full_name || c.customer_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {customerId && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card text-center border-primary">
                <div className="card-body">
                  <h5 className="text-primary mb-1">{summary.bookings}</h5>
                  <small className="text-muted">إجمالي الحجوزات</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center border-success">
                <div className="card-body">
                  <h5 className="text-success mb-1">{summary.payments.toLocaleString()}</h5>
                  <small className="text-muted">إجمالي المدفوعات</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center border-info">
                <div className="card-body">
                  <h5 className="text-info mb-1">{summary.communications}</h5>
                  <small className="text-muted">عدد الاتصالات</small>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">جاري التحميل...</span></div></div>
              ) : activities.length === 0 ? (
                <div className="text-center py-4 text-muted"><i className="bi bi-inbox fs-1 d-block mb-2"></i>لا توجد نشاطات</div>
              ) : (
                <div>
                  {activities.map((item, idx) => {
                    const type = item.type || 'booking';
                    const icon = iconMap[type] || 'bi-circle';
                    const color = colorMap[type] || 'secondary';
                    const label = labelMap[type] || type;
                    const dateStr = item.date || item.created_at;
                    return (
                      <div key={item.id || idx} className="d-flex align-items-start mb-3 pb-3 border-bottom" style={{ cursor: 'pointer' }} onClick={() => setSelectedItem(item)}>
                        <div className={`me-3 fs-4 text-${color}`}>
                          <i className={`bi ${icon}`}></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between">
                            <strong>{item.title || item.description || label}</strong>
                            <small className="text-muted">{dateStr ? new Date(dateStr).toLocaleString('ar-SA') : ''}</small>
                          </div>
                          <div className="text-muted small">{item.description || item.details || ''}</div>
                          <span className={`badge bg-${color === 'text-secondary' ? 'secondary' : color} bg-opacity-10 text-${color} mt-1`}>{label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {selectedItem && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">تفاصيل النشاط</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedItem(null)}></button>
              </div>
              <div className="modal-body">
                <table className="table table-bordered mb-0">
                  <tbody>
                    {Object.entries(selectedItem).filter(([k]) => !['id', 'customer_id'].includes(k)).map(([key, val]) => (
                      <tr key={key}>
                        <th className="text-muted" style={{ width: '40%' }}>{key}</th>
                        <td>{val instanceof Date ? val.toLocaleString('ar-SA') : String(val ?? '-')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedItem(null)}>إغلاق</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerTimeline;
