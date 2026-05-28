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
      .then(r => {
        if (!r.ok) throw new Error('Backend not found');
        return r.json();
      })
      .then(data => {
        if (data.length > 0) {
          setEntries(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn('Backend unavailable, using localStorage');
        const local = localStorage.getItem('timesheet_entries');
        if (local) {
          try { setEntries(JSON.parse(local)); } catch (e) {}
        }
        setLoading(false);
      });
  }, []);

  const saveEntriesToBackend = async (newEntries: TimeEntry[]) => {
    localStorage.setItem('timesheet_entries', JSON.stringify(newEntries));
    try {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntries)
      });
    } catch (e) {
      console.warn('Backend save skipped (static deployment)');
    }
  };

  const syncFromZoho = async () => {
    setSyncing(true);
    try {
      let res = await fetch('/api/zoho-sync').catch(() => null);
      
      let blob: Blob;
      let filename = 'remote_sync.xlsx';
      
      if (!res || !res.ok) {
        console.warn('Backend /api/zoho-sync failed, fetching remote sheet directly from browser...');
        // Fallback to fetch directly from Google Sheets if we are on a static host like Vercel
        const fetchUrl = import.meta.env.VITE_SHEET_SHARE_LINK || 'https://docs.google.com/spreadsheets/d/1mmXK5hc-ai48J9LvsPAXvCAGrvmLIG4kokpux8wk3D0/export?format=xlsx';
        res = await fetch(fetchUrl);
        if (!res.ok) {
          throw new Error('Failed to fetch from remote sheet URL directly. Please check CORS and link permissions.');
        }
        blob = await res.blob();
      } else {
        filename = res.headers.get('x-filename') || filename;
        blob = await res.blob();
      }
      
      // create a file from the blob
      const file = new File([blob], filename, { type: res?.headers?.get('content-type') || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
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
                dt = parsedDate.toISOString().split('T')[0];
              }

              let employeeName = getVal(['employee', 'employee name', 'name', 'emp name']);
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
                project: getVal(['project name', 'project', 'proj', 'project id', 'proj id']) || 'Unknown',
                hours: parseFloat(getVal(['hours worked', 'hours', 'hrs', 'time']) || '8') || 8,
                task: getVal(['task', 'description']) || 'Development',
                status: getVal(['status', 'staus']) || 'Completed',
                remarks: getVal(['remarks', 'notes', 'remake']) || ''
              });
            });
          }
          
          if (newEntries.length > 0) {
            setEntries(newEntries);
            await saveEntriesToBackend(newEntries);
          } else {
            setToastMsg({ msg: "Warning: Wrong format! Please ensure your Excel file contains at minimum a 'Date' column.", type: 'error' });
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
