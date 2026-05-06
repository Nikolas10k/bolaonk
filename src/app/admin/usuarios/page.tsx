import { readDB } from '@/lib/db';
import { aprovarPagamento } from '@/app/actions/admin';

export default async function AdminUsuarios() {
  const db = await readDB();
  const pagamentos = db.pagamentos;

  const formatarDataBR = (dataIso: string) => {
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div>
      <h1 className="title">Aprovações de Pagamentos</h1>
      <p className="text-muted mb-6">Controle de pagamentos diários via PIX.</p>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--background)' }}>
            <tr>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Nome</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Data do Bolão</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Status</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pagamentos.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum pagamento registrado.</td>
              </tr>
            )}
            {pagamentos.map((p, i) => {
              const user = db.users.find(u => u.id === p.user_id);
              if (!user) return null;

              return (
                <tr key={p.id} style={{ borderBottom: i < pagamentos.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '1rem' }}>
                    <div>{user.nome}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user.telefone}</div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{formatarDataBR(p.data_referencia)}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${p.status === 'pago' ? 'badge-success' : 'badge-warning'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <form action={async () => {
                      'use server';
                      await aprovarPagamento(p.id);
                    }}>
                      <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                        {p.status === 'pendente' ? 'Aprovar PIX' : 'Revogar'}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
