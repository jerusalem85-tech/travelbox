import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    options.push({ value: val, label: `${monthNames[d.getMonth()]} ${d.getFullYear()}` });
  }
  return options;
}

function statusLabel(s) {
  const map = { confirmed: 'مؤكد', cancelled: 'ملغي', completed: 'منتهي', pending: 'معلق' };
  return map[s] || s;
}

function statusColor(s) {
  const map = { confirmed: 'success', cancelled: 'danger', completed: 'secondary', pending: 'warning' };
  return map[s] || 'secondary';
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [trashCount, setTrashCount] = useState(0);

  useEffect(() => {
    api.get('/trash/count').then(res => setTrashCount(res.data.count || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/stats').then(res => {
      setStats(res.data);
      const recent = res.data.recentBookings || [];
      const statusCounts = {};
      recent.forEach(b => {
        const s = b.status || 'pending';
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      if (Object.keys(statusCounts).length > 0) {
        setStatusBreakdown(Object.entries(statusCounts).map(([k, v]) => ({ status: k, count: v })));
      }
    });
  }, []);

  useEffect(() => {
    api.get('/reports', { params: { type: 'monthly', months: 6 } })
      .then(res => setMonthlyData(res.data.monthly || res.data.rows || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/stats/top-customers')
      .then(res => setTopCustomers(res.data.rows || res.data || []))
      .catch(() => {
        if (stats?.recentBookings) {
          const map = {};
          stats.recentBookings.forEach(b => {
            const name = b.customer_name || 'مجهول';
            map[name] = (map[name] || 0) + 1;
          });
          setTopCustomers(Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => ({ full_name: k, count: v })));
        }
      });
  }, [stats]);

  const maxRevenue = Math.max(...monthlyData.map(m => m.revenue || 0), 1);

  const selectedMonthData = monthlyData.find(m => m.month === selectedMonth);
  const selectedMonthLabel = getMonthOptions().find(o => o.value === selectedMonth)?.label || selectedMonth;

  if (!stats) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div>
      <h5 className="page-title mb-4">لوحة التحكم</h5>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card stat-card bg-primary bg-opacity-10">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2">
                <div className="icon bg-primary text-white"><i className="bi bi-journal"></i></div>
                <div>
                  <h5 className="mb-0">{stats.bookingsCount}</h5>
                  <small className="text-secondary">حجوزات</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card stat-card bg-success bg-opacity-10">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2">
                <div className="icon bg-success text-white"><i className="bi bi-people"></i></div>
                <div>
                  <h5 className="mb-0">{stats.customersCount}</h5>
                  <small className="text-secondary">عملاء</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card stat-card bg-info bg-opacity-10">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2">
                <div className="icon bg-info text-white"><i className="bi bi-cash-stack"></i></div>
                <div>
                  <h5 className="mb-0">{stats.monthPayments?.toLocaleString()}</h5>
                  <small className="text-secondary">المدفوعات</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card stat-card bg-warning bg-opacity-10">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2">
                <div className="icon bg-warning text-white"><i className="bi bi-graph-up-arrow"></i></div>
                <div>
                  <h5 className="mb-0">{stats.monthProfit?.toLocaleString()}</h5>
                  <small className="text-secondary">الأرباح</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card stat-card bg-secondary bg-opacity-10">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2">
                <div className="icon bg-secondary text-white"><i className="bi bi-calendar-check"></i></div>
                <div>
                  <h5 className="mb-0">{stats.todayBookings}</h5>
                  <small className="text-secondary">حجوزات اليوم</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card stat-card bg-danger bg-opacity-10">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2">
                <div className="icon bg-danger text-white"><i className="bi bi-hourglass-split"></i></div>
                <div>
                  <h5 className="mb-0">{stats.pendingBookings}</h5>
                  <small className="text-secondary">معلق</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <Link to="/trash" className="text-decoration-none">
            <div className="card stat-card bg-dark bg-opacity-10">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2">
                  <div className="icon bg-dark text-white"><i className="bi bi-trash"></i></div>
                  <div>
                    <h5 className="mb-0">{trashCount}</h5>
                    <small className="text-secondary">سلة المهملات</small>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title mb-3"><i className="bi bi-graph-up me-2"></i>الإيرادات الشهرية</h6>
              {monthlyData.length === 0 ? (
                <div className="text-center text-muted py-3">لا توجد بيانات</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {monthlyData.map((m, i) => {
                    const revPct = maxRevenue > 0 ? ((m.revenue || 0) / maxRevenue) * 100 : 0;
                    const expPct = maxRevenue > 0 ? ((m.expenses || 0) / maxRevenue) * 100 : 0;
                    const monthLabel = monthNames[new Date(m.month + '-01').getMonth()];
                    return (
                      <div key={i}>
                        <div className="d-flex justify-content-between small mb-1">
                          <span className="fw-semibold">{monthLabel}</span>
                          <span className="text-success fw-bold">{m.revenue?.toLocaleString()}</span>
                        </div>
                        <div className="progress mb-1" style={{ height: '12px', borderRadius: '6px' }}>
                          <div className="progress-bar bg-success" style={{ width: `${revPct}%` }} title={`إيرادات: ${m.revenue?.toLocaleString()}`}></div>
                          <div className="progress-bar bg-danger" style={{ width: `${Math.min(expPct, 100 - revPct)}%` }} title={`مصاريف: ${m.expenses?.toLocaleString() || 0}`}></div>
                        </div>
                        <div className="d-flex justify-content-between small text-muted">
                          <span>مصاريف: {m.expenses?.toLocaleString() || 0}</span>
                          <span className={m.profit >= 0 ? 'text-success' : 'text-danger'}>صافي: {m.profit?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body d-flex flex-column">
              <h6 className="card-title mb-3"><i className="bi bi-pie-chart me-2"></i>حالة الحجوزات</h6>
              {statusBreakdown.length === 0 ? (
                <div className="text-center text-muted py-3">لا توجد بيانات</div>
              ) : (
                <>
                  <div className="d-flex gap-1 mb-3" style={{ height: '24px' }}>
                    {statusBreakdown.map((s, i) => {
                      const total = statusBreakdown.reduce((a, b) => a + b.count, 0);
                      const pct = (s.count / total) * 100;
                      return <div key={i} className={`bg-${statusColor(s.status)}`} style={{ width: `${pct}%`, borderRadius: '4px' }} title={`${statusLabel(s.status)}: ${s.count}`}></div>;
                    })}
                  </div>
                  {statusBreakdown.map((s, i) => (
                    <div key={i} className="d-flex justify-content-between small mb-1">
                      <span><span className={`badge bg-${statusColor(s.status)} me-1`}>{statusLabel(s.status)}</span></span>
                      <span className="fw-bold">{s.count}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title mb-3"><i className="bi bi-trophy me-2"></i>أفضل العملاء</h6>
              {topCustomers.length === 0 ? (
                <div className="text-center text-muted py-3">لا توجد بيانات</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-borderless mb-0">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>العميل</th>
                        <th className="text-center">الحجوزات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCustomers.slice(0, 5).map((c, i) => (
                        <tr key={i}>
                          <td className="text-muted">{i + 1}</td>
                          <td className="fw-semibold">{c.full_name || c.customer_name || 'مجهول'}</td>
                          <td className="text-center"><span className="badge bg-primary rounded-pill">{c.count}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title mb-4">ملخص الشهر</h6>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span><i className="bi bi-arrow-up-circle text-success me-1"></i> المدفوعات</span>
                  <span className="text-success fw-bold">{stats.monthPayments?.toLocaleString()}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div className="progress-bar bg-success" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span><i className="bi bi-arrow-down-circle text-danger me-1"></i> المصاريف</span>
                  <span className="text-danger fw-bold">{stats.monthExpenses?.toLocaleString()}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div className="progress-bar bg-danger" style={{ width: stats.monthPayments ? `${Math.min((stats.monthExpenses / stats.monthPayments) * 100, 100)}%` : '0%' }}></div>
                </div>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <strong><i className="bi bi-cash me-1"></i> صافي الأرباح</strong>
                <strong className={stats.monthProfit >= 0 ? 'text-success' : 'text-danger'}>{stats.monthProfit?.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0"><i className="bi bi-calendar me-2"></i>الشهر الحالي</h6>
                <select className="form-select form-select-sm w-auto" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                  {getMonthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {selectedMonthData ? (
                <div className="text-center">
                  <div className="display-6 fw-bold text-primary mb-1">{selectedMonthData.bookings || 0}</div>
                  <small className="text-muted d-block mb-3">حجوزات في {selectedMonthLabel}</small>
                  <div className="d-flex justify-content-between small px-3">
                    <div><span className="text-success fw-bold">{selectedMonthData.revenue?.toLocaleString()}</span><br /><small>إيرادات</small></div>
                    <div><span className="text-danger fw-bold">{selectedMonthData.expenses?.toLocaleString()}</span><br /><small>مصاريف</small></div>
                    <div><span className={`fw-bold ${(selectedMonthData.profit || 0) >= 0 ? 'text-success' : 'text-danger'}`}>{selectedMonthData.profit?.toLocaleString()}</span><br /><small>صافي</small></div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted py-3">لا توجد بيانات لهذا الشهر</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0"><i className="bi bi-journal-text me-2"></i>آخر الحجوزات</h6>
            <Link to="/bookings" className="btn btn-sm btn-outline-primary">عرض الكل</Link>
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>رقم الحجز</th>
                  <th>العميل</th>
                  <th>التاريخ</th>
                  <th>الوجهة</th>
                  <th>الحالة</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings?.map(b => (
                  <tr key={b.id}>
                    <td><Link to={`/bookings/${b.id}`} className="text-decoration-none fw-semibold">{b.booking_number}</Link></td>
                    <td>{b.customer_name}</td>
                    <td>{b.travel_date}</td>
                    <td>{b.from_destination} → {b.to_destination}</td>
                    <td>
                      <span className={`badge bg-${statusColor(b.status)}`}>
                        {statusLabel(b.status)}
                      </span>
                    </td>
                    <td>{b.total_amount?.toLocaleString()}</td>
                  </tr>
                ))}
                {(!stats.recentBookings || stats.recentBookings.length === 0) && (
                  <tr><td colSpan="6" className="text-center text-muted py-3">لا توجد حجوزات حديثة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
