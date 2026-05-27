import React, { useState } from 'react';
import { Table, Grid } from 'lucide-react';
import { useData } from './DataContext';
import { filterEntries, computeEmployeeHrs, computeProjectHrs, getUniqueMonths } from './utils';

export default function Page2() {
  const { entries } = useData();
  const [month, setMonth] = useState('all');
  const uniqueMonths = getUniqueMonths(entries);

  const filtered = filterEntries(entries, month, 'all');
  const employees = computeEmployeeHrs(filtered).map(e => e.name);
  const projects = computeProjectHrs(filtered).map(p => p.name).slice(0, 6); // Max 6 cols for fit

  const heatMapData = employees.map(emp => {
      const row = { emp, total: 0, projs: {} as Record<string, number> };
      projects.forEach(p => row.projs[p] = 0);
      filtered.forEach(e => {
          if (e.employee === emp) {
              row.total += e.hours;
              if (row.projs[e.project] !== undefined) {
                  row.projs[e.project] += e.hours;
              }
          }
      });
      return row;
  });

  return (
    <div className="pg on">
      <div className="pgtitle"><Table size={24} className="text-[#185FA5]" />Project × employee</div>
      <div className="card">
        <div className="ctitle">
          <Grid size={20} className="text-slate-500 shrink-0" />
          <span className="ctitle-name">Hours heatmap — employee × project (Top 6 projects)</span>
          <div className="cf">
            <label>Month</label>
            <select className="fsel" value={month} onChange={e => setMonth(e.target.value)}>
                <option value="all">All</option>
                {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="heat-wrap">
          <table className="heat-tbl" style={{ width: '100%', fontSize: '11px' }}>
            <thead>
              <tr>
                  <th style={{ textAlign: 'left', paddingBottom: '6px' }}>Employee</th>
                  {projects.map(p => <th key={p}>{p}</th>)}
                  <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {heatMapData.map((row, i) => (
                  <tr key={row.emp}>
                      <td style={{ padding: '6px 4px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{row.emp}</td>
                      {projects.map(p => {
                          const w = row.projs[p];
                          return (
                              <td key={p} style={{ textAlign: 'center' }}>
                                  <span className="hcell" style={{ 
                                      background: w === 0 ? 'var(--color-background-secondary)' : `rgba(24, 95, 165, ${Math.max(0.2, w / 40)})`, 
                                      color: w > 20 ? '#fff' : (w === 0 ? 'transparent' : 'var(--color-text-primary)') 
                                  }}>
                                      {w > 0 ? `${w}h` : '—'}
                                  </span>
                              </td>
                          );
                      })}
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.total}h</td>
                  </tr>
              ))}
              {heatMapData.length === 0 && <tr><td colSpan={projects.length + 2} style={{textAlign: 'center', padding: '10px'}}>No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
