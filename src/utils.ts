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

export function filterEntries(entries: TimeEntry[], month: string, week: string, emp: string = 'all', proj: string = 'all') {
  return entries.filter(e => {
    // If specific week is selected, ignore the month filter to show the complete overlapping week
    if (week !== 'all') {
      if (getWeekFromDate(e.date) !== week) return false;
    } else {
      if (month !== 'all' && getMonthFromDate(e.date) !== month) return false;
    }
    
    if (emp !== 'all' && e.employee !== emp) return false;
    if (proj !== 'all' && e.project !== proj) return false;
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
  const arr = Object.entries(map).map(([name, hrs]) => ({ name, hrs }));
  arr.sort((a, b) => b.hrs - a.hrs);
  return arr;
}

// Group by Employee
export function computeEmployeeHrs(entries: TimeEntry[]) {
  const map: Record<string, number> = {};
  entries.forEach(e => {
    map[e.employee] = (map[e.employee] || 0) + e.hours;
  });
  const arr = Object.entries(map).map(([name, hrs]) => ({ name, hrs }));
  arr.sort((a, b) => b.hrs - a.hrs);
  return arr;
}

// Compute miss (Under hours < 35 per week or Missing Entries)
export function computeMissingTimesheets(entries: TimeEntry[], month: string) {
  const filtered = month === 'all' ? entries : entries.filter(e => getMonthFromDate(e.date) === month);
  
  const miss: Array<{ emp: string, week: string, proj: string, hrs: number, flag: string, missingDates?: string }> = [];
  
  const emps = [...new Set(filtered.map(e => e.employee))];
  const dates = [...new Set(filtered.map(e => e.date))].sort();
  if (dates.length === 0) return miss;

  const start = new Date(dates[0]);
  const end = new Date(dates[dates.length - 1]);
  const allDays: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      allDays.push(d.toISOString().split('T')[0]);
    }
  }

  const grouped: Record<string, Record<string, { hrs: number, proj: string }>> = {};
  emps.forEach(emp => { grouped[emp] = {}; });

  filtered.forEach(e => {
    const w = formatWeek(getWeekFromDate(e.date));
    if (!grouped[e.employee][w]) grouped[e.employee][w] = { hrs: 0, proj: e.project };
    grouped[e.employee][w].hrs += e.hours;
    if (!grouped[e.employee][w].proj.includes(e.project)) {
      grouped[e.employee][w].proj += ', ' + e.project;
    }
  });

  emps.forEach(emp => {
     const empDates = new Set(filtered.filter(e => e.employee === emp).map(e => e.date));
     const missingDays = allDays.filter(d => !empDates.has(d));
     const missingByWeek: Record<string, string[]> = {};
     
     missingDays.forEach(d => {
        if (month !== 'all' && getMonthFromDate(d) !== month) return;
        const w = formatWeek(getWeekFromDate(d));
        if (!missingByWeek[w]) missingByWeek[w] = [];
        missingByWeek[w].push(d);
     });
     
     for (const [w, wData] of Object.entries(grouped[emp] || {})) {
         if (wData.hrs < 35) {
            miss.push({ emp, week: w, proj: wData.proj, hrs: wData.hrs, flag: 'Under Hours' });
         }
     }
     
     for (const [w, mDays] of Object.entries(missingByWeek)) {
         miss.push({ emp, week: w, proj: '—', hrs: 0, flag: 'Missing Entry', missingDates: mDays.join(', ') });
     }
  });
  
  return miss;
}

export const COLORS = ['#185FA5', '#0F6E56', '#534AB7', '#993C1D', '#854F0B', '#1D9E75', '#3C3489', '#D85A30', '#639922', '#7B3F8C'];
export function getColor(i: number) {
  return COLORS[i % COLORS.length];
}
