import React, { useState } from 'react';
import { LayoutDashboard, BarChart3, PieChart, TrendingUp, Flag } from 'lucide-react';
import { useData } from './DataContext';
import { filterEntries, computeTotalHrs, computeProjectHrs, computeEmployeeHrs, getColor, computeMissingTimesheets, getUniqueMonths } from './utils';

export default function Overview() {
  const { entries } = useData();
  const [month, setMonth] = useState('all');
  const [week, setWeek] = useState('all');
  const [donutEmp, setDonutEmp] = useState('all');
  const [trendMonth, setTrendMonth] = useState('all');

  const uniqueMonths = getUniqueMonths(entries);

  const filtered = filterEntries(entries, month, week);
  const totalHrs = computeTotalHrs(filtered);
  const wks = month === 'all' && week === 'all' ? 8 : (week === 'all' ? 4 : 1);
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
  const C = 2 * Math.PI * 25;

  return (
    <div className="pg on">
      <div className="pgtitle"><LayoutDashboard size={16} className="text-[#185FA5]" />Manager overview</div>
      <div className="krow">
        <div className="kcard"><div className="kl">Total hours</div><div className="kv">{totalHrs}</div><div className="ks">{month === 'all' && week === 'all' ? 'All time' : 'Filtered'}</div></div>
        <div className="kcard blu"><div className="kl">Weekly avg</div><div className="kv">{avgHrs}h</div><div className="ks">Per week</div></div>
        <div className="kcard"><div className="kl">Active projects</div><div className="kv">{activeProjs}</div><div className="ks">Running</div></div>
        <div className="kcard red"><div className="kl">🚩 Problem entries</div><div className="kv">{problemCount}</div><div className="ks">Under hours</div></div>
      </div>
      <div className="row2">
        <div className="card">
          <div className="ctitle">
            <BarChart3 size={13} className="text-slate-500 shrink-0" />
            <span className="ctitle-name">Working hours by project</span>
            <div className="cf">
              <label>Month</label>
              <select className="fsel" value={month} onChange={e => setMonth(e.target.value)}>
                <option value="all">All</option>
                {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="fsep"></div>
              <label>Week</label>
              <select className="fsel" value={week} onChange={e => setWeek(e.target.value)}>
                <option value="all">All</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>
              </select>
            </div>
          </div>
          <div className="hbars">
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
          <div className="card">
            <div className="ctitle">
              <PieChart size={13} className="text-slate-500 shrink-0" />
              <span className="ctitle-name">Project hours</span>
              <div className="cf">
                <label>Employee</label>
                <select className="fsel" value={donutEmp} onChange={e => setDonutEmp(e.target.value)}>
                  <option value="all">All</option>
                  {[...new Set(entries.map(e => e.employee))].map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
            <div className="donut-row">
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="25" fill="none" stroke="var(--color-background-secondary)" strokeWidth="12" />
                {donutMap.map((p, i) => {
                  const dash = (p.hrs / donutTotal) * C;
                  const el = <circle key={p.name} cx="36" cy="36" r="25" fill="none" stroke={getColor(i)} strokeWidth="12" strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-off} />;
                  off += dash;
                  return el;
                })}
                <text x="36" y="39" textAnchor="middle" fontSize="9" fontWeight="500" fill="var(--color-text-primary)">{donutTotal}h</text>
              </svg>
              <div className="leg">
                {donutMap.slice(0, 5).map((p, i) => (
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
              <TrendingUp size={13} className="text-slate-500 shrink-0" />
              <span className="ctitle-name">Weekly trend</span>
              <div className="cf">
                <label>Month</label>
                <select className="fsel" value={trendMonth} onChange={e => setTrendMonth(e.target.value)}>
                  <option value="all">All</option>
                  {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            {/* Dynamic Trend Chart */}
            {(() => {
                const wks = ['1', '2', '3', '4'];
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
                            {wks.map(w => <div key={w} className="xl">Wk {w}</div>)}
                        </div>
                    </>
                );
            })()}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="ctitle"><Flag size={13} className="text-[#A32D2D] shrink-0" /><span className="ctitle-name text-[#A32D2D]">Latest missing / under-hours flags</span></div>
        <table className="tbl">
          <thead><tr><th>Employee</th><th>Week</th><th>Project</th><th>Hours</th><th>Status</th></tr></thead>
          <tbody>
            {missData.slice(0, 3).map((r, i) => (
              <tr key={i}>
                <td>{r.emp}</td><td>{r.week}</td><td>{r.proj}</td><td>{r.hrs}</td>
                <td><span className={`badge b-org`}>Under Hours</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
