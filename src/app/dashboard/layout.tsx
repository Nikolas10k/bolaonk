import { getCurrentUser, logout } from '../actions/auth';
import { redirect } from 'next/navigation';

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
        padding: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div className="container flex items-center justify-between" style={{ padding: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--primary)' }}>Bolão Premium</div>
          
          <div className="flex items-center gap-4">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Olá, {user.nome.split(' ')[0]}
            </span>
            <form action={logout}>
              <button type="submit" style={{ color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 600 }}>
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container" style={{ flex: 1, padding: '2rem 1rem' }}>
        {children}
      </main>
    </div>
  );
}
