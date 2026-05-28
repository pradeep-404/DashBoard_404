import React, { useState } from 'react';
import {
  BarChart3, Home, FolderOpen, Table, Users, FileText, Flag, UserCheck, Calendar, File as FileIcon, RefreshCw, X, CheckCircle, AlertCircle
} from 'lucide-react';
import { useData } from './DataContext';
import Overview from './Overview';
import Page1 from './Page1';
import Page2 from './Page2';
import { Page3, Page4, Page5 } from './PagesExtra';
import Page6 from './Page6';

export default function App() {
  const [page, setPage] = useState(0);
  const { entries, syncFromZoho, syncing, toastMsg, setToastMsg } = useData();

  return (
    <div className="app">
      {toastMsg && (
        <Toast message={toastMsg.msg} type={toastMsg.type} onClose={() => setToastMsg(null)} />
      )}
      <div className="sb">
        <div className="sb-logo">
          <BarChart3 className="text-[#93b8d8]" size={24} />
          <div>
            <div className="sb-logo-text">Timesheet Tracker</div>
            <div className="sb-logo-sub">Manager Dashboard</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '0 20px 24px' }}>
          <button 
            onClick={syncFromZoho}
            disabled={syncing}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              width: '100%', 
              padding: '12px 14px', 
              background: '#ffffff', 
              color: '#185FA5', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              fontSize: '14px', 
              cursor: syncing ? 'not-allowed' : 'pointer', 
              fontWeight: 600, 
              opacity: syncing ? 0.7 : 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={e => { if(!syncing) e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor='#cbd5e1'; }}
            onMouseOut={e => { if(!syncing) e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor='#e2e8f0'; }}
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Sync Remote Sheet'}
          </button>
        </div>

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

function Toast({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [message, type, onClose]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '24px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      backgroundColor: type === 'success' ? '#ECFDF5' : '#FEF2F2',
      color: type === 'success' ? '#065F46' : '#991B1B',
      borderLeft: `4px solid ${type === 'success' ? '#10B981' : '#EF4444'}`,
      fontWeight: 500,
      fontSize: '14px',
      maxWidth: '350px'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1, gap: '12px' }}>
        <div style={{ marginTop: '2px' }}>
          {type === 'success' ? <CheckCircle size={20} color="#10B981" /> : <AlertCircle size={20} color="#EF4444" />}
        </div>
        <span style={{ wordBreak: 'break-word', lineHeight: 1.4 }}>{message}</span>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignSelf: 'flex-start' }}>
        <X size={16} color={type === 'success' ? '#065F46' : '#991B1B'} />
      </button>
    </div>
  );
}
