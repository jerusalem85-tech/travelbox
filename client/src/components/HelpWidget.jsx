import { useState } from 'react';
import api from '../services/api';

export default function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');

  const toggleHelp = async () => {
    setOpen(!open);
    if (!open && articles.length === 0) {
      try {
        const res = await api.get('/knowledge?limit=5');
        setArticles(res.data.rows || []);
      } catch {}
    }
  };

  return (
    <>
      <button className="btn btn-primary position-fixed shadow" 
        style={{ bottom: '20px', left: '20px', zIndex: 9998, borderRadius: '50%', width: '50px', height: '50px' }}
        onClick={toggleHelp}>
        <i className="bi bi-question-lg fs-4"></i>
      </button>
      
      {open && (
        <div className="card position-fixed shadow-lg" 
          style={{ bottom: '80px', left: '20px', width: '320px', maxHeight: '500px', zIndex: 9999, overflowY: 'auto' }}>
          <div className="card-header d-flex justify-content-between align-items-center bg-primary text-white">
            <span className="fw-bold">المساعدة السريعة</span>
            <button className="btn btn-sm text-white" onClick={() => setOpen(false)}><i className="bi bi-x-lg"></i></button>
          </div>
          <div className="card-body">
            <input className="form-control form-control-sm mb-3" placeholder="ابحث عن مساعدة..." 
              value={search} onChange={e => setSearch(e.target.value)} />
            {articles.filter(a => !search || a.title?.includes(search) || a.content?.includes(search)).map(a => (
              <div key={a.id} className="mb-2 p-2 border rounded">
                <div className="fw-bold small">{a.title}</div>
                <div className="text-muted" style={{fontSize:'0.75rem'}}>{a.content?.substring(0, 120)}...</div>
              </div>
            ))}
            {articles.length === 0 && <p className="text-muted text-center small my-3">لا توجد مقالات مساعدة بعد</p>}
          </div>
        </div>
      )}
    </>
  );
}
