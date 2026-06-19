import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function LoginLog() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('');
  const limit = 10;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (userId) params.append('user_id', userId);
      if (action) params.append('action', action);
      const res = await api.get(`/login-log?${params.toString()}`);
      setLogs(res.data.rows || res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, userId, action]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    api.get('/login-log/users').then(res => {
      setUsers(res.data.rows || res.data.data || res.data || []);
    }).catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / limit);

  const getActionBadge = (act) => {
    if (act === 'login') return <span className="badge bg-success">دخول</span>;
    if (act === 'logout') return <span className="badge bg-secondary">خروج</span>;
    return <span className="badge bg-light text-dark">{act}</span>;
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-door-open me-2"></i>
          سجل الدخول
        </h4>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">المستخدم</label>
              <select className="form-select" value={userId} onChange={(e) => { setUserId(e.target.value); setPage(1); }}>
                <option value="">الكل</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name || u.name || u.username}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">الإجراء</label>
              <select className="form-select" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
                <option value="">الكل</option>
                <option value="login">دخول</option>
                <option value="logout">خروج</option>
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setUserId(''); setAction(''); setPage(1); }}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>
                إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-journal-text fs-1 d-block mb-2"></i>
              لا توجد سجلات
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>المستخدم</th>
                      <th>الإجراء</th>
                      <th>عنوان IP</th>
                      <th>المتصفح</th>
                      <th>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td>{log.id}</td>
                        <td className="fw-semibold">{log.full_name || log.user_name || '-'}</td>
                        <td>{getActionBadge(log.action)}</td>
                        <td><code>{log.ip_address || '-'}</code></td>
                        <td className="small text-muted" style={{ maxWidth: 200 }}>
                          <div className="text-truncate" title={log.user_agent}>{log.user_agent || '-'}</div>
                        </td>
                        <td>{log.created_at ? new Date(log.created_at).toLocaleString('ar-SA') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <nav>
                  <ul className="pagination justify-content-center mb-0">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(page - 1)}>
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                      .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <li className="page-item disabled"><span className="page-link">...</span></li>
                          )}
                          <li className={`page-item ${page === p ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                          </li>
                        </React.Fragment>
                      ))}
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(page + 1)}>
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
