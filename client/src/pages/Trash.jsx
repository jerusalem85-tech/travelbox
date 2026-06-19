import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const entityLabels = {
  booking: 'حجوزات',
  customer: 'عملاء',
  supplier: 'موردين',
  invoice: 'فواتير',
  payment: 'مدفوعات',
  expense: 'مصاريف',
  hotel: 'فنادق',
  package: 'باقات',
  contract: 'عقود',
  commission: 'عمولات',
  user: 'مستخدمين',
  lead: 'عملاء محتملين',
  employee: 'موظفين',
  vehicle: 'مركبات',
  guide: 'مرشدين',
  insurance: 'تأمين',
  visa: 'تأشيرات',
  task: 'مهام',
  document: 'مستندات',
  communication: 'تواصل',
  property: 'عقارات',
  transfer: 'مشاوير',
  discount: 'خصومات',
  tax_rate: 'ضرائب',
  broker: 'سماسرة',
  referral: 'إحالات',
  review: 'تقييمات',
};

export default function Trash() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');
  const [search, setSearch] = useState('');
  const [entityTypes, setEntityTypes] = useState([]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityType) params.append('entity_type', entityType);
      if (search) params.append('entity_id', search);
      const res = await api.get(`/trash?${params.toString()}`);
      setItems(res.data.rows || res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [entityType, search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    api.get('/trash?distinct=entity_type').then(res => {
      const types = res.data.rows || res.data || [];
      setEntityTypes(types.map(t => t.entity_type || t).filter(Boolean));
    }).catch(() => {});
  }, []);

  const handleRestore = async (id) => {
    try {
      await api.post(`/trash/restore/${id}`);
      Swal.fire({ icon: 'success', title: 'تمت الاستعادة بنجاح', timer: 1500, showConfirmButton: false });
      fetchItems();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'خطأ', text: e.response?.data?.error || 'حدث خطأ' });
    }
  };

  const handlePermanentDelete = (id) => {
    Swal.fire({
      title: 'تأكيد الحذف النهائي',
      text: 'لا يمكن التراجع عن هذا الإجراء',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'حذف نهائي',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#dc3545',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/trash/${id}`);
          Swal.fire({ icon: 'success', title: 'تم الحذف النهائي', timer: 1500, showConfirmButton: false });
          fetchItems();
        } catch (e) {
          Swal.fire({ icon: 'error', title: 'خطأ', text: e.response?.data?.error || 'حدث خطأ' });
        }
      }
    });
  };

  const handleEmptyTrash = () => {
    Swal.fire({
      title: 'تفريغ سلة المهملات',
      text: 'سيتم حذف جميع العناصر نهائياً. هل أنت متأكد؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'تفريغ',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#dc3545',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete('/trash/');
          Swal.fire({ icon: 'success', title: 'تم التفريغ بنجاح', timer: 1500, showConfirmButton: false });
          fetchItems();
        } catch (e) {
          Swal.fire({ icon: 'error', title: 'خطأ', text: e.response?.data?.error || 'حدث خطأ' });
        }
      }
    });
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-trash me-2"></i>
          سلة المهملات
        </h4>
        {items.length > 0 && (
          <button className="btn btn-outline-danger" onClick={handleEmptyTrash}>
            <i className="bi bi-trash3 me-1"></i>
            تفريغ سلة المهملات
          </button>
        )}
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">نوع الكيان</label>
              <select className="form-select" value={entityType} onChange={(e) => { setEntityType(e.target.value); }}>
                <option value="">الكل</option>
                {entityTypes.map(t => (
                  <option key={t} value={t}>{entityLabels[t] || t}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">رقم الكيان</label>
              <input
                type="text"
                className="form-control"
                placeholder="بحث برقم الكيان..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setEntityType(''); setSearch(''); }}>
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
          ) : items.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-archive fs-1 d-block mb-2"></i>
              سلة المهملات فارغة
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>نوع الكيان</th>
                    <th>رقم الكيان</th>
                    <th>محذوف بواسطة</th>
                    <th>تاريخ الحذف</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>{item.id}</td>
                      <td><span className="badge bg-light text-dark">{entityLabels[item.entity_type] || item.entity_type}</span></td>
                      <td><code>{item.entity_id}</code></td>
                      <td className="fw-semibold">{item.deleted_by_name || '-'}</td>
                      <td>{item.deleted_at ? new Date(item.deleted_at).toLocaleString('ar-SA') : '-'}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-success" onClick={() => handleRestore(item.id)}>
                            <i className="bi bi-arrow-counterclockwise me-1"></i>استعادة
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handlePermanentDelete(item.id)}>
                            <i className="bi bi-trash3 me-1"></i>حذف نهائي
                          </button>
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
    </div>
  );
}
