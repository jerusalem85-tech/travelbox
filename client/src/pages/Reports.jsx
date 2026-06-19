import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getYearOptions() {
  const y = new Date().getFullYear();
  return [y - 2, y - 1, y, y + 1];
}

export default function Reports() {
  const [view, setView] = useState('monthly');
  const [month, setMonth] = useState(getTodayStr());
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Number(year), i, 1);
    return { value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: monthNames[i] };
  });

  const load = useCallback(() => {
    setLoading(true);
    const params = view === 'monthly' ? { month } : { year };
    api.get('/reports', { params })
      .then(res => setData(res.data))
      .catch(() => {
        if (view === 'yearly') {
          api.post('/reports', { type: 'yearly', year: Number(year) })
            .then(res => setData(res.data))
            .catch(() => setData(null));
        } else {
          setData(null);
        }
      })
      .finally(() => setLoading(false));
  }, [view, month, year]);

  useEffect(() => { load(); }, [load]);

  const handlePrint = () => { window.print(); };

  const summary = data?.summary || {};
  const totalRevenue = summary.revenue || 0;
  const totalExpenses = summary.expenses || 0;
  const netProfit = summary.profit || 0;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 no-print">
        <h5 className="page-title mb-0">التقارير</h5>
        <button className="btn btn-outline-secondary" onClick={handlePrint}>
          <i className="bi bi-file-pdf me-1"></i> تصدير PDF
        </button>
      </div>

      <div className="card mb-4 no-print">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <div className="btn-group w-100" role="group">
                <button className={`btn ${view === 'monthly' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setView('monthly')}>
                  <i className="bi bi-calendar-month me-1"></i>شهري
                </button>
                <button className={`btn ${view === 'yearly' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setView('yearly')}>
                  <i className="bi bi-calendar-year me-1"></i>سنوي
                </button>
              </div>
            </div>
            {view === 'monthly' ? (
              <>
                <div className="col-md-3">
                  <label className="form-label">السنة</label>
                  <select className="form-select" value={year} onChange={e => { setYear(Number(e.target.value)); setMonth(`${e.target.value}-01`); }}>
                    {getYearOptions().map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">الشهر</label>
                  <select className="form-select" value={month} onChange={e => setMonth(e.target.value)}>
                    {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <div className="col-md-3">
                <label className="form-label">السنة</label>
                <select className="form-select" value={year} onChange={e => setYear(Number(e.target.value))}>
                  {getYearOptions().map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}
            <div className="col-md-3 d-flex gap-2">
              <button className="btn btn-primary flex-fill" onClick={load} disabled={loading}>
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

      {data && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="card stat-card bg-success bg-opacity-10">
                <div className="card-body">
                  <small className="text-secondary">إجمالي الإيرادات</small>
                  <h4 className="text-success mb-0">{totalRevenue.toLocaleString()}</h4>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card stat-card bg-danger bg-opacity-10">
                <div className="card-body">
                  <small className="text-secondary">إجمالي المصاريف</small>
                  <h4 className="text-danger mb-0">{totalExpenses.toLocaleString()}</h4>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card stat-card bg-primary bg-opacity-10">
                <div className="card-body">
                  <small className="text-secondary">صافي الربح</small>
                  <h4 className={`mb-0 ${netProfit >= 0 ? 'text-primary' : 'text-danger'}`}>{netProfit.toLocaleString()}</h4>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card stat-card bg-info bg-opacity-10">
                <div className="card-body">
                  <small className="text-secondary">هامش الربح</small>
                  <h4 className="text-info mb-0">{profitMargin}%</h4>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-lg-8">
              <div className="card">
                <div className="card-body">
                  <h6 className="card-title mb-3">
                    <i className={`bi ${view === 'monthly' ? 'bi-calendar-day' : 'bi-calendar-month'} me-2`}></i>
                    {view === 'monthly' ? 'تقارير يومية' : 'الملخص السنوي'}
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          {view === 'monthly' ? (
                            <><th>اليوم</th><th>الإيرادات</th><th>المصاريف</th><th>صافي الربح</th><th>عدد الحجوزات</th></>
                          ) : (
                            <><th>الشهر</th><th>الإيرادات</th><th>المصاريف</th><th>صافي الربح</th><th>عدد الحجوزات</th></>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {view === 'monthly' ? (
                          data.daily?.length > 0 ? data.daily.map((d, i) => (
                            <tr key={i}>
                              <td className="fw-semibold">{new Date(d.date || d.day).toLocaleDateString('ar-SA')}</td>
                              <td className="text-success">{d.revenue?.toLocaleString() || 0}</td>
                              <td className="text-danger">{d.expenses?.toLocaleString() || 0}</td>
                              <td className={(d.profit || 0) >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>{d.profit?.toLocaleString() || 0}</td>
                              <td><span className="badge bg-primary">{d.bookings || 0}</span></td>
                            </tr>
                          )) : (
                            <tr><td colSpan="5" className="text-center text-muted py-3">لا توجد بيانات يومية</td></tr>
                          )
                        ) : (
                          data.monthly?.length > 0 ? data.monthly.map((m, i) => (
                            <tr key={i}>
                              <td className="fw-semibold">{monthNames[new Date(m.month + '-01').getMonth()]} {m.month?.slice(0, 4)}</td>
                              <td className="text-success">{m.revenue?.toLocaleString() || 0}</td>
                              <td className="text-danger">{m.expenses?.toLocaleString() || 0}</td>
                              <td className={(m.profit || 0) >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>{m.profit?.toLocaleString() || 0}</td>
                              <td><span className="badge bg-primary">{m.bookings || 0}</span></td>
                            </tr>
                          )) : (
                            <tr><td colSpan="5" className="text-center text-muted py-3">لا توجد بيانات</td></tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="card-title mb-3"><i className="bi bi-people me-2"></i>أفضل العملاء</h6>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr><th>العميل</th><th>الحجوزات</th></tr>
                      </thead>
                      <tbody>
                        {data.topCustomers?.map((c, i) => (
                          <tr key={i}>
                            <td>{c.full_name || c.customer_name || 'مجهول'}</td>
                            <td><span className="badge bg-primary">{c.count}</span></td>
                          </tr>
                        ))}
                        {(!data.topCustomers || data.topCustomers.length === 0) && (
                          <tr><td colSpan="2" className="text-center text-muted py-3">لا توجد بيانات</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <h6 className="card-title mb-3"><i className="bi bi-geo-alt me-2"></i>أفضل الوجهات</h6>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr><th>الوجهة</th><th>عدد الحجوزات</th></tr>
                  </thead>
                  <tbody>
                    {data.topDestinations?.map((d, i) => (
                      <tr key={i}>
                        <td className="fw-semibold">{d.destination}</td>
                        <td><span className="badge bg-info">{d.count}</span></td>
                      </tr>
                    ))}
                    {(!data.topDestinations || data.topDestinations.length === 0) && (
                      <tr><td colSpan="2" className="text-center text-muted py-3">لا توجد بيانات</td></tr>
                    )}
                  </tbody>
                </table>
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
