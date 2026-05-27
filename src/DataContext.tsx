import React, { createContext, useContext, useState, useMemo } from 'react';
import { TimeEntry, INITIAL_ENTRIES } from './mockEntries';
import * as xlsx from 'xlsx';

interface DataContextType {
  entries: TimeEntry[];
  setEntries: (e: TimeEntry[]) => void;
  loadExcel: (file: File) => Promise<void>;
  loading: boolean;
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

  React.useEffect(() => {
    fetch('/api/entries')
      .then(r => r.json())
      .then(data => {
        if (data.length > 0) {
          setEntries(data);
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
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntries)
      });
    } catch (e) {
      console.error('Failed to save to backend:', e);
    }
  };

  const loadExcel = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
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

              let dateStr = getVal(['date']);
              if (!dateStr) return; // skip rows without dates
              
              let parsedDate = new Date(dateStr);
              let dt = dateStr; // fallback if invalid date format
              if (!isNaN(parsedDate.getTime())) {
                dt = parsedDate.toISOString().split('T')[0];
              }

              newEntries.push({
                date: dt,
                employee: getVal(['employee', 'employee name', 'name', 'emp']) || sheetName,
                project: getVal(['project name', 'project', 'proj']) || getVal(['project id', 'proj id']) || 'Unknown',
                hours: parseFloat(getVal(['hours worked', 'hours', 'hrs', 'time']) || '8') || 8,
                task: getVal(['task', 'description']) || 'Development',
                status: getVal(['status']) || 'Completed',
                remarks: getVal(['remarks', 'notes']) || ''
              });
            });
          }
          
          if (newEntries.length > 0) {
            setEntries(newEntries);
            await saveEntriesToBackend(newEntries);
          } else {
            alert("No valid timesheet entries found in the uploaded file.");
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  return (
    <DataContext.Provider value={{ entries, setEntries, loadExcel, loading }}>
      {children}
    </DataContext.Provider>
  );
};
