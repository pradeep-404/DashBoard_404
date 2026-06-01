import React, { useState } from 'react';
import { FolderOpen, BarChart3, Grid } from 'lucide-react';
import { useData } from './DataContext';
import { filterEntries, computeProjectHrs, getWeekFromDate, getColor, getUniqueMonths, getUniqueWeeks } from './utils';

import FilterSelect from './FilterSelect';

export default function Page1() {
  const { entries } = useData();
  const [month, setMonth] = useState('all');
  const [pg, setPg] = useState(0);
  const perPage = 10;
  const uniqueMonths = getUniqueMonths(entries);

  const filtered = filterEntries(entries, month, 'all');
  const projMap = computeProjectHrs(filtered);
  const totalProjs = projMap.length;
  const slice = projMap.slice(pg * perPage, (pg + 1) * perPage);

  const uniqueWeeks = getUniqueWeeks(filtered);

  // Heatmap grouping
  // proj -> [w1 hrs, w2 hrs... dynamically based on uniqueWeeks]
  const heatMapData = slice.map(p => {
    const projEntries = filtered.filter(e => e.project === p.name);
    const weeksList = uniqueWeeks.map(wStr => {
        return projEntries.filter(e => getWeekFromDate(e.date) === wStr).reduce((s, e) => s + e.hours, 0);
    });
    return { name: p.name, total: p.hrs, weeks: weeksList };
  });

  return (
    <div className="pg on">
      <div className="pgtitle"><FolderOpen size={24} className="text-[#185FA5]" />Per project hours</div>
      <div className="card">
        <div className="ctitle">
          <Grid size={20} className="text-slate-500 shrink-0" />
          <span className="ctitle-name">Heatmap — project × week</span>
          <div className="cf">
            <label>Month</label>
            <FilterSelect 
              value={month} 
              onChange={val => {setMonth(val); setPg(0);}} 
              options={[{value: 'all', label: 'All'}, ...uniqueMonths.map(m => ({value: m, label: m}))]} 
            />
          </div>
        </div>
        <div className="heat-wrap" style={{ overflowX: 'auto' }}>
          <table className="heat-tbl" style={{ width: '100%', fontSize: '11px', minWidth: '400px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', paddingBottom: '6px' }}>Project</th>
                {uniqueWeeks.map((wStr, i) => (
                  <th key={wStr} style={{ paddingBottom: '6px' }}>
                    Wk {new Date(wStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </th>
                ))}
                <th style={{ paddingBottom: '6px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {heatMapData.map((row, rowIndex) => {
                  const baseHex = getColor(rowIndex + pg * perPage);
                  const r = parseInt(baseHex.substring(1, 3), 16);
                  const g = parseInt(baseHex.substring(3, 5), 16);
                  const b = parseInt(baseHex.substring(5, 7), 16);
                  
                  return (
                      <tr key={row.name}>
                          <td style={{ padding: '6px 4px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{row.name}</td>
                          {row.weeks.map((w, j) => (
                              <td key={j} style={{ textAlign: 'center' }}>
                                  <span className="hcell" style={{ 
                                      background: w === 0 ? 'var(--color-background-secondary)' : `rgba(${r}, ${g}, ${b}, ${Math.max(0.2, w / 40)})`, 
                                      color: w > 20 ? '#fff' : 'var(--color-text-primary)' 
                                  }}>
                                      {w > 0 ? `${w}h` : '—'}
                                  </span>
                              </td>
                          ))}
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.total}h</td>
                      </tr>
                  )
              })}
              {heatMapData.length === 0 && <tr><td colSpan={uniqueWeeks.length + 2} style={{textAlign: 'center', padding: '10px'}}>No data</td></tr>}
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
