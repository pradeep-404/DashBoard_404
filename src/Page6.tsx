import React, { useState } from 'react';
import { UserCheck, Users } from 'lucide-react';
import { useData } from './DataContext';
import { filterEntries, computeTotalHrs, getColor, getUniqueMonths } from './utils';

export default function Page6() {
  const { entries } = useData();
  const [month, setMonth] = useState('all');
  const [projFilter, setProjFilter] = useState('all');
  const uniqueMonths = getUniqueMonths(entries);

  const filtered = filterEntries(entries, month, 'all');

  // Employee breakdown
  const emps = [...new Set(filtered.map(x=>x.employee))];

  return (
    <div className="pg on">
      <div className="pgtitle"><UserCheck size={24} className="text-[#185FA5]" />Employee → Projects</div>
      <div className="card" style={{ padding: '10px' }}>
        <div className="ctitle">
          <Users size={20} className="text-slate-500 shrink-0" />
          <span className="ctitle-name">Employee project breakdown</span>
          <div className="cf">
            <label>Month</label><select className="fsel" value={month} onChange={e=>setMonth(e.target.value)}><option value="all">All</option>{uniqueMonths.map(m=><option key={m} value={m}>{m}</option>)}</select>
            <div className="fsep"></div>
            <label>Project</label>
            <select className="fsel" value={projFilter} onChange={e => setProjFilter(e.target.value)}>
              <option value="all">All</option>
              {[...new Set(entries.map(x=>x.project))].map(x=><option key={x} value={x}>{x}</option>)}
            </select>
          </div>
        </div>
        <div style={{ overflowY: 'auto', maxHeight: '500px' }}>
            {emps.map((emp, i) => {
                const empEntries = filtered.filter(x => x.employee === emp);
                const projects = [...new Set(empEntries.map(x => x.project))];
                if (projFilter !== 'all' && !projects.includes(projFilter)) return null;

                const hrs = computeTotalHrs(empEntries);
                
                return (
                    <div key={emp} style={{ border: '1px solid var(--color-border-secondary)', borderRadius: '6px', padding: '10px', marginBottom: '10px', background: 'var(--color-background-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <div className="avatar" style={{ background: getColor(i), color: '#fff', width: '28px', height: '28px' }}>{emp.substring(0,2)}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 600 }}>{emp}</div>
                                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{projects.length} projects · {hrs}h total</div>
                            </div>
                        </div>
                        <div>
                            {projects.map((p, j) => {
                                const pHrs = computeTotalHrs(empEntries.filter(e => e.project === p));
                                return (
                                    <div key={p} style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '4px 0 4px 10px', fontSize: '11px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getColor(j) }}></div>
                                        <div style={{ flex: 1 }}>{p}</div>
                                        <div style={{ fontWeight: 600 }}>{pHrs}h</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
}
