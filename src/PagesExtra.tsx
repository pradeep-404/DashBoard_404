import React, { useState } from 'react';
import { Users, BarChart3, FileText, ListIcon, Download, Flag, UserCheck, Grid } from 'lucide-react';
import { useData } from './DataContext';
import { filterEntries, computeEmployeeHrs, getColor, computeMissingTimesheets, getUniqueMonths } from './utils';

export function Page3() {
  const { entries } = useData();
  const [month, setMonth] = useState('all');
  const uniqueMonths = getUniqueMonths(entries);

  const filtered = filterEntries(entries, month, 'all');
  const empMap = computeEmployeeHrs(filtered);
  const maxHr = empMap[0]?.hrs || 1;

  return (
    <div className="pg on">
      <div className="pgtitle"><Users size={16} className="text-[#185FA5]" />Employee hours</div>
      <div className="card">
        <div className="ctitle"><BarChart3 size={13} className="text-slate-500 shrink-0" /><span className="ctitle-name">Total hours per employee</span>
        <div className="cf"><label>Month</label><select className="fsel" value={month} onChange={e=>setMonth(e.target.value)}><option value="all">All</option>{uniqueMonths.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
        </div>
        <div className="hbars">
          {empMap.map((e, i) => (
              <div className="hbrow" key={e.name}>
                  <span className="hblabel">{e.name}</span>
                  <div className="hbtrack">
                      <div className="hbfill" style={{ width: `${Math.max(5, (e.hrs/maxHr)*100)}%`, background: getColor(i) }}>{e.hrs}h</div>
                  </div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Page4() {
  const { entries } = useData();
  const [month, setMonth] = useState('all');
  const [emp, setEmp] = useState('all');
  const [proj, setProj] = useState('all');
  const [pg, setPg] = useState(0);
  const perPage = 20;
  const uniqueMonths = getUniqueMonths(entries);
  
  const filtered = filterEntries(entries, month, 'all', emp, proj);
  const totalItems = filtered.length;
  const slice = filtered.slice(pg * perPage, (pg + 1) * perPage);
  
  return (
    <div className="pg on">
      <div className="pgtitle"><FileText size={16} className="text-[#185FA5]" />Timesheet detail</div>
      <div className="card">
        <div className="ctitle">
          <ListIcon size={13} className="text-slate-500 shrink-0" />
          <span className="ctitle-name">All entries</span>
          <div className="cf">
            <label>Month</label><select className="fsel" value={month} onChange={e=>{setMonth(e.target.value); setPg(0);}}><option value="all">All</option>{uniqueMonths.map(m=><option key={m} value={m}>{m}</option>)}</select>
            <div className="fsep"></div>
            <label>Employee</label><select className="fsel" value={emp} onChange={e=>{setEmp(e.target.value); setPg(0);}}><option value="all">All</option>{[...new Set(entries.map(x=>x.employee))].map(x=><option key={x} value={x}>{x}</option>)}</select>
            <div className="fsep"></div>
            <label>Project</label><select className="fsel" value={proj} onChange={e=>{setProj(e.target.value); setPg(0);}}><option value="all">All</option>{[...new Set(entries.map(x=>x.project))].map(x=><option key={x} value={x}>{x}</option>)}</select>
          </div>
        </div>
        <div style={{overflowX: 'auto'}}>
          <table className="tbl" style={{ width: '100%' }}>
            <thead>
              <tr><th>Date</th><th>Employee</th><th>Project</th><th>Hrs</th><th>Task</th><th>Remarks</th></tr>
            </thead>
            <tbody>
              {slice.map((r, i) => (
                  <tr key={i}>
                      <td>{r.date}</td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div className="avatar" style={{ background: getColor(i), color: '#fff', width: '20px', height: '20px', fontSize: '10px' }}>{r.employee.substring(0,2)}</div>{r.employee}</div></td>
                      <td>{r.project}</td>
                      <td>{r.hours}h</td>
                      <td>{r.task}</td>
                      <td>{r.remarks || '—'}</td>
                  </tr>
              ))}
              {slice.length === 0 && <tr><td colSpan={6} style={{textAlign:'center'}}>No items</td></tr>}
            </tbody>
          </table>
        </div>
        {totalItems > 0 && (
            <div className="pg-bar">
              <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Showing {pg * perPage + 1}–{Math.min((pg + 1) * perPage, totalItems)} of {totalItems} entries</span>
              <div className="pg-nums">
                <button className="pgn-arr" disabled={pg === 0} onClick={() => setPg(pg-1)}>←</button>
                <button className="pgn-arr" disabled={(pg + 1) * perPage >= totalItems} onClick={() => setPg(pg+1)}>→</button>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}

export function Page5() {
  const { entries } = useData();
  const [month, setMonth] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pg, setPg] = useState(0);
  const perPage = 20;

  const uniqueMonths = getUniqueMonths(entries);
  let missData = computeMissingTimesheets(entries, month);
  
  if (statusFilter !== 'all') {
      missData = missData.filter(m => m.flag === statusFilter);
  }
  
  const totalItems = missData.length;
  const slice = missData.slice(pg * perPage, (pg + 1) * perPage);
  
  return (
    <div className="pg on">
      <div className="pgtitle"><Flag size={16} className="text-[#185FA5]" />Missing timesheets</div>
      <div className="card">
        <div className="ctitle">
          <Flag size={13} className="text-[#A32D2D] shrink-0" />
          <span className="ctitle-name text-[#A32D2D]">Problem entries — Missing Days & Under 35 hours/week</span>
          <div className="cf">
            <label>Month</label>
            <select className="fsel" value={month} onChange={e=>{setMonth(e.target.value); setPg(0);}}>
                <option value="all">All</option>
                {uniqueMonths.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
            <div className="fsep"></div>
            <label>Status</label>
            <select className="fsel" value={statusFilter} onChange={e=>{setStatusFilter(e.target.value); setPg(0);}}>
                <option value="all">All</option>
                <option value="Missing Entry">Missing Entry</option>
                <option value="Under Hours">Under Hours</option>
            </select>
          </div>
        </div>
        <div style={{overflowX: 'auto'}}>
            <table className="tbl" style={{ width: '100%' }}>
              <thead>
                <tr><th>Employee</th><th>Week</th><th>Project</th><th>Hours</th><th>Status</th><th>Missing Dates</th></tr>
              </thead>
              <tbody>
                {slice.map((r, i) => (
                  <tr key={i}>
                    <td>{r.emp}</td><td>{r.week}</td><td>{r.proj}</td><td><b>{r.hrs}h</b></td>
                    <td><span className={`badge ${r.flag === 'Missing Entry' ? 'b-red' : 'b-org'}`}>{r.flag}</span></td>
                    <td style={{ fontSize: '10px', color: 'var(--color-text-secondary)', maxWidth: '200px' }}>{r.missingDates || '—'}</td>
                  </tr>
                ))}
                {slice.length===0 && <tr><td colSpan={6} style={{textAlign:'center'}}>All employees are compliant</td></tr>}
              </tbody>
            </table>
        </div>
        {totalItems > 0 && (
            <div className="pg-bar">
              <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Showing {pg * perPage + 1}–{Math.min((pg + 1) * perPage, totalItems)} of {totalItems} entries</span>
              <div className="pg-nums">
                <button className="pgn-arr" disabled={pg === 0} onClick={() => setPg(pg-1)}>←</button>
                <button className="pgn-arr" disabled={(pg + 1) * perPage >= totalItems} onClick={() => setPg(pg+1)}>→</button>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}
