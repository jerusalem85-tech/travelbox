import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function Leads() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', phone: '', email: '', source: 'website', destination: '',
    travel_date: '', persons_count: '', budget: '', assigned_to: '', notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/leads?${params.toString()}`);
      setRows(res.data.rows || res.data || []);
    } catch (err) {
      Swal.fire('خطأ', 'فشل تحميل العملاء المحتملين', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/leads/users');
      setUsers(res.data.rows || res.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, [search, statusFilter]);
  useEffect(() => { fetchUsers(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      full_name: '', phone: '', email: '', source: 'website', destination: '',
      travel_date: '', persons_count: '', budget: '', assigned_to: '', notes: ''
    });
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (item) => {
    setFormData({
      full_name: item.full_name, phone: item.phone || '', email: item.email || '',
      source: item.source || 'website', destination: item.destination || '',
      travel_date: item.travel_date?.split('T')[0] || '', persons_count: item.persons_count || '',
      budget: item.budget || '', assigned_to: item.assigned_to || '', notes: item.notes || ''
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) { Swal.fire('تنبيه', 'أدخل اسم العميل', 'warning'); return; }
    if (!formData.phone.trim() && !formData.email.trim()) { Swal.fire('تنبيه', 'أدخل رقم الهاتف أو البريد الإلكتروني', 'warning'); return; }
    setSubmitting(true);
    try {
      const payload = {
        full_name: formData.full_name, phone: formData.phone, email: formData.email,
        source: formData.source, destination: formData.destination,
        travel_date: formData.travel_date || null, persons_count: formData.persons_count ? Number(formData.persons_count) : null,
        budget: formData.budget ? Number(formData.budget) : null,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
        notes: formData.notes
      };
      if (editingId) {
        await api.put(`/leads/${editingId}`, payload);
        Swal.fire({ title: 'تم التحديث', text: 'تم تحديث العميل المحتمل بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/leads', payload);
        Swal.fire({ title: 'تم الإضافة', text: 'تم إضافة العميل المحتمل بنجاح', icon: 'success', timer: 2000, showConfirmButton: false });
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل الحفظ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, name) => {
    Swal.fire({
      title: 'هل أنت متأكد؟', text: `سيتم حذف العميل المحتمل: ${name}`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/leads/${id}`);
          Swal.fire('تم الحذف', 'تم حذف العميل المحتمل بنجاح', 'success');
          fetchData();
        } catch (err) { Swal.fire('خطأ', 'فشل حذف العميل المحتمل', 'error'); }
      }
    });
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/leads/${id}/status`, { status });
      Swal.fire({ title: 'تم التحديث', text: 'تم تغيير الحالة بنجاح', icon: 'success', timer: 1500, showConfirmButton: false });
      fetchData();
    } catch (err) {
      Swal.fire('خطأ', 'فشل تغيير الحالة', 'error');
    }
  };

  const sourceLabel = (s) => ({ website: 'موقع إلكتروني', facebook: 'فيسبوك', instagram: 'انستغرام', friend: 'صديق', other: 'أخرى' })[s] || s;
  const statusColor = (s) => ({ new: 'primary', contacted: 'info', qualified: 'warning', lost: 'danger', converted: 'success' })[s] || 'secondary';
  const statusLabel = (s) => ({ new: 'جديد', contacted: 'تم التواصل', qualified: 'مؤهل', lost: 'خاسر', converted: 'محول' })[s] || s;
  const nextStatus = (s) => ({ new: 'contacted', contacted: 'qualified', qualified: 'converted', lost: null, converted: null })[s];

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0"><i className="bi bi-people me-2"></i>العملاء المحتملين</h4>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-1"></i>إضافة عميل محتمل</button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-5">
              <label className="form-label">بحث</label>
              <input className="form-control" placeholder="بحث بالاسم أو الهاتف أو البريد..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">الحالة</label>
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">جميع الحالات</option>
                <option value="new">جديد</option>
                <option value="contacted">تم التواصل</option>
                <option value="qualified">مؤهل</option>
                <option value="lost">خاسر</option>
                <option value="converted">محول</option>
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setStatusFilter(''); }}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">جاري التحميل...</span></div></div>
          ) : rows.length === 0 ? (
            <div className="text-center py-4 text-muted"><i className="bi bi-inbox fs-1 d-block mb-2"></i>لا توجد عملاء محتملين</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>#</th><th>الاسم</th><th>الهاتف</th><th>البريد</th><th>المصدر</th><th>الوجهة</th><th>تاريخ السفر</th><th>عدد الأشخاص</th><th>الميزانية</th><th>الحالة</th><th>المسؤول</th><th>تاريخ الإضافة</th><th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.id}</td>
                      <td className="fw-bold">{lead.full_name}</td>
                      <td dir="ltr">{lead.phone || '-'}</td>
                      <td className="small">{lead.email || '-'}</td>
                      <td><span className="badge bg-light text-dark">{sourceLabel(lead.source)}</span></td>
                      <td>{lead.destination || '-'}</td>
                      <td className="small">{lead.travel_date ? new Date(lead.travel_date).toLocaleDateString('ar-SA') : '-'}</td>
                      <td>{lead.persons_count || '-'}</td>
                      <td className="fw-bold">{lead.budget ? Number(lead.budget).toLocaleString() + ' ر.س' : '-'}</td>
                      <td>
                        <span className={`badge bg-${statusColor(lead.status)}`}>{statusLabel(lead.status)}</span>
                      </td>
                      <td className="small">{lead.assigned_to_name || '-'}</td>
                      <td className="small">{lead.created_at ? new Date(lead.created_at).toLocaleDateString('ar-SA') : '-'}</td>
                      <td>
                        <div className="btn-group btn-group-sm" dir="ltr">
                          {nextStatus(lead.status) && (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => handleStatusChange(lead.id, nextStatus(lead.status))}
                              title={`تغيير إلى ${statusLabel(nextStatus(lead.status))}`}
                            >
                              <i className="bi bi-arrow-right"></i>
                            </button>
                          )}
                          <button className="btn btn-outline-warning" onClick={() => openEdit(lead)} title="تعديل"><i className="bi bi-pencil"></i></button>
                          <button className="btn btn-outline-danger" onClick={() => handleDelete(lead.id, lead.full_name)} title="حذف"><i className="bi bi-trash"></i></button>
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
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-{editingId ? 'pencil' : 'plus-circle'} me-2"></i>{editingId ? 'تعديل العميل المحتمل' : 'إضافة عميل محتمل جديد'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">الاسم الكامل <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="اسم العميل..." required />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">رقم الهاتف</label>
                      <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleChange} placeholder="05xxxxxxxx" />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">البريد الإلكتروني</label>
                      <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">المصدر</label>
                      <select className="form-select" name="source" value={formData.source} onChange={handleChange}>
                        <option value="website">موقع إلكتروني</option>
                        <option value="facebook">فيسبوك</option>
                        <option value="instagram">انستغرام</option>
                        <option value="friend">صديق</option>
                        <option value="other">أخرى</option>
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">الوجهة</label>
                      <input type="text" className="form-control" name="destination" value={formData.destination} onChange={handleChange} placeholder="الوجهة المطلوبة..." />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">تاريخ السفر</label>
                      <input type="date" className="form-control" name="travel_date" value={formData.travel_date} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">عدد الأشخاص</label>
                      <input type="number" className="form-control" name="persons_count" value={formData.persons_count} onChange={handleChange} min="1" step="1" placeholder="1" />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">الميزانية</label>
                      <div className="input-group">
                        <input type="number" className="form-control" name="budget" value={formData.budget} onChange={handleChange} min="0" step="0.01" placeholder="0.00" />
                        <span className="input-group-text">ر.س</span>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">المسؤول</label>
                      <select className="form-select" name="assigned_to" value={formData.assigned_to} onChange={handleChange}>
                        <option value="">اختر المسؤول (اختياري)</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.name || u.username}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">ملاحظات</label>
                    <textarea className="form-control" name="notes" value={formData.notes} onChange={handleChange} rows="2" placeholder="ملاحظات..."></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span>جاري الحفظ...</> : <><i className="bi bi-check-lg me-1"></i>{editingId ? 'تحديث' : 'حفظ'}</>}
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
