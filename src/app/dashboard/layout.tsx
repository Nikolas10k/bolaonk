import { getCurrentUser, logout } from '../actions/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ 
        backgroundColor: 'var(--surface)', 
        borderBottom: '1px solid var(--border)',
        padding: '0.875rem 1rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>⚽</span>
            <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
              Bolão Premium
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Olá, <strong style={{ color: 'var(--text-main)' }}>{user.nome.split(' ')[0]}</strong>
            </span>
            <form action={logout}>
              <button 
                type="submit" 
                style={{ 
                  color: 'var(--danger)', 
                  fontSize: '0.8rem', 
                  fontWeight: 600,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minHeight: '36px',
                }}
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '640px', margin: '0 auto', width: '100%', padding: '1.25rem 0.875rem 5rem' }}>
        {children}
      </main>
    </div>
  );
}
