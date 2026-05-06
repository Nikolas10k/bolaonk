import { getCurrentUser, logout } from '../actions/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div style={{ padding: '1.5rem', fontWeight: 700, color: 'var(--primary)', fontSize: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          Admin Premium
        </div>
        
        <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href="/admin" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>Dashboard</Link>
          <Link href="/admin/usuarios" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>Usuários</Link>
          <Link href="/admin/jogos" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>Jogos & API</Link>
          <Link href="/admin/configuracoes" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>Configurações</Link>
          <form action={logout} style={{ marginTop: 'auto' }}>
            <button type="submit" className="btn btn-secondary" style={{ width: '100%', color: 'var(--danger)', justifyContent: 'flex-start' }}>
              Sair
            </button>
          </form>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'none' }}>
          <form action={logout}>
            <button type="submit" className="btn btn-secondary" style={{ width: '100%', color: 'var(--danger)' }}>
              Sair do Painel
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
