import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../services/api';

const breadcrumbLabels = {
  '': 'الرئيسية', bookings: 'الحجوزات', customers: 'العملاء', suppliers: 'الموردين',
  invoices: 'الفواتير', payments: 'المدفوعات', expenses: 'المصاريف', reports: 'التقارير',
  quotations: 'عروض الأسعار', users: 'المستخدمون', notifications: 'الإشعارات', settings: 'الإعدادات',
  hotels: 'الفنادق', packages: 'الباقات', insurance: 'التأمين', contracts: 'العقود',
  commissions: 'العمولات', 'activity-log': 'سجل النشاط', currencies: 'العملات',
  communications: 'التواصل', visas: 'التأشيرات', documents: 'المستندات', tasks: 'المهام',
  calendar: 'التقويم', 'price-lists': 'قوائم الأسعار', checklist: 'قائمة المتابعة',
  inventory: 'المخزون', leads: 'العملاء المحتملون', employees: 'الموظفون',
  vehicles: 'المركبات', guides: 'المرشدون', discounts: 'الخصومات', 'tax-rates': 'الضرائب',
  reviews: 'التقييمات', brokers: 'السماسرة', transfers: 'المشاوير',
  'services-catalog': 'خدمات إضافية', 'restaurant-bookings': 'حجوزات مطاعم',
  airports: 'المطارات', destinations: 'الوجهات', 'flight-schedules': 'جداول الرحلات',
  'customer-timeline': 'سجل العميل', 'follow-ups': 'متابعة', 'price-calculator': 'حاسبة الأسعار',
  properties: 'العقارات', referrals: 'الإحالات', trash: 'سلة المهملات',
  'login-log': 'سجل الدخول', templates: 'القوالب', 'advanced-settings': 'الإعدادات المتقدمة',
  installments: 'خطط التقسيط', create: 'جديد', edit: 'تعديل',
};

const colors = {
  indigo: '#4f46e5', blue: '#2563eb', green: '#16a34a',
  red: '#dc2626', purple: '#9333ea', orange: '#ea580c',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [unreadCount, setUnreadCount] = useState(0);
  const [accentColor, setAccentColor] = useState(localStorage.getItem('accent_color') || 'indigo');
  const [collapsedSections, setCollapsedSections] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sidebar_sections') || '{}'); } catch { return {}; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', colors[accentColor]);
    localStorage.setItem('accent_color', accentColor);
    api.put('/user-preferences', { theme_color: accentColor }).catch(() => {});
  }, [accentColor]);

  useEffect(() => {
    const interval = setInterval(() => {
      api.get('/notifications/unread-count').then(r => setUnreadCount(r.data.count)).catch(() => {});
    }, 30000);
    api.get('/notifications/unread-count').then(r => setUnreadCount(r.data.count)).catch(() => {});
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); document.getElementById('sidebar').classList.toggle('show'); }
      if (e.altKey && e.key === 'b') { e.preventDefault(); navigate('/bookings'); }
      if (e.altKey && e.key === 'd') { e.preventDefault(); navigate('/'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const toggleSection = (section) => {
    const updated = { ...collapsedSections, [section]: !collapsedSections[section] };
    setCollapsedSections(updated);
    localStorage.setItem('sidebar_sections', JSON.stringify(updated));
  };

  const handleLogout = () => { logout(); navigate('/login'); };
  const toggleSidebar = () => { document.getElementById('sidebar').classList.toggle('show'); document.getElementById('overlay').classList.toggle('show'); };

  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'الرئيسية', path: '/' }];
  let cumulative = '';
  pathParts.forEach((part) => {
    cumulative += '/' + part;
    breadcrumbs.push({ label: breadcrumbLabels[part] || part, path: cumulative });
  });

  return (
    <>
      <nav className="navbar navbar-dark d-lg-none fixed-top no-print" style={{ background: 'var(--bg-sidebar)', zIndex: 1060, padding: '8px 16px' }}>
        <button className="btn text-white p-0" onClick={toggleSidebar}><i className="bi bi-list fs-4"></i></button>
        <span className="navbar-brand mb-0 h6">نظام إدارة السفر</span>
        <button className="btn text-white p-0 position-relative" onClick={() => navigate('/notifications')}>
          <i className="bi bi-bell fs-5"></i>
          {unreadCount > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize:'0.6rem'}}>{unreadCount}</span>}
        </button>
      </nav>

      <div id="overlay" className="sidebar-overlay" onClick={toggleSidebar}></div>

      <div className="sidebar" id="sidebar">
        <div className="logo">
          <h5><i className="bi bi-airplane-engines me-2"></i>نظام السفر</h5>
          <small>إدارة الحجوزات والسفر</small>
        </div>
        <nav>
          {[
  { section: 'الرئيسية', id: 'main', links: [
    { to: '/', end: true, icon: 'grid-1x2', label: 'لوحة التحكم' },
  ]},
  { section: 'العمليات', id: 'operations', links: [
    { to: '/bookings', icon: 'journal-text', label: 'الحجوزات' },
    { to: '/customers', icon: 'people', label: 'العملاء' },
    { to: '/suppliers', icon: 'truck', label: 'الموردين' },
    { to: '/quotations', icon: 'file-earmark-text', label: 'عروض الأسعار' },
    { to: '/hotels', icon: 'building', label: 'الفنادق' },
    { to: '/packages', icon: 'box-seam', label: 'الباقات السياحية' },
    { to: '/insurance', icon: 'shield-check', label: 'التأمين' },
    { to: '/visas', icon: 'passport', label: 'التأشيرات' },
    { to: '/leads', icon: 'funnel', label: 'العملاء المحتملون' },
    { to: '/documents', icon: 'files', label: 'المستندات' },
    { to: '/checklist', icon: 'list-check', label: 'قائمة المتابعة' },
    { to: '/calendar', icon: 'calendar3', label: 'التقويم' },
    { to: '/vehicles', icon: 'truck', label: 'المركبات' },
    { to: '/airports', icon: 'airplane', label: 'المطارات' },
    { to: '/destinations', icon: 'globe', label: 'الوجهات' },
    { to: '/customer-timeline', icon: 'clock-history', label: 'سجل العميل' },
    { to: '/follow-ups', icon: 'bell', label: 'متابعة' },
    { to: '/flight-schedules', icon: 'calendar-week', label: 'جداول الرحلات' },
    { to: '/price-calculator', icon: 'calculator', label: 'حاسبة الأسعار' },
    { to: '/guides', icon: 'person-badge', label: 'المرشدون' },
    { to: '/transfers', icon: 'geo-alt', label: 'المشاوير' },
    { to: '/restaurant-bookings', icon: 'cup-hot', label: 'حجوزات مطاعم' },
    { to: '/properties', icon: 'house-door', label: 'العقارات' },
    { to: '/services-catalog', icon: 'card-list', label: 'خدمات إضافية' },
    { to: '/installments', icon: 'wallet', label: 'خطط التقسيط' },
  ]},
  { section: 'المالية', id: 'financial', links: [
    { to: '/invoices', icon: 'receipt-cutoff', label: 'الفواتير' },
    { to: '/payments', icon: 'cash-stack', label: 'المدفوعات' },
    { to: '/expenses', icon: 'wallet2', label: 'المصاريف' },
    { to: '/price-lists', icon: 'tags', label: 'قوائم الأسعار' },
    { to: '/reports', icon: 'graph-up', label: 'التقارير' },
    { to: '/discounts', icon: 'percent', label: 'الخصومات' },
    { to: '/tax-rates', icon: 'calculator', label: 'الضرائب' },
    { to: '/brokers', icon: 'handshake', label: 'السماسرة' },
  ]},
  { section: 'العقود والعمولات', id: 'contracts', links: [
    { to: '/contracts', icon: 'file-earmark-text', label: 'العقود' },
    { to: '/commissions', icon: 'percent', label: 'العمولات' },
    { to: '/activity-log', icon: 'clock-history', label: 'سجل النشاط' },
    { to: '/reviews', icon: 'star', label: 'التقييمات' },
  ]},
  { section: 'الموارد البشرية', id: 'hr', links: [
    { to: '/employees', icon: 'person-workspace', label: 'الموظفون' },
  ]},
  { section: 'الإدارة', id: 'admin', links: [
    { to: '/users', icon: 'person-gear', label: 'المستخدمون' },
    { to: '/notifications', icon: 'bell', label: 'الإشعارات', badge: unreadCount },
    { to: '/currencies', icon: 'currency-exchange', label: 'العملات' },
    { to: '/communications', icon: 'chat-dots', label: 'التواصل' },
    { to: '/login-log', icon: 'door-open', label: 'سجل الدخول' },
    { to: '/tasks', icon: 'check2-square', label: 'المهام' },
    { to: '/inventory', icon: 'boxes', label: 'المخزون' },
    { to: '/referrals', icon: 'share', label: 'الإحالات' },
    { to: '/trash', icon: 'trash', label: 'سلة المهملات' },
    { to: '/settings', icon: 'gear', label: 'الإعدادات' },
    { to: '/templates', icon: 'envelope-paper', label: 'القوالب' },
    { to: '/advanced-settings', icon: 'sliders', label: 'الإعدادات المتقدمة' },
  ]},
].map(group => (
  <div key={group.id}>
    <div className="nav-section" onClick={() => toggleSection(group.id)} style={{ cursor: 'pointer' }}>
      {group.section}
      <i className={`bi bi-chevron-${collapsedSections[group.id] ? 'left' : 'down'} float-end`} style={{fontSize:'0.75rem'}}></i>
    </div>
    <div className={`${collapsedSections[group.id] ? 'collapse' : ''}`}>
      {group.links.map(link => (
        <NavLink key={link.to} to={link.to} end={link.end} className="nav-link" onClick={() => document.getElementById('sidebar').classList.remove('show')}>
          <i className={`bi bi-${link.icon}`}></i> {link.label}
          {link.badge > 0 && <span className="badge bg-danger me-auto" style={{fontSize:'0.65rem'}}>{link.badge}</span>}
        </NavLink>
      ))}
    </div>
  </div>
))}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">{user?.full_name?.charAt(0) || 'U'}</div>
          <div className="user-info">
            <div className="name">{user?.full_name}</div>
            <div className="role">{user?.role === 'admin' ? 'مدير النظام' : 'مستخدم'}</div>
          </div>
          <div className="d-flex align-items-center gap-1">
            <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              <i className={`bi bi-${theme === 'light' ? 'moon-stars' : 'sun'}`}></i>
            </button>
          </div>
          <div className="color-picker d-flex gap-1 mt-2 justify-content-center">
            {Object.entries(colors).map(([name, hex]) => (
              <button key={name} className="color-dot"
                style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: hex, border: accentColor === name ? '2px solid white' : '2px solid transparent',
                  cursor: 'pointer', padding: 0
                }}
                onClick={() => setAccentColor(name)} />
            ))}
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="breadcrumb-bar d-flex justify-content-between align-items-center px-3 py-2" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              {breadcrumbs.map((crumb, i) => (
                <li key={crumb.path} className={`breadcrumb-item ${i === breadcrumbs.length - 1 ? 'active' : ''}`}>
                  {i === breadcrumbs.length - 1 ? crumb.label : <NavLink to={crumb.path}>{crumb.label}</NavLink>}
                </li>
              ))}
            </ol>
          </nav>
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted" style={{fontSize:'0.85rem'}}>
              <i className="bi bi-person-circle me-1"></i>{user?.full_name || ''}
            </span>
            <button className="btn p-0 position-relative text-muted" onClick={() => navigate('/notifications')}>
              <i className="bi bi-bell fs-6"></i>
              {unreadCount > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize:'0.55rem'}}>{unreadCount}</span>}
            </button>
          </div>
        </div>
        <div className="p-3">
          <Outlet />
        </div>
      </div>
    </>
  );
}
