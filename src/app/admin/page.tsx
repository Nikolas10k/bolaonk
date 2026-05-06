import { readDB } from '@/lib/db';

export default async function AdminDashboard() {
  const db = await readDB();

  const totalUsuarios = db.users.filter(u => u.role !== 'admin').length;
  
  const pagamentosPagos = db.pagamentos.filter(p => p.status === 'pago');
  const pagamentosPendentes = db.pagamentos.filter(p => p.status === 'pendente');
  
  const totalArrecadado = pagamentosPagos.length * db.config.valor_bolao;

  // Gerar Ranking Agrupado por Dia
  const rankingPorDia: Record<string, { user_nome: string; pontos: number }[]> = {};
  
  for (const pontuacao of db.pontuacoes) {
    if (!rankingPorDia[pontuacao.data_referencia]) {
      rankingPorDia[pontuacao.data_referencia] = [];
    }
    const user = db.users.find(u => u.id === pontuacao.user_id);
    if (user) {
      rankingPorDia[pontuacao.data_referencia].push({
        user_nome: user.nome,
        pontos: pontuacao.pontos
      });
    }
  }

  // Ordenar o ranking de cada dia do maior para o menor
  Object.keys(rankingPorDia).forEach(dia => {
    rankingPorDia[dia].sort((a, b) => b.pontos - a.pontos);
  });

  const diasComRanking = Object.keys(rankingPorDia).sort((a, b) => b.localeCompare(a)); // Mais recentes primeiro

  const formatarDataBR = (dataIso: string) => {
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div>
      <h1 className="title">Dashboard Geral</h1>
      <p className="text-muted mb-6">Visão geral financeira e campeões por dia.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card text-center">
          <div className="text-muted mb-2" style={{ fontSize: '0.875rem' }}>Arrecadação Total</div>
          <div className="text-primary" style={{ fontSize: '2rem', fontWeight: 700 }}>
            R$ {totalArrecadado.toFixed(2).replace('.', ',')}
          </div>
        </div>

        <div className="card text-center">
          <div className="text-muted mb-2" style={{ fontSize: '0.875rem' }}>Pagamentos Confirmados</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>
            {pagamentosPagos.length}
          </div>
        </div>

        <div className="card text-center" style={{ borderColor: pagamentosPendentes.length > 0 ? 'rgba(245, 158, 11, 0.5)' : 'var(--border)' }}>
          <div className="text-muted mb-2" style={{ fontSize: '0.875rem' }}>PIX Pendentes</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: pagamentosPendentes.length > 0 ? '#F59E0B' : 'var(--text-main)' }}>
            {pagamentosPendentes.length}
          </div>
        </div>
      </div>
      
      <h2 className="title mb-4" style={{ fontSize: '1.5rem' }}>Campeões do Dia</h2>
      
      {diasComRanking.length === 0 ? (
        <div className="card text-center py-10 text-muted">
          Ainda não há resultados e pontuações consolidadas.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {diasComRanking.map(dia => (
            <div key={dia} className="card">
              <h3 className="title" style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                Dia {formatarDataBR(dia)}
              </h3>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {rankingPorDia[dia].map((rk, idx) => (
                  <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: idx < rankingPorDia[dia].length - 1 ? '1px dashed var(--border)' : 'none' }}>
                    <span>
                      {idx === 0 ? '🏆 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : ''}
                      <span style={{ fontWeight: idx === 0 ? 700 : 400 }}>{rk.user_nome}</span>
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{rk.pontos} pts</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
