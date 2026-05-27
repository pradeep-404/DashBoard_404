import React, { useState } from 'react';

export default function SuperAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@gmail.com' && password === 'tesr12345') {
      localStorage.setItem('superadmin', 'true');
      window.location.href = '/';
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background-tertiary)', fontFamily: 'var(--font-sans)' }}>
      <form onSubmit={handleLogin} style={{ background: 'var(--color-background-primary)', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '360px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '10px' }}>Super Admin Login</h2>
        
        {error && <div style={{ background: '#FCEBEB', color: '#791F1F', padding: '10px', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }}>{error}</div>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Email address</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border-secondary)', fontSize: '14px', outline: 'none' }} 
            placeholder="admin@gmail.com"
            required 
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border-secondary)', fontSize: '14px', outline: 'none' }} 
            placeholder="••••••••"
            required 
          />
        </div>
        
        <button type="submit" style={{ padding: '12px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginTop: '10px' }}>
          Login to Dashboard
        </button>
      </form>
    </div>
  );
}
