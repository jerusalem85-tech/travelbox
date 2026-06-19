import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AdvancedSettings() {
  const [form, setForm] = useState({
    site_name: '',
    company_name: '',
    company_phone: '',
    company_email: '',
    company_address: '',
    tax_number: '',
    default_currency: 'USD',
    date_format: 'YYYY-MM-DD',
    language: 'ar',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    whatsapp_api_key: '',
    whatsapp_api_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings/1').then(res => {
      if (res.data) setForm(prev => ({ ...prev, ...res.data }));
    }).catch(() => {
      api.get('/settings/advanced').then(r => {
        if (r.data) setForm(prev => ({ ...prev, ...r.data }));
      }).catch(() => {});
    }).finally(() => setLoading(false));
  }, []);

  const handleChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [field]: val });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/1', form);
      Swal.fire({ icon: 'success', title: 'تم حفظ الإعدادات المتقدمة', timer: 1500, showConfirmButton: false });
    } catch (e) {
      await api.put('/settings/advanced', form).then(() => {
        Swal.fire({ icon: 'success', title: 'تم حفظ الإعدادات المتقدمة', timer: 1500, showConfirmButton: false });
      }).catch(() => {
        Swal.fire({ icon: 'error', title: 'خطأ', text: e.response?.data?.error || 'حدث خطأ أثناء الحفظ' });
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>;
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-sliders me-2"></i>
          الإعدادات المتقدمة
        </h4>
      </div>

      <div className="card mb-4">
        <div className="card-header"><i className="bi bi-building me-2"></i>إعدادات عامة</div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">اسم الموقع</label>
              <input type="text" className="form-control" value={form.site_name} onChange={handleChange('site_name')} />
            </div>
            <div className="col-md-4">
              <label className="form-label">اسم الشركة</label>
              <input type="text" className="form-control" value={form.company_name} onChange={handleChange('company_name')} />
            </div>
            <div className="col-md-4">
              <label className="form-label">هاتف الشركة</label>
              <input type="text" className="form-control" value={form.company_phone} onChange={handleChange('company_phone')} />
            </div>
            <div className="col-md-4">
              <label className="form-label">البريد الإلكتروني</label>
              <input type="email" className="form-control" value={form.company_email} onChange={handleChange('company_email')} />
            </div>
            <div className="col-md-4">
              <label className="form-label">العنوان</label>
              <input type="text" className="form-control" value={form.company_address} onChange={handleChange('company_address')} />
            </div>
            <div className="col-md-4">
              <label className="form-label">الرقم الضريبي</label>
              <input type="text" className="form-control" value={form.tax_number} onChange={handleChange('tax_number')} />
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header"><i className="bi bi-currency-exchange me-2"></i>العملة والتنسيق</div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">العملة الافتراضية</label>
              <select className="form-select" value={form.default_currency} onChange={handleChange('default_currency')}>
                <option value="USD">USD - دولار</option>
                <option value="ILS">ILS - شيكل</option>
                <option value="EUR">EUR - يورو</option>
                <option value="JOD">JOD - دينار أردني</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">صيغة التاريخ</label>
              <select className="form-select" value={form.date_format} onChange={handleChange('date_format')}>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                <option value="MM-DD-YYYY">MM-DD-YYYY</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">اللغة</label>
              <select className="form-select" value={form.language} onChange={handleChange('language')}>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header"><i className="bi bi-envelope me-2"></i>إعدادات البريد الإلكتروني</div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">خادم SMTP</label>
              <input type="text" className="form-control" value={form.smtp_host} onChange={handleChange('smtp_host')} />
            </div>
            <div className="col-md-2">
              <label className="form-label">المنفذ</label>
              <input type="number" className="form-control" value={form.smtp_port} onChange={handleChange('smtp_port')} />
            </div>
            <div className="col-md-4">
              <label className="form-label">اسم المستخدم</label>
              <input type="text" className="form-control" value={form.smtp_username} onChange={handleChange('smtp_username')} />
            </div>
            <div className="col-md-6">
              <label className="form-label">كلمة المرور</label>
              <input type="password" className="form-control" value={form.smtp_password} onChange={handleChange('smtp_password')} />
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header"><i className="bi bi-whatsapp me-2"></i>إعدادات واتساب</div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">مفتاح API</label>
              <input type="password" className="form-control" value={form.whatsapp_api_key} onChange={handleChange('whatsapp_api_key')} />
            </div>
            <div className="col-md-6">
              <label className="form-label">رابط API</label>
              <input type="text" className="form-control" value={form.whatsapp_api_url} onChange={handleChange('whatsapp_api_url')} />
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mb-4">
        <button className="btn btn-primary btn-lg px-5" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner-border spinner-border-sm me-2" role="status" /> : <i className="bi bi-check2-circle me-2"></i>}
          حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}
