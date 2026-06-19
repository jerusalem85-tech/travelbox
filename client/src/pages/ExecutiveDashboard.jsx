import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ExecutiveDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/exec-dashboard/summary').then(res => {
      setData(res.data.rows || res.data || {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
      </div>
    );
  }

  const metrics = [
    { key: 'revenue', label: 'الإيرادات', icon: 'bi-cash-stack', color: 'success', prefix: '' },
    { key: 'expenses', label: 'المصاريف', icon: 'bi-wallet2', color: 'danger', prefix: '' },
    { key: 'net_profit', label: 'صافي الربح', icon: 'bi-graph-up-arrow', color: 'primary', prefix: '' },
    { key: 'total_customers', label: 'إجمالي العملاء', icon: 'bi-people', color: 'info', prefix: '' },
    { key: 'total_bookings', label: 'إجمالي الحجوزات', icon: 'bi-journal-text', color: 'purple', prefix: '' },
  ];

  const quickMetrics = [
    { key: 'avg_booking_value', label: 'متوسط قيمة الحجز', icon: 'bi-calculator' },
    { key: 'converted_leads', label: 'العملاء المحولون', icon: 'bi-funnel' },
    { key: 'new_customers_30d', label: 'عملاء جدد (30 يوم)', icon: 'bi-person-plus' },
  ];

  const topServices = data?.top_services || [];

  const formatCurrency = (val) => {
    if (val == null) return '-';
    return Number(val).toLocaleString('ar-SA') + ' ر.س';
  };

  const formatNumber = (val) => {
    if (val == null) return '-';
    return Number(val).toLocaleString('ar-SA');
  };

  return (
    <div>
      <h5 className="page-title mb-3"><i className="bi bi-speedometer2 me-2"></i>لوحة التنفيذية</h5>

      <div className="row g-3 mb-3">
        {metrics.map(m => {
          const val = data?.[m.key];
          const growth = data?.[`${m.key}_growth`];
          const isPositive = growth > 0;
          return (
            <div className="col-md-4 col-lg" key={m.key}>
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <small className="text-muted">{m.label}</small>
                      <h4 className={`mt-1 mb-0 text-${m.color}`}>
                        {m.key.includes('revenue') || m.key.includes('expenses') || m.key.includes('profit')
                          ? formatCurrency(val) : formatNumber(val)}
                      </h4>
                    </div>
                    <div className={`bg-${m.color} bg-opacity-10 p-2 rounded`}>
                      <i className={`bi ${m.icon} fs-4 text-${m.color}`}></i>
                    </div>
                  </div>
                  {growth != null && (
                    <div className={`mt-2 small d-flex align-items-center gap-1 ${isPositive ? 'text-success' : 'text-danger'}`}>
                      <i className={`bi bi-arrow-${isPositive ? 'up' : 'down'}`}></i>
                      <span>{Math.abs(growth).toFixed(1)}% عن الشهر الماضي</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-7">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-transparent">
              <h6 className="mb-0"><i className="bi bi-star me-1"></i>أفضل الخدمات</h6>
            </div>
            <div className="card-body">
              {topServices.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-borderless mb-0">
                    <thead>
                      <tr>
                        <th>الخدمة</th>
                        <th>عدد الحجوزات</th>
                        <th>النسبة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topServices.map((s, i) => {
                        const total = topServices.reduce((a, b) => a + (b.count || 0), 0);
                        const pct = total > 0 ? ((s.count / total) * 100).toFixed(1) : 0;
                        return (
                          <tr key={i}>
                            <td><span className="fw-semibold">{s.name || s.service || '-'}</span></td>
                            <td>{s.count || 0}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="progress flex-grow-1" style={{ height: '6px' }}>
                                  <div className="progress-bar" style={{ width: `${pct}%` }}></div>
                                </div>
                                <small className="text-muted">{pct}%</small>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted text-center mb-0">لا توجد بيانات</p>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-5">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-transparent">
              <h6 className="mb-0"><i className="bi bi-speedometer me-1"></i>مؤشرات سريعة</h6>
            </div>
            <div className="card-body d-flex flex-column gap-3">
              {quickMetrics.map(m => (
                <div key={m.key} className="d-flex justify-content-between align-items-center p-3 rounded" style={{ background: 'var(--bg-card-secondary, #f8f9fa)' }}>
                  <div>
                    <small className="text-muted d-block">{m.label}</small>
                    <strong className="fs-5">{formatCurrency(data?.[m.key]) || formatNumber(data?.[m.key])}</strong>
                  </div>
                  <i className={`bi ${m.icon} fs-3 text-muted opacity-50`}></i>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
