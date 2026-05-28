import React, { useState } from 'react';
import { LayoutDashboard, BarChart3, PieChart, TrendingUp, Flag } from 'lucide-react';
import { useData } from './DataContext';
import { filterEntries, computeTotalHrs, computeProjectHrs, computeEmployeeHrs, getColor, computeMissingTimesheets, getUniqueMonths, getUniqueWeeks, formatWeek } from './utils';
import FilterSelect from './FilterSelect';

export default function Overview() {
  const { entries } = useData();
  const [month, setMonth] = useState('all');
  const [week, setWeek] = useState('all');
  const [donutEmp, setDonutEmp] = useState('all');
  const [trendMonth, setTrendMonth] = useState('all');

  const uniqueMonths = getUniqueMonths(entries);
  
  // Filter available weeks based on selected month
  const availableWeeks = getUniqueWeeks(month === 'all' ? entries : filterEntries(entries, month, 'all'));

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(e.target.value);
    setWeek('all');
  };

  const filtered = filterEntries(entries, month, week);
  const totalHrs = computeTotalHrs(filtered);
  const wks = week === 'all' ? availableWeeks.length || 1 : 1;
  const avgHrs = Math.round(totalHrs / wks);
  
  const projHrs = computeProjectHrs(filtered);
  const maxProjHr = projHrs[0]?.hrs || 1;
  const activeProjs = projHrs.length;

  const missData = computeMissingTimesheets(entries, month);
  const problemCount = missData.length;

  // Donut data
  const donutFiltered = filterEntries(entries, month, week, donutEmp);
  const donutMap = computeProjectHrs(donutFiltered);
  const donutTotal = computeTotalHrs(donutFiltered) || 1;
  let off = 0;
  const C = 2 * Math.PI * 40;

  return (
    <div className="pg on">
      <div className="pgtitle"><LayoutDashboard size={24} className="text-[#185FA5]" />Manager overview</div>
      <div className="krow">
        <div className="kcard"><div className="kl">Total hours</div><div className="kv">{totalHrs}</div><div className="ks">{month === 'all' && week === 'all' ? 'All time' : 'Filtered'}</div></div>
        <div className="kcard blu"><div className="kl">Weekly avg</div><div className="kv">{avgHrs}h</div><div className="ks">Per week</div></div>
        <div className="kcard"><div className="kl">Active projects</div><div className="kv">{activeProjs}</div><div className="ks">Running</div></div>
        <div className="kcard red"><div className="kl">🚩 Problem entries</div><div className="kv">{problemCount}</div><div className="ks">Under hours</div></div>
      </div>
      <div className="row2">
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="ctitle">
            <BarChart3 size={20} className="text-slate-500 shrink-0" />
            <span className="ctitle-name">Working hours by project</span>
            <div className="cf">
              <label>Project</label>
              <FilterSelect 
                value={'all'} 
                onChange={()=>{}} 
                options={[{value: 'all', label: 'All'}, ...[...new Set(entries.map(e => e.project))].map(p => ({value: p, label: p}))]} 
              />
              <div className="fsep"></div>
              <label>Month</label>
              <FilterSelect 
                value={month} 
                onChange={val => { setMonth(val); setWeek('all'); }} 
                options={[{value: 'all', label: 'All'}, ...uniqueMonths.map(m => ({value: m, label: m}))]} 
              />
              <div className="fsep"></div>
              <label>Week</label>
              <FilterSelect 
                value={week} 
                onChange={setWeek} 
                options={[{value: 'all', label: 'All'}, ...availableWeeks.map(w => ({value: w, label: formatWeek(w)}))]} 
              />
            </div>
          </div>
          <div className="hbars" style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
            {projHrs.map((p, i) => (
              <div className="hbrow" key={p.name}>
                <span className="hblabel">{p.name}</span>
                <div className="hbtrack">
                  <div className="hbfill" style={{ width: `${Math.max(5, (p.hrs / maxProjHr) * 100)}%`, background: getColor(i) }}>{p.hrs}h</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0 }}>
          <div className="card">
            <div className="ctitle">
              <PieChart size={20} className="text-slate-500 shrink-0" />
              <span className="ctitle-name">Project hours</span>
              <div className="cf">
                <label>Employee</label>
                <FilterSelect 
                  value={donutEmp} 
                  onChange={setDonutEmp} 
                  options={[{value: 'all', label: 'All'}, ...[...new Set(entries.map(e => e.employee))].map(e => ({value: e, label: e}))]} 
                />
              </div>
            </div>
            <div className="donut-row">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="40" fill="none" stroke="var(--color-background-secondary)" strokeWidth="18" />
                {(() => {
                  const slices: {name: string, hrs: number, idx: number}[] = [];
                  let otherHrs = 0;
                  donutMap.forEach((p, i) => {
                    if ((p.hrs / donutTotal) < 0.05) {
                      otherHrs += p.hrs;
                    } else {
                      slices.push({ ...p, idx: i });
                    }
                  });
                  if (otherHrs > 0) slices.push({ name: 'Other', hrs: otherHrs, idx: donutMap.length });

                  let currentOff = 0;
                  return slices.map((p) => {
                    const dash = (p.hrs / donutTotal) * C;
                    const sliceOff = currentOff;
                    currentOff += dash;
                    const pct = Math.round((p.hrs / donutTotal) * 100) + '%';
                    return (
                      <g key={p.name}>
                        <circle cx="60" cy="60" r="40" fill="none" stroke={getColor(p.idx)} strokeWidth="18" strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-sliceOff} />
                        {(p.hrs / donutTotal) > 0.03 && (
                          <text
                            x={60 + 30 * Math.cos(2 * Math.PI * ((sliceOff + dash / 2) / C) - Math.PI / 2)}
                            y={60 + 30 * Math.sin(2 * Math.PI * ((sliceOff + dash / 2) / C) - Math.PI / 2)}
                            textAnchor="middle" dominantBaseline="central" fontSize="10" fill="#fff" fontWeight="bold" pointerEvents="none"
                          >
                            {pct}
                          </text>
                        )}
                      </g>
                    );
                  });
                })()}
                <text x="60" y="62" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="600" fill="var(--color-text-primary)">{donutTotal}h</text>
              </svg>
              <div className="leg" style={{ maxHeight: '120px', overflowY: 'auto', paddingRight: '4px' }}>
                {donutMap.map((p, i) => (
                  <div className="li" key={p.name}>
                    <div className="li-dot" style={{ background: getColor(i) }}></div>
                    <span style={{flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px'}}>{p.name}</span>
                    <span className="li-hrs">{p.hrs}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="ctitle">
              <TrendingUp size={20} className="text-slate-500 shrink-0" />
              <span className="ctitle-name">Weekly trend</span>
              <div className="cf">
                <label>Month</label>
                <FilterSelect 
                  value={trendMonth} 
                  onChange={setTrendMonth} 
                  options={[{value: 'all', label: 'All'}, ...uniqueMonths.map(m => ({value: m, label: m}))]} 
                />
              </div>
            </div>
            {/* Dynamic Trend Chart */}
            {(() => {
                const trendAvailableWeeks = getUniqueWeeks(trendMonth === 'all' ? entries : filterEntries(entries, trendMonth, 'all'));
                const wks = trendAvailableWeeks.length > 5 ? trendAvailableWeeks.slice(-5) : trendAvailableWeeks;
                const trendData = wks.map(wk => {
                    const kwEntries = filterEntries(entries, trendMonth, wk);
                    return computeTotalHrs(kwEntries);
                });
                const maxTrend = Math.max(...trendData, 1);
                
                return (
                    <>
                        <div className="trend">
                            {trendData.map((v, i) => (
                                <div key={i} className="tbar" style={{ height: `${Math.max(5, (v / maxTrend) * 100)}%`, background: getColor(i) }}>
                                    <span>{v}h</span>
                                </div>
                            ))}
                        </div>
                        <div className="xlabels">
                            {wks.map(w => {
                                const parseDate = new Date(w);
                                return <div key={w} className="xl">{parseDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</div>;
                            })}
                        </div>
                    </>
                );
            })()}
          </div>
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="ctitle"><Flag size={20} className="text-[#A32D2D] shrink-0" /><span className="ctitle-name text-[#A32D2D]">Latest missing / under-hours flags</span></div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table className="tbl">
                <thead><tr><th>Employee</th><th>Week</th><th>Project</th><th>Hours</th><th>Status</th></tr></thead>
                <tbody>
                  {missData.map((r, i) => (
                    <tr key={i}>
                      <td>{r.emp}</td><td>{r.week}</td><td>{r.proj}</td><td>{r.hrs}</td>
                      <td><span className={`badge b-org`}>Under Hours</span></td>
                    </tr>
                  ))}
                  {missData.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)' }}>No problem entries</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
