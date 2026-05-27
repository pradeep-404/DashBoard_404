import React, { useState, useRef } from 'react';
import {
  BarChart3, Home, FolderOpen, Table, Users, FileText, Flag, UserCheck, Calendar, File as FileIcon, Upload
} from 'lucide-react';
import { useData } from './DataContext';
import Overview from './Overview';
import Page1 from './Page1';
import Page2 from './Page2';
import { Page3, Page4, Page5 } from './PagesExtra';
import Page6 from './Page6';

export default function App() {
  const [page, setPage] = useState(0);
  const { entries, loadExcel } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      loadExcel(e.target.files[0]).catch(err => alert('Error loading file'));
    }
  };

  return (
    <div className="app">
      <div className="sb">
        <div className="sb-logo">
          <BarChart3 className="text-[#93b8d8]" size={24} />
          <div>
            <div className="sb-logo-text">Timesheet Tracker</div>
            <div className="sb-logo-sub">Manager Dashboard</div>
          </div>
        </div>

        {localStorage.getItem('superadmin') === 'true' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '0 20px 24px' }}>
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px 14px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: 600, backgroundColor: '#185FA5' }}
            >
              <Upload size={16} /> Upload CSV/Excel
            </button>
            <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
            <button 
              onClick={() => { localStorage.removeItem('superadmin'); window.location.reload(); }}
              style={{ background: 'transparent', border: 'none', color: '#93b8d8', fontSize: '12px', cursor: 'pointer', marginTop: '4px' }}
            >
              Logout Admin
            </button>
          </div>
        )}

        <div className="sb-nav">
          <div className="sb-sec">Pages</div>
          <NavItem icon={<Home size={18} />} text="Overview" active={page === 0} onClick={() => setPage(0)} />
          <NavItem icon={<FolderOpen size={18} />} text="Per project hours" active={page === 1} onClick={() => setPage(1)} />
          <NavItem icon={<Table size={18} />} text="Project × employee" active={page === 2} onClick={() => setPage(2)} />
          <NavItem icon={<Users size={18} />} text="Employee hours" active={page === 3} onClick={() => setPage(3)} />
          <NavItem icon={<FileText size={18} />} text="Timesheet detail" active={page === 4} onClick={() => setPage(4)} />
          <NavItem icon={<Flag size={18} />} text="Missing timesheets" active={page === 5} onClick={() => setPage(5)} />
          <NavItem icon={<UserCheck size={18} />} text="Employee → Projects" active={page === 6} onClick={() => setPage(6)} />
        </div>
        <div className="sb-foot">
          <Calendar size={14} className="inline mr-2 -mt-1" /> All loaded dates<br />
          <Users size={14} className="inline mr-2 -mt-1" /> {[...new Set(entries.map(e=>e.employee))].length} employees · {[...new Set(entries.map(e=>e.project))].length} projects<br />
          <FileIcon size={14} className="inline mr-2 -mt-1" /> {entries.length} entries
        </div>
      </div>

      <div className="main">
        {page === 0 && <Overview />}
        {page === 1 && <Page1 />}
        {page === 2 && <Page2 />}
        {page === 3 && <Page3 />}
        {page === 4 && <Page4 />}
        {page === 5 && <Page5 />}
        {page === 6 && <Page6 />}
      </div>
    </div>
  );
}

function NavItem({ icon, text, active, onClick }: { icon: React.ReactNode, text: string, active: boolean, onClick: () => void }) {
  return (
    <div className={`ni ${active ? 'on' : ''}`} onClick={onClick}>
      {icon} {text}
    </div>
  );
}
