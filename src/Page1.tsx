import React, { useState } from 'react';
import { FolderOpen, BarChart3, Grid } from 'lucide-react';
import { useData } from './DataContext';
import { filterEntries, computeProjectHrs, getMonthFromDate, getWeekFromDate, getColor, getUniqueMonths } from './utils';

export default function Page1() {
  const { entries } = useData();
  const [month, setMonth] = useState('all');
  const [pg, setPg] = useState(0);
  const perPage = 5;
  const uniqueMonths = getUniqueMonths(entries);

  const filtered = filterEntries(entries, month, 'all');
  const projMap = computeProjectHrs(filtered);
  const totalProjs = projMap.length;
  const slice = projMap.slice(pg * perPage, (pg + 1) * perPage);

  // Heatmap grouping
  // proj -> [w1 hrs, w2 hrs, w3 hrs, w4 hrs]
  const heatMapData = slice.map(p => {
    const projEntries = filtered.filter(e => e.project === p.name);
    const weeks = [0, 0, 0, 0];
    projEntries.forEach(e => {
        const wk = parseInt(getWeekFromDate(e.date), 10) - 1;
        if (wk >= 0 && wk < 4) {
            weeks[wk] += e.hours;
        }
    });
    return { name: p.name, total: p.hrs, weeks };
  });

  return (
    <div className="pg on">
      <div className="pgtitle"><FolderOpen size={16} className="text-[#185FA5]" />Per project hours</div>
      <div className="card">
        <div className="ctitle">
          <Grid size={13} className="text-slate-500 shrink-0" />
          <span className="ctitle-name">Heatmap — project × week</span>
          <div className="cf">
            <label>Month</label>
            <select className="fsel" value={month} onChange={e => {setMonth(e.target.value); setPg(0);}}>
              <option value="all">All</option>
              {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="heat-wrap">
          <table className="heat-tbl" style={{ width: '100%', fontSize: '11px' }}>
            <thead>
              <tr><th style={{ textAlign: 'left', paddingBottom: '6px' }}>Project</th><th>Wk 1</th><th>Wk 2</th><th>Wk 3</th><th>Wk 4</th><th>Total</th></tr>
            </thead>
            <tbody>
              {heatMapData.map((row, i) => (
                  <tr key={row.name}>
                      <td style={{ padding: '6px 4px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{row.name}</td>
                      {row.weeks.map((w, j) => (
                          <td key={j} style={{ textAlign: 'center' }}>
                              <span className="hcell" style={{ 
                                  background: w === 0 ? 'var(--color-background-secondary)' : `rgba(24, 95, 165, ${Math.max(0.2, w / 40)})`, 
                                  color: w > 20 ? '#fff' : 'var(--color-text-primary)' 
                              }}>
                                  {w}h
                              </span>
                          </td>
                      ))}
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.total}h</td>
                  </tr>
              ))}
              {heatMapData.length === 0 && <tr><td colSpan={6} style={{textAlign: 'center', padding: '10px'}}>No data</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="pg-bar">
          <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Showing {pg * perPage + 1}–{Math.min((pg + 1) * perPage, totalProjs)} of {totalProjs} projects</span>
          <div className="pg-nums">
            <button className="pgn-arr" disabled={pg === 0} onClick={() => setPg(pg-1)}>←</button>
            <button className="pgn-arr" disabled={(pg + 1) * perPage >= totalProjs} onClick={() => setPg(pg+1)}>→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
