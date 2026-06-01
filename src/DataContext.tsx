import React, { createContext, useContext, useState, useMemo } from 'react';
import { TimeEntry, INITIAL_ENTRIES } from './mockEntries';
import * as xlsx from 'xlsx';

interface DataContextType {
  entries: TimeEntry[];
  setEntries: (e: TimeEntry[]) => void;
  loadExcel: (file: File) => Promise<number>;
  syncFromZoho: () => Promise<void>;
  loading: boolean;
  syncing: boolean;
  toastMsg: { msg: string, type: 'success' | 'error' } | null;
  setToastMsg: (t: { msg: string, type: 'success' | 'error' } | null) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

export const DataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [entries, setEntries] = useState<TimeEntry[]>(INITIAL_ENTRIES);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    fetch('/api/entries')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          // ALWAYS set entries from backend to clear mock data, 
          // but we can preserve mock data initially if backend is totally empty?
          // The user specifically requested 0 entries should show 0.
          if (data.length > 0 || (typeof window !== 'undefined' && localStorage.getItem('has_synced'))) {
            setEntries(data);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load from backend:', err);
        setLoading(false);
      });
  }, []);

  const saveEntriesToBackend = async (newEntries: TimeEntry[]) => {
    try {
      localStorage.setItem('has_synced', 'true');
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntries)
      });
    } catch (e) {
      console.error('Failed to save to backend:', e);
    }
  };

  const syncFromZoho = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/zoho-sync');
      if (!res.ok) {
        throw new Error(await res.text());
      }
      
      const filename = res.headers.get('x-filename') || 'remote_sync.xlsx';
      const blob = await res.blob();
      // create a file from the blob
      const file = new File([blob], filename, { type: res.headers.get('content-type') || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const count = await loadExcel(file);
      if (count >= 0) {
        setToastMsg({ msg: `Successfully synced ${count} entries from Remote Sheet.`, type: 'success' });
      }
    } catch (e: any) {
      console.error(e);
      setToastMsg({ msg: `Failed to sync: ${e.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const loadExcel = async (file: File): Promise<number> => {
    return new Promise<number>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = xlsx.read(data, { type: 'array' });
          const newEntries: TimeEntry[] = [];
          
          const projectTypes: Record<string, string> = {};
          
          // First pass: look for main sheet to extract project types
          const mainSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('main'));
          if (mainSheetName) {
            const msJson = xlsx.utils.sheet_to_json<any>(workbook.Sheets[mainSheetName], { raw: false });
            msJson.forEach((row: any) => {
               const pName = row['Project Name'] || row['project name'] || row['Project'] || row['project'];
               const pType = row['Project Type'] || row['project type'] || row['Type'] || row['type'];
               if (pName && pType) {
                 projectTypes[pName.trim().toLowerCase()] = pType.trim();
               }
            });
          }

          for (const sheetName of workbook.SheetNames) {
            if (sheetName.toLowerCase().includes('main') || sheetName.toLowerCase().includes('master')) continue;
            
            const sheet = workbook.Sheets[sheetName];
            const json = xlsx.utils.sheet_to_json<any>(sheet, { raw: false });
            
            json.forEach((row: any) => {
              const getVal = (keys: string[]) => {
                const lowerRow = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), String(v).trim()]));
                for (const k of keys) {
                  if (lowerRow[k] !== undefined && lowerRow[k] !== 'undefined') return lowerRow[k];
                }
                return undefined;
              };

              let dateStr = getVal(['date', 'data']);
              if (!dateStr) return; // skip rows without dates
              
              let parsedDate = new Date(dateStr);
              let dt = dateStr; // fallback if invalid date format
              if (!isNaN(parsedDate.getTime())) {
                const pad = (n: number) => n.toString().padStart(2, '0');
                let y = parsedDate.getFullYear();
                if (y < 100) y += 2000;
                else if (y < 2000 || y > 2100) y = new Date().getFullYear();
                dt = `${y}-${pad(parsedDate.getMonth() + 1)}-${pad(parsedDate.getDate())}`;
              }

              const projName = getVal(['project name', 'project', 'proj', 'project id', 'proj id']);
              const isProjUnknown = !projName;
              
              const taskStr = getVal(['task', 'description']);
              const explicitEmp = getVal(['employee', 'employee name', 'name', 'emp name']);
              const statusStr = getVal(['status', 'staus']);
              const remarksStr = getVal(['remarks', 'notes', 'remake']);

              const hrsStr = getVal(['hours worked', 'hours', 'hrs', 'time']);
              let parsedHrs = 0;
              if (hrsStr !== undefined && hrsStr !== '') {
                const parsed = parseFloat(hrsStr);
                if (!isNaN(parsed)) parsedHrs = parsed;
              } else if (isProjUnknown && !explicitEmp && !taskStr) {
                return; // skip rows with no hours, no project, no task, and no explicit employee
              }

              const isLeaveEntry = (remarksStr || '').toLowerCase().includes('leave') || (remarksStr || '').toLowerCase().includes('holiday');
              if (isLeaveEntry) {
                 parsedHrs = 0;
              }

              let employeeName = explicitEmp;
              if (!employeeName) {
                if (file.name.toLowerCase().startsWith('timesheet_')) {
                  employeeName = file.name.replace(/^timesheet_/i, '').replace(/\.(csv|xlsx)$/i, '');
                  employeeName = employeeName.charAt(0).toUpperCase() + employeeName.slice(1);
                } else {
                  employeeName = sheetName === 'Sheet1' ? getVal(['employee id', 'emp id', 'emp']) || 'Unknown Employee' : sheetName;
                }
              }

              newEntries.push({
                date: dt,
                employee: employeeName || 'Unknown Employee',
                project: projName || 'Unknown',
                projectType: projectTypes[(projName || '').toLowerCase()] || 'Unknown Type',
                hours: parsedHrs,
                task: taskStr || 'Development',
                status: getVal(['status', 'staus']) || 'Completed',
                remarks: getVal(['remarks', 'notes', 'remake']) || ''
              });
            });
          }
          
          if (newEntries.length > 0) {
            setEntries(newEntries);
            await saveEntriesToBackend(newEntries);
          } else {
            setEntries([]);
            await saveEntriesToBackend([]);
            setToastMsg({ msg: "Warning: No valid timesheet entries found in this file.", type: 'error' });
          }
          resolve(newEntries.length);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  return (
    <DataContext.Provider value={{ entries, setEntries, loadExcel, syncFromZoho, loading, syncing, toastMsg, setToastMsg }}>
      {children}
    </DataContext.Provider>
  );
};
