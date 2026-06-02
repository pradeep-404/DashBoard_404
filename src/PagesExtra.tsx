import React, { useState } from 'react';
import { Users, BarChart3, FileText, ListIcon, Download, Flag, UserCheck, Grid } from 'lucide-react';
import { useData } from './DataContext';
import { filterEntries, computeEmployeeHrs, getColor, computeMissingTimesheets, getUniqueMonths, getUniqueDates } from './utils';
import FilterSelect from './FilterSelect';

export function Page3() {
  const { entries } = useData();
  const [month, setMonth] = useState('all');
  const [date, setDate] = useState('all');
  const uniqueMonths = getUniqueMonths(entries);
  
  // Get available dates for the selected month to populate the Date dropdown
  const availableDates = getUniqueDates(month === 'all' ? entries : filterEntries(entries, month, 'all'));

  const filtered = filterEntries(entries, month, 'all', 'all', 'all', 'all', date);
  const empMapRaw = computeEmployeeHrs(filtered);
  const allEmployees = Array.from(new Set<string>(entries.map(e => e.employee)));
  const empMap = allEmployees.map(emp => {
      const existing = empMapRaw.find(e => e.name === emp);
      return existing ? existing : { name: emp, hrs: 0 };
  }).sort((a, b) => b.hrs - a.hrs);
  const maxHr = empMap[0]?.hrs || 1;

  return (
    <div className="pg on">
      <div className="pgtitle"><Users size={24} className="text-[#185FA5]" />Employee hours</div>
      <div className="card">
        <div className="ctitle"><BarChart3 size={20} className="text-slate-500 shrink-0" /><span className="ctitle-name">Total hours per employee</span>
        <div className="cf">
            <label>Month</label>
            <FilterSelect value={month} onChange={(v) => {setMonth(v); setDate('all');}} options={[{value:'all',label:'All'}, ...uniqueMonths.map(m=>({value:m,label:m}))]} />
            <div className="fsep"></div>
            <label>Date</label>
            <FilterSelect value={date} onChange={setDate} options={[{value:'all',label:'All'}, ...availableDates.map(d=>({value:d,label:d}))]} />
        </div>
        </div>
        <div className="hbars" style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '12px' }}>
          {empMap.map((e, i) => (
              <div className="hbrow" key={e.name}>
                  <span className="hblabel">{e.name}</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="hbtrack">
                          <div className="hbfill" style={{ width: `${Math.max(1, (e.hrs/maxHr)*100)}%`, background: getColor(i), paddingLeft: 0 }}></div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', width: '35px' }}>{e.hrs}h</span>
                  </div>
              </div>
          ))}
          {empMap.length === 0 && <div style={{textAlign: 'center', color: 'var(--color-text-secondary)', padding: '20px'}}>No data available for the selected filters.</div>}
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
      <div className="pgtitle"><FileText size={24} className="text-[#185FA5]" />Timesheet detail</div>
      <div className="card">
        <div className="ctitle">
          <ListIcon size={20} className="text-slate-500 shrink-0" />
          <span className="ctitle-name">All entries</span>
          <div className="cf">
            <label>Month</label><FilterSelect value={month} onChange={v=>{setMonth(v); setPg(0);}} options={[{value:'all',label:'All'}, ...uniqueMonths.map(m=>({value:m,label:m}))]} />
            <div className="fsep"></div>
            <label>Employee</label><FilterSelect value={emp} onChange={v=>{setEmp(v); setPg(0);}} options={[{value:'all',label:'All'}, ...Array.from(new Set<string>(entries.map(x=>x.employee))).map(x=>({value:x,label:x}))]} />
            <div className="fsep"></div>
            <label>Project</label><FilterSelect value={proj} onChange={v=>{setProj(v); setPg(0);}} options={[{value:'all',label:'All'}, ...Array.from(new Set<string>(entries.map(x=>x.project))).map(x=>({value:x,label:x}))]} />
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
  const [empFilter, setEmpFilter] = useState('all');
  const [pg, setPg] = useState(0);
  const perPage = 20;

  const uniqueMonths = getUniqueMonths(entries);
  let missData = computeMissingTimesheets(entries, month);
  
  if (statusFilter !== 'all') {
      if (statusFilter === 'Under Hours') {
          missData = missData.filter(m => m.flag.includes('Under Hrs'));
      } else {
          missData = missData.filter(m => m.flag === statusFilter);
      }
  }
  if (empFilter !== 'all') {
      missData = missData.filter(m => m.emp === empFilter);
  }
  
  const totalItems = missData.length;
  const slice = missData.slice(pg * perPage, (pg + 1) * perPage);
  
  return (
    <div className="pg on">
      <div className="pgtitle"><Flag size={24} className="text-[#185FA5]" />Missing timesheets</div>
      <div className="card">
        <div className="ctitle">
          <Flag size={20} className="text-[#A32D2D] shrink-0" />
          <span className="ctitle-name text-[#A32D2D]">Problem entries — Missing Days & Under 35 hours/week</span>
          <div className="cf">
            <label>Month</label>
            <FilterSelect value={month} onChange={v=>{setMonth(v); setPg(0);}} options={[{value:'all',label:'All'}, ...uniqueMonths.map(m=>({value:m,label:m}))]} />
            <div className="fsep"></div>
            <label>Employee</label>
            <FilterSelect value={empFilter} onChange={v=>{setEmpFilter(v); setPg(0);}} options={[{value:'all',label:'All'}, ...Array.from(new Set<string>(entries.map(x=>x.employee))).map(e=>({value:e,label:e}))]} />
            <div className="fsep"></div>
            <label>Status</label>
            <FilterSelect value={statusFilter} onChange={v=>{setStatusFilter(v); setPg(0);}} options={[{value:'all',label:'All'}, {value:'Missing Entry',label:'Missing Entry'}, {value:'Under Hours',label:'Under Hours'}]} />
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
