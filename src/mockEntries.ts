export interface TimeEntry {
  date: string;
  employee: string;
  project: string;
  hours: number;
  task: string;
  status: string;
  remarks: string;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEntries(): TimeEntry[] {
  const emps = ['Pradeep', 'Amit', 'Rohit', 'Sneha', 'Karan', 'Pooja', 'Rahul', 'Neha', 'Arjun'];
  const projs = ['HR Portal', 'Mobile App', 'ERP Integration', 'Website Revamp', 'CRM System', 'AI Analytics', 'Data Dashboard', 'Client Portal', 'Inventory Sys', 'Marketing Web'];
  const tasks = ['Frontend', 'Backend', 'API', 'Testing', 'DB Setup', 'Bug Fix', 'Design', 'Code Review'];
  const dates = [
    '2026-01-05', '2026-01-12', '2026-01-19', '2026-01-26',
    '2026-02-02', '2026-02-09', '2026-02-16', '2026-02-23'
  ];
  
  const entries: TimeEntry[] = [];
  for (const date of dates) {
    for (const emp of emps) {
      // 1 or 2 projects per week per employee
      const numProjs = randInt(1, 2);
      let weeklyHrs = 0;
      for (let i = 0; i < numProjs; i++) {
        const proj = projs[randInt(0, projs.length - 1)];
        const hrs = randInt(10, 25);
        weeklyHrs += hrs;
        entries.push({
          date,
          employee: emp,
          project: proj,
          hours: hrs,
          task: tasks[randInt(0, tasks.length - 1)],
          status: weeklyHrs < 35 ? 'Pending' : 'Completed',
          remarks: ''
        });
      }
    }
  }
  return entries;
}

export const INITIAL_ENTRIES = generateEntries();
