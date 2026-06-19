import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function Employees() {
  const [activeTab, setActiveTab] = useState('employees');

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="page-title mb-0">إدارة الموظفين</h5>
      </div>
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>
            <i className="bi bi-people me-1"></i>الموظفين
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
            <i className="bi bi-calendar-check me-1"></i>الحضور
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'salaries' ? 'active' : ''}`} onClick={() => setActiveTab('salaries')}>
            <i className="bi bi-cash-stack me-1"></i>الرواتب
          </button>
        </li>
      </ul>
      {activeTab === 'employees' && <EmployeesTab />}
      {activeTab === 'attendance' && <AttendanceTab />}
      {activeTab === 'salaries' && <SalariesTab />}
    </div>
  );
}

function EmployeesTab() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', phone: '', email: '', position: '', department: '', status: 'active', hire_date: ''
  });

  const load = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/employees', { params });
      setRows(res.data.rows || res.data || []);
    } catch { Swal.fire('خطأ', 'فشل تحميل الموظفين', 'error'); }
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const resetForm = () => {
    setFormData({ full_name: '', phone: '', email: '', position: '', department: '', status: 'active', hire_date: '' });
    setEditingId(null);
  };

  const openEdit = (item) => {
    setFormData({
      full_name: item.full_name, phone: item.phone || '', email: item.email || '',
      position: item.position || '', department: item.department || '',
      status: item.status || 'active', hire_date: item.hire_date?.split('T')[0] || ''
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) { Swal.fire('تنبيه', 'أدخل اسم الموظف', 'warning'); return; }
    setSubmitting(true);
    try {
      const payload = { ...formData, hire_date: formData.hire_date || null };
      if (editingId) {
        await api.put(`/employees/${editingId}`, payload);
        Swal.fire('تم التحديث', 'تم تحديث بيانات الموظف', 'success');
      } else {
        await api.post('/employees', payload);
        Swal.fire('تم الإضافة', 'تم إضافة الموظف', 'success');
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = (id, name) => {
    Swal.fire({
      title: 'تأكيد الحذف', text: `سيتم حذف الموظف: ${name}`, icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/employees/${id}`).then(() => load());
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div></div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-plus-lg"></i> موظف جديد
        </button>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-6">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input className="form-control" placeholder="بحث بالاسم أو الهاتف أو البريد..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">كل الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr><th>الاسم</th><th>الهاتف</th><th>البريد</th><th>الوظيفة</th><th>القسم</th><th>الحالة</th><th>تاريخ التعيين</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="fw-semibold">{r.full_name}</td>
                  <td dir="ltr">{r.phone || '-'}</td>
                  <td className="small">{r.email || '-'}</td>
                  <td>{r.position || '-'}</td>
                  <td>{r.department || '-'}</td>
                  <td><span className={`badge bg-${r.status === 'active' ? 'success' : 'secondary'}`}>{r.status === 'active' ? 'نشط' : 'غير نشط'}</span></td>
                  <td className="small">{r.hire_date ? new Date(r.hire_date).toLocaleDateString('ar-SA') : '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openEdit(r)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id, r.full_name)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="8" className="text-center text-muted py-4">لا يوجد موظفون</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-person me-2"></i>{editingId ? 'تعديل موظف' : 'إضافة موظف جديد'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">الاسم <span className="text-danger">*</span></label>
                    <input className="form-control" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الهاتف</label>
                      <input className="form-control" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">البريد</label>
                      <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الوظيفة</label>
                      <input className="form-control" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">القسم</label>
                      <input className="form-control" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الحالة</label>
                      <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <option value="active">نشط</option>
                        <option value="inactive">غير نشط</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">تاريخ التعيين</label>
                      <input type="date" className="form-control" value={formData.hire_date} onChange={e => setFormData({ ...formData, hire_date: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span> جاري الحفظ...</> : <><i className="bi bi-check-lg me-1"></i> حفظ</>}
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

function AttendanceTab() {
  const today = new Date().toISOString().split('T')[0];
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dateFilter, setDateFilter] = useState(today);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '', date: today, clock_in: '', clock_out: '', status: 'present', notes: ''
  });

  const load = async () => {
    try {
      const params = {};
      if (dateFilter) params.date = dateFilter;
      if (employeeFilter) params.employee_id = employeeFilter;
      const res = await api.get('/attendance', { params });
      setRows(res.data.rows || res.data || []);
    } catch { Swal.fire('خطأ', 'فشل تحميل الحضور', 'error'); }
  };

  const loadEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data.rows || res.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); }, [dateFilter, employeeFilter]);
  useEffect(() => { loadEmployees(); }, []);

  const resetForm = () => {
    setFormData({ employee_id: '', date: today, clock_in: '', clock_out: '', status: 'present', notes: '' });
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (item) => {
    setFormData({
      employee_id: item.employee_id, date: item.date?.split('T')[0] || today,
      clock_in: item.clock_in || '', clock_out: item.clock_out || '',
      status: item.status || 'present', notes: item.notes || ''
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employee_id) { Swal.fire('تنبيه', 'اختر الموظف', 'warning'); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        employee_id: Number(formData.employee_id)
      };
      if (editingId) {
        await api.put(`/attendance/${editingId}`, payload);
        Swal.fire('تم التحديث', 'تم تحديث الحضور', 'success');
      } else {
        await api.post('/attendance', payload);
        Swal.fire('تم التسجيل', 'تم تسجيل الحضور', 'success');
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally { setSubmitting(false); }
  };

  const handleClockOut = (id) => {
    Swal.fire({
      title: 'تسجيل خروج', text: 'سيتم تسجيل وقت الخروج الآن', icon: 'question',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.put(`/attendance/${id}/clock-out`).then(() => load());
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'تأكيد الحذف', text: 'سيتم حذف سجل الحضور', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/attendance/${id}`).then(() => load());
    });
  };

  const statusBadge = (s) => {
    const colors = { present: 'success', absent: 'danger', late: 'warning', vacation: 'info', sick: 'secondary' };
    const labels = { present: 'حاضر', absent: 'غائب', late: 'متأخر', vacation: 'إجازة', sick: 'مرضي' };
    return <span className={`badge bg-${colors[s] || 'secondary'}`}>{labels[s] || s}</span>;
  };

  const formatTime = (t) => t ? t.slice(0, 5) : '-';

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div></div>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg"></i> تسجيل حضور</button>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <label className="form-label">التاريخ</label>
              <input type="date" className="form-control" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">الموظف</label>
              <select className="form-select" value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}>
                <option value="">كل الموظفين</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setDateFilter(today); setEmployeeFilter(''); }}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr><th>الموظف</th><th>التاريخ</th><th>وقت الحضور</th><th>وقت الانصراف</th><th>الحالة</th><th>ملاحظات</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="fw-semibold">{r.employee_name || '-'}</td>
                  <td className="small">{r.date ? new Date(r.date).toLocaleDateString('ar-SA') : '-'}</td>
                  <td dir="ltr">{formatTime(r.clock_in)}</td>
                  <td dir="ltr">{formatTime(r.clock_out)}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td className="small">{r.notes || '-'}</td>
                  <td>
                    {!r.clock_out && r.status === 'present' && (
                      <button className="btn btn-sm btn-outline-success me-1" onClick={() => handleClockOut(r.id)} title="تسجيل خروج">
                        <i className="bi bi-box-arrow-right"></i>
                      </button>
                    )}
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openEdit(r)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-4">لا توجد سجلات حضور</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-calendar-check me-2"></i>{editingId ? 'تعديل الحضور' : 'تسجيل حضور'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">الموظف <span className="text-danger">*</span></label>
                    <select className="form-select" value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })} required>
                      <option value="">اختر الموظف</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                    </select>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">التاريخ</label>
                      <input type="date" className="form-control" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">وقت الحضور</label>
                      <input type="time" className="form-control" value={formData.clock_in} onChange={e => setFormData({ ...formData, clock_in: e.target.value })} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الحالة</label>
                      <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <option value="present">حاضر</option>
                        <option value="absent">غائب</option>
                        <option value="late">متأخر</option>
                        <option value="vacation">إجازة</option>
                        <option value="sick">مرضي</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">ملاحظات</label>
                    <textarea className="form-control" rows="2" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span> جاري الحفظ...</> : <><i className="bi bi-check-lg me-1"></i> حفظ</>}
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

function SalariesTab() {
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [monthFilter, setMonthFilter] = useState(defaultMonth);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [paidFilter, setPaidFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '', month: defaultMonth, amount: '', bonuses: '0', deductions: '0'
  });

  const load = async () => {
    try {
      const params = {};
      if (monthFilter) params.month = monthFilter;
      if (employeeFilter) params.employee_id = employeeFilter;
      if (paidFilter) params.paid = paidFilter;
      const res = await api.get('/salaries', { params });
      setRows(res.data.rows || res.data || []);
    } catch { Swal.fire('خطأ', 'فشل تحميل الرواتب', 'error'); }
  };

  const loadEmployees = async () => {
    try {
      const res = await api.get('/salaries/employees');
      setEmployees(res.data.rows || res.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); }, [monthFilter, employeeFilter, paidFilter]);
  useEffect(() => { loadEmployees(); }, []);

  const netAmount = () => {
    const a = Number(formData.amount) || 0;
    const b = Number(formData.bonuses) || 0;
    const d = Number(formData.deductions) || 0;
    return a + b - d;
  };

  const resetForm = () => {
    setFormData({ employee_id: '', month: defaultMonth, amount: '', bonuses: '0', deductions: '0' });
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (item) => {
    setFormData({
      employee_id: item.employee_id, month: item.month || defaultMonth,
      amount: item.amount || '', bonuses: item.bonuses || '0', deductions: item.deductions || '0'
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employee_id) { Swal.fire('تنبيه', 'اختر الموظف', 'warning'); return; }
    if (!formData.amount || Number(formData.amount) <= 0) { Swal.fire('تنبيه', 'أدخل المبلغ', 'warning'); return; }
    setSubmitting(true);
    try {
      const payload = {
        employee_id: Number(formData.employee_id),
        month: formData.month,
        amount: Number(formData.amount),
        bonuses: Number(formData.bonuses) || 0,
        deductions: Number(formData.deductions) || 0
      };
      if (editingId) {
        await api.put(`/salaries/${editingId}`, payload);
        Swal.fire('تم التحديث', 'تم تحديث الراتب', 'success');
      } else {
        await api.post('/salaries', payload);
        Swal.fire('تم الإضافة', 'تم إضافة الراتب', 'success');
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally { setSubmitting(false); }
  };

  const handlePay = (id) => {
    Swal.fire({
      title: 'تأكيد الدفع', text: 'سيتم تسجيل الراتب كمدفوع', icon: 'question',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.put(`/salaries/${id}/pay`).then(() => load());
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'تأكيد الحذف', text: 'سيتم حذف سجل الراتب', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) api.delete(`/salaries/${id}`).then(() => load());
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div></div>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg"></i> راتب جديد</button>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label">الشهر</label>
              <input type="month" className="form-control" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">الموظف</label>
              <select className="form-select" value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}>
                <option value="">كل الموظفين</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">حالة الدفع</label>
              <select className="form-select" value={paidFilter} onChange={e => setPaidFilter(e.target.value)}>
                <option value="">الكل</option>
                <option value="paid">مدفوع</option>
                <option value="unpaid">غير مدفوع</option>
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setMonthFilter(defaultMonth); setEmployeeFilter(''); setPaidFilter(''); }}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr><th>الموظف</th><th>الشهر</th><th>المبلغ</th><th>المكافآت</th><th>الخصومات</th><th>الصافي</th><th>الحالة</th><th>تاريخ الدفع</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="fw-semibold">{r.employee_name || '-'}</td>
                  <td>{r.month || '-'}</td>
                  <td>{Number(r.amount).toLocaleString()}</td>
                  <td className="text-success">{Number(r.bonuses || 0).toLocaleString()}</td>
                  <td className="text-danger">{Number(r.deductions || 0).toLocaleString()}</td>
                  <td className="fw-bold">{Number(r.net_amount || r.amount).toLocaleString()}</td>
                  <td>{r.paid ? <span className="badge bg-success">مدفوع</span> : <span className="badge bg-warning">غير مدفوع</span>}</td>
                  <td className="small">{r.paid_at ? new Date(r.paid_at).toLocaleDateString('ar-SA') : '-'}</td>
                  <td>
                    {!r.paid && <button className="btn btn-sm btn-outline-success me-1" onClick={() => handlePay(r.id)} title="دفع"><i className="bi bi-check-lg"></i></button>}
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openEdit(r)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="9" className="text-center text-muted py-4">لا توجد رواتب</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-cash-stack me-2"></i>{editingId ? 'تعديل الراتب' : 'إضافة راتب'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">الموظف <span className="text-danger">*</span></label>
                    <select className="form-select" value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })} required>
                      <option value="">اختر الموظف</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                    </select>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الشهر</label>
                      <input type="month" className="form-control" value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">المبلغ</label>
                      <input type="number" className="form-control" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} min="0" step="0.01" required />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">المكافآت</label>
                      <input type="number" className="form-control" value={formData.bonuses} onChange={e => setFormData({ ...formData, bonuses: e.target.value })} min="0" step="0.01" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الخصومات</label>
                      <input type="number" className="form-control" value={formData.deductions} onChange={e => setFormData({ ...formData, deductions: e.target.value })} min="0" step="0.01" />
                    </div>
                  </div>
                  <div className="alert alert-info mb-0 text-center">
                    <strong>صافي الراتب: </strong>
                    {netAmount().toLocaleString()} ر.س
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span> جاري الحفظ...</> : <><i className="bi bi-check-lg me-1"></i> حفظ</>}
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
