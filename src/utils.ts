import { TimeEntry } from './mockEntries';

export function getMonthFromDate(dateStr: string) {
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`; // e.g., '2026-01'
  }
  return 'other';
}

export function getUniqueMonths(entries: TimeEntry[]) {
  const months = new Set<string>();
  entries.forEach(e => {
    const m = getMonthFromDate(e.date);
    if (m !== 'other') months.add(m);
  });
  return Array.from(months).sort().reverse();
}

export function getCalendarWeekStart(dateStr: string) {
  const [yy, mm, dd] = dateStr.split('-').map(Number);
  const d = new Date(yy, mm - 1, dd);
  const day = d.getDay();
  // getDay() gives 0 for Sun, 1 for Mon. We want Monday as start.
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diffToMonday);
  monday.setHours(0, 0, 0, 0);
  // Ensure we format as YYYY-MM-DD in local time
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const date = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export function formatWeek(mondayStr: string) {
  if (mondayStr === 'all') return 'All Weeks';
  // Use parsing without timezone shifting
  const [yy, mm, dd] = mondayStr.split('-').map(Number);
  const m = new Date(yy, mm - 1, dd);
  const s = new Date(yy, mm - 1, dd + 6);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${m.toLocaleDateString('en-US', options)} - ${s.toLocaleDateString('en-US', options)}`;
}

export function getWeekFromDate(dateStr: string) {
  return getCalendarWeekStart(dateStr);
}

export function getUniqueWeeks(entries: TimeEntry[]) {
  const weeks = new Set<string>();
  entries.forEach(e => weeks.add(getWeekFromDate(e.date)));
  return Array.from(weeks).sort();
}

export function filterEntries(entries: TimeEntry[], month: string, week: string, emp: string = 'all', proj: string = 'all', projectType: string = 'all') {
  return entries.filter(e => {
    // If specific week is selected, ignore the month filter to show the complete overlapping week
    if (week !== 'all') {
      if (getWeekFromDate(e.date) !== week) return false;
    } else {
      if (month !== 'all' && getMonthFromDate(e.date) !== month) return false;
    }
    
    if (emp !== 'all' && e.employee !== emp) return false;
    if (proj !== 'all' && e.project !== proj) return false;
    if (projectType !== 'all' && e.projectType !== projectType) return false;
    return true;
  });
}

// Compute total hours
export function computeTotalHrs(entries: TimeEntry[]) {
  return entries.reduce((s, e) => s + e.hours, 0);
}

// Compute project grouping
export function computeProjectHrs(entries: TimeEntry[]) {
  const map: Record<string, number> = {};
  entries.forEach(e => {
    map[e.project] = (map[e.project] || 0) + e.hours;
  });
  const arr = Object.entries(map).map(([name, hrs]) => ({ name, hrs })).filter(p => p.hrs > 0);
  arr.sort((a, b) => b.hrs - a.hrs);
  return arr;
}

// Compute project type grouping
export function computeProjectTypeHrs(entries: TimeEntry[]) {
  const map: Record<string, number> = {};
  entries.forEach(e => {
    const pt = e.projectType || 'Unknown Type';
    map[pt] = (map[pt] || 0) + e.hours;
  });
  const arr = Object.entries(map).map(([name, hrs]) => ({ name, hrs })).filter(p => p.hrs > 0);
  arr.sort((a, b) => b.hrs - a.hrs);
  return arr;
}

// Group by Employee
export function computeEmployeeHrs(entries: TimeEntry[]) {
  const map: Record<string, number> = {};
  entries.forEach(e => {
    map[e.employee] = (map[e.employee] || 0) + e.hours;
  });
  const arr = Object.entries(map).map(([name, hrs]) => ({ name, hrs })).filter(p => p.hrs > 0);
  arr.sort((a, b) => b.hrs - a.hrs);
  return arr;
}

// Compute miss (Under hours < expected or Missing Entries)
export function computeMissingTimesheets(entries: TimeEntry[], month: string) {
  const filtered = month === 'all' ? entries : entries.filter(e => getMonthFromDate(e.date) === month);
  
  const miss: Array<{ emp: string, week: string, proj: string, hrs: number, flag: string, missingDates?: string }> = [];
  
  const emps = [...new Set(filtered.map(e => e.employee))];
  const dates = [...new Set(filtered.map(e => e.date))].sort();
  if (dates.length === 0) return miss;

  const startD = new Date(dates[0]);
  const endD = new Date(dates[dates.length - 1]);
  const start = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate());
  const end = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate());

  const groupedByEmpDate: Record<string, Record<string, TimeEntry[]>> = {};
  emps.forEach(emp => { groupedByEmpDate[emp] = {}; });
  filtered.forEach(e => {
    if (!groupedByEmpDate[e.employee][e.date]) groupedByEmpDate[e.employee][e.date] = [];
    groupedByEmpDate[e.employee][e.date].push(e);
  });

  emps.forEach(emp => {
    let curr = new Date(start);
    const weeklyData: Record<string, { hrs: number, holidayDays: number, leaveDays: number, proj: string }> = {};
    const weeklyMissingDays: Record<string, string[]> = {};
    const weeklyUnderDays: Record<string, {date: string, hrs: number}[]> = {};
    
    while (curr <= end) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dStr = `${curr.getFullYear()}-${pad(curr.getMonth() + 1)}-${pad(curr.getDate())}`;
      
      if (month !== 'all' && getMonthFromDate(dStr) !== month) {
         curr.setDate(curr.getDate() + 1);
         continue;
      }
      
      const wStr = formatWeek(getWeekFromDate(dStr));
      if (!weeklyData[wStr]) weeklyData[wStr] = { hrs: 0, holidayDays: 0, leaveDays: 0, proj: '' };
      
      const dayEntries = groupedByEmpDate[emp][dStr] || [];
      const dayHrs = dayEntries.reduce((sum, e) => sum + e.hours, 0);
      weeklyData[wStr].hrs += dayHrs;
      
      dayEntries.forEach(e => {
        if (!weeklyData[wStr].proj.includes(e.project) && e.project && e.project !== 'Unknown') {
            weeklyData[wStr].proj += (weeklyData[wStr].proj ? ', ' : '') + e.project;
        }
      });
      
      const isLeave = dayEntries.some(e => (e.remarks || '').toLowerCase().includes('leave'));
      const isHoliday = dayEntries.some(e => (e.remarks || '').toLowerCase().includes('holiday'));
      
      if (isLeave) weeklyData[wStr].leaveDays++;
      if (isHoliday) weeklyData[wStr].holidayDays++;
      
      const isWeekend = (curr.getDay() === 0 || curr.getDay() === 6);
      
      if (!isWeekend) {
          if (dayHrs === 0 && !isLeave && !isHoliday) {
              if (!weeklyMissingDays[wStr]) weeklyMissingDays[wStr] = [];
              weeklyMissingDays[wStr].push(dStr.slice(-5));
          } else if (dayHrs > 0 && dayHrs < 8 && !isLeave && !isHoliday) {
              if (!weeklyUnderDays[wStr]) weeklyUnderDays[wStr] = [];
              weeklyUnderDays[wStr].push({date: dStr.slice(-5), hrs: dayHrs});
          }
      }
      curr.setDate(curr.getDate() + 1);
    }
    
    for (const [w, wData] of Object.entries(weeklyData)) {
       let addedDailyFlag = false;
       if (weeklyMissingDays[w] && weeklyMissingDays[w].length > 0) {
           miss.push({ emp, week: w, proj: '—', hrs: 0, flag: 'Missing Entry', missingDates: weeklyMissingDays[w].join(', ') });
           addedDailyFlag = true;
       }
       if (weeklyUnderDays[w] && weeklyUnderDays[w].length > 0) {
           miss.push({ 
               emp, week: w, proj: wData.proj || '—', 
               hrs: weeklyUnderDays[w].reduce((sum, item) => sum + item.hrs, 0), 
               flag: 'Under Hrs (Day)', 
               missingDates: weeklyUnderDays[w].map(item => `${item.date} (${item.hrs}h)`).join(', ') 
           });
           addedDailyFlag = true;
       }
       
       const expectedWeekly = 40 - (wData.holidayDays * 8);
       // Only add weekly under hours flag if we didn't already flag daily missing/under hours to reduce noise
       if (wData.hrs < expectedWeekly && !addedDailyFlag) {
           miss.push({ emp, week: w, proj: wData.proj || '—', hrs: wData.hrs, flag: 'Under Hrs (Week)' });
       } else if (wData.hrs < expectedWeekly && wData.leaveDays > 0) {
           // Wait, if they have leave, user said "show under hour by week only". 
           // If they have missing entry AND leave, we show all flags for completeness.
           miss.push({ emp, week: w, proj: wData.proj || '—', hrs: wData.hrs, flag: 'Under Hrs (Week)' });
       }
    }
  });
  
  return miss;
}

export const COLORS = ['#185FA5', '#0F6E56', '#534AB7', '#993C1D', '#854F0B', '#1D9E75', '#3C3489', '#D85A30', '#639922', '#7B3F8C'];
export function getColor(i: number) {
  return COLORS[i % COLORS.length];
}
