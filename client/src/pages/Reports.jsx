import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { exportToCSV } from '../utils/csvExport';

const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function Reports() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/reports/advanced', { params: { year } })
      .then(res => setData(res.data))
      .catch(err => {
        setError(err.response?.data?.message || 'فشل تحميل التقرير');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const summary = data?.summary || {};
  const monthlyData = data?.monthly || [];
  const expenseCategories = data?.expenseCategories || [];
  const topCustomers = data?.topCustomers || [];
  const topSuppliers = data?.topSuppliers || [];
  const bookingStatus = data?.bookingStatus || [];

  const totalExpenses = expenseCategories.reduce((sum, c) => sum + Number(c.total || 0), 0);
  const totalRevenue = summary.revenue || 0;
  const totalExpense = summary.expenses || 0;
  const netProfit = summary.profit || 0;
  const totalBookings = summary.bookings || 0;

  const maxMonthlyVal = Math.max(...monthlyData.map(m => Math.max(Number(m.revenue || 0), Number(m.expenses || 0))), 1);

  const handleExport = () => {
    const csvData = monthlyData.map((m, i) => ({
      الشهر: monthNames[i],
      الإيرادات: m.revenue || 0,
      المصاريف: m.expenses || 0,
      'صافي الربح': (m.revenue || 0) - (m.expenses || 0),
    }));
    exportToCSV(csvData, `report-${year}.csv`);
  };

  const handlePrint = () => { window.print(); };

  const getRankBadge = (idx) => {
    if (idx === 0) return <span className="badge bg-warning text-dark me-1"><i className="bi bi-trophy-fill"></i></span>;
    if (idx === 1) return <span className="badge bg-secondary text-light me-1"><i className="bi bi-trophy-fill"></i></span>;
    if (idx === 2) return <span className="badge bg-danger-subtle text-danger me-1"><i className="bi bi-trophy-fill"></i></span>;
    return null;
  };

  const bookingTotal = bookingStatus.reduce((s, b) => s + Number(b.count || 0), 0);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 no-print">
        <h5 className="page-title mb-0">التقارير المتقدمة</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-success" onClick={handleExport}>
            <i className="bi bi-download me-1"></i> تصدير التقرير
          </button>
          <button className="btn btn-outline-secondary" onClick={handlePrint}>
            <i className="bi bi-printer me-1"></i> طباعة
          </button>
        </div>
      </div>

      <div className="card mb-4 no-print">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">السنة</label>
              <select className="form-select" value={year} onChange={e => setYear(Number(e.target.value))}>
                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button className="btn btn-primary" onClick={load} disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-funnel me-1"></i>}
                عرض
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && !data && (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      )}

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {!loading && !data && !error && (
        <div className="text-center text-muted py-5">اختر السنة واضغط عرض</div>
      )}

      {data && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="card stat-card border-0" style={{ background: 'linear-gradient(135deg, #28a745, #20c997)' }}>
                <div className="card-body text-white">
                  <small><i className="bi bi-arrow-up-circle me-1"></i>إجمالي الإيرادات</small>
                  <h4 className="mb-0">{totalRevenue.toLocaleString()} <small>ريال</small></h4>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card stat-card border-0" style={{ background: 'linear-gradient(135deg, #dc3545, #e74c3c)' }}>
                <div className="card-body text-white">
                  <small><i className="bi bi-arrow-down-circle me-1"></i>إجمالي المصاريف</small>
                  <h4 className="mb-0">{totalExpense.toLocaleString()} <small>ريال</small></h4>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card stat-card border-0" style={{ background: 'linear-gradient(135deg, #0d6efd, #6610f2)' }}>
                <div className="card-body text-white">
                  <small><i className="bi bi-pie-chart me-1"></i>صافي الربح</small>
                  <h4 className={`mb-0 ${netProfit < 0 ? '' : ''}`}>{netProfit.toLocaleString()} <small>ريال</small></h4>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card stat-card border-0" style={{ background: 'linear-gradient(135deg, #17a2b8, #0dcaf0)' }}>
                <div className="card-body text-white">
                  <small><i className="bi bi-bookmark-check me-1"></i>عدد الحجوزات</small>
                  <h4 className="mb-0">{totalBookings.toLocaleString()}</h4>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <h6 className="card-title mb-3"><i className="bi bi-bar-chart-fill me-2"></i>الإيرادات والمصاريف الشهرية</h6>
              <div className="d-flex align-items-end justify-content-between gap-1" style={{ minHeight: 250, paddingTop: 20 }}>
                {monthNames.map((name, i) => {
                  const m = monthlyData[i] || {};
                  const rev = Number(m.revenue || 0);
                  const exp = Number(m.expenses || 0);
                  const revH = maxMonthlyVal > 0 ? (rev / maxMonthlyVal) * 200 : 0;
                  const expH = maxMonthlyVal > 0 ? (exp / maxMonthlyVal) * 200 : 0;
                  return (
                    <div key={i} className="d-flex flex-column align-items-center flex-fill" style={{ position: 'relative' }}>
                      <div className="d-flex gap-1 align-items-end" style={{ height: 200 }}>
                        <div style={{ width: 16, height: Math.max(revH, 2), background: '#28a745', borderRadius: '3px 3px 0 0', transition: 'height 0.3s', cursor: 'pointer' }}
                          title={`الإيرادات: ${rev.toLocaleString()}`}>
                        </div>
                        <div style={{ width: 16, height: Math.max(expH, 2), background: '#dc3545', borderRadius: '3px 3px 0 0', transition: 'height 0.3s', cursor: 'pointer' }}
                          title={`المصاريف: ${exp.toLocaleString()}`}>
                        </div>
                      </div>
                      <small className="text-muted mt-1" style={{ fontSize: '0.65rem', writingMode: 'horizontal-tb' }}>{name}</small>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="card-title mb-3"><i className="bi bi-tags me-2"></i>تفصيل المصاريف حسب الفئة</h6>
                  <div className="table-responsive">
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr><th>الفئة</th><th>الإجمالي</th><th>النسبة</th></tr>
                      </thead>
                      <tbody>
                        {expenseCategories.length === 0 ? (
                          <tr><td colSpan="3" className="text-center text-muted py-3">لا توجد بيانات</td></tr>
                        ) : expenseCategories.map((c, i) => {
                          const pct = totalExpenses > 0 ? ((Number(c.total) / totalExpenses) * 100).toFixed(1) : 0;
                          return (
                            <tr key={i}>
                              <td className="fw-semibold">{c.name || c.category || 'أخرى'}</td>
                              <td>{Number(c.total).toLocaleString()}</td>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <div className="progress flex-grow-1" style={{ height: 8 }}>
                                    <div className="progress-bar bg-danger" style={{ width: `${pct}%` }}></div>
                                  </div>
                                  <small className="text-muted" style={{ minWidth: 40 }}>{pct}%</small>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="card-title mb-3"><i className="bi bi-people me-2"></i>أفضل العملاء</h6>
                  <div className="table-responsive">
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr><th>العميل</th><th>الهاتف</th><th>عدد الحجوزات</th><th>المدفوعات</th></tr>
                      </thead>
                      <tbody>
                        {topCustomers.length === 0 ? (
                          <tr><td colSpan="4" className="text-center text-muted py-3">لا توجد بيانات</td></tr>
                        ) : topCustomers.map((c, i) => (
                          <tr key={i}>
                            <td>{getRankBadge(i)}{c.full_name || c.customer_name || 'مجهول'}</td>
                            <td>{c.phone || '-'}</td>
                            <td><span className="badge bg-primary">{c.booking_count || c.count || 0}</span></td>
                            <td className="fw-bold">{Number(c.total_paid || c.total || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="card-title mb-3"><i className="bi bi-truck me-2"></i>أفضل الموردين</h6>
                  <div className="table-responsive">
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr><th>المورد</th><th>الشركة</th><th>عدد الحجوزات</th></tr>
                      </thead>
                      <tbody>
                        {topSuppliers.length === 0 ? (
                          <tr><td colSpan="3" className="text-center text-muted py-3">لا توجد بيانات</td></tr>
                        ) : topSuppliers.map((s, i) => (
                          <tr key={i}>
                            <td className="fw-semibold">{s.name || s.supplier_name || 'مجهول'}</td>
                            <td>{s.company || '-'}</td>
                            <td><span className="badge bg-info">{s.booking_count || s.count || 0}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="card-title mb-3"><i className="bi bi-pie-chart me-2"></i>حالة الحجوزات</h6>
                  {bookingStatus.length === 0 ? (
                    <p className="text-muted text-center py-3 mb-0">لا توجد بيانات</p>
                  ) : (
                    <>
                      <div className="d-flex mb-3" style={{ height: 30, borderRadius: 6, overflow: 'hidden' }}>
                        {bookingStatus.map((b, i) => {
                          const pct = bookingTotal > 0 ? (Number(b.count) / bookingTotal) * 100 : 0;
                          const colors = ['#0d6efd', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997'];
                          return (
                            <div key={i} style={{ width: `${pct}%`, background: colors[i % colors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold' }}
                              title={`${b.status || b.name}: ${b.count} (${pct.toFixed(1)}%)`}>
                              {pct > 8 ? `${b.count}` : ''}
                            </div>
                          );
                        })}
                      </div>
                      <div className="d-flex flex-wrap gap-3">
                        {bookingStatus.map((b, i) => {
                          const pct = bookingTotal > 0 ? (Number(b.count) / bookingTotal) * 100 : 0;
                          const colors = ['#0d6efd', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997'];
                          return (
                            <div key={i} className="d-flex align-items-center gap-1">
                              <span style={{ width: 12, height: 12, borderRadius: 3, background: colors[i % colors.length], display: 'inline-block' }}></span>
                              <small>{b.status || b.name}: {b.count} ({pct.toFixed(1)}%)</small>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .card { border: 1px solid #ddd !important; break-inside: avoid; }
          .stat-card { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
