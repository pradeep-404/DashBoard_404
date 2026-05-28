import React, { useState, useRef, useEffect } from 'react';

export default function FilterSelect({ value, onChange, options, className }: { value: string, onChange: (val: string) => void, options: {value: string, label: string}[], className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref]);

  const selectedLabel = options.find(o => o.value === value)?.label || value;

  return (
    <div ref={ref} className={className} style={{ position: 'relative', display: 'inline-block', minWidth: '120px', userSelect: 'none' }}>
      <div 
        onClick={() => setOpen(!open)} 
        style={{ padding: '6px 24px 6px 10px', background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-secondary)', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--color-text-primary)' }}
      >
        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedLabel}</span>
        <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '10px' }}>▼</span>
      </div>
      
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 1000,
          background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-secondary)', borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '100%',
          maxHeight: options.length > 10 ? '280px' : 'none', // ~8 items at 34px
          overflowY: options.length > 10 ? 'auto' : 'visible'
        }}>
          {options.map((o, i) => (
            <div 
              key={o.value + i}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{ padding: '8px 10px', fontSize: '13px', cursor: 'pointer', background: o.value === value ? 'rgba(24, 95, 165, 0.1)' : 'transparent', color: o.value === value ? '#185FA5' : 'var(--color-text-primary)' }}
              onMouseOver={e => { if (o.value !== value) e.currentTarget.style.background = 'var(--color-border-secondary)'; }}
              onMouseOut={e => { if (o.value !== value) e.currentTarget.style.background = 'transparent'; }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
