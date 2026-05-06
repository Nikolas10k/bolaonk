'use client';

import { useTransition } from 'react';
import { mockSincronizarJogosAPI, salvarResultado } from '@/app/actions/admin';
import { Jogo } from '@/lib/db';

export default function AdminJogosClient({ jogos }: { jogos: Jogo[] }) {
  const [isPending, startTransition] = useTransition();

  const handleSincronizar = () => {
    startTransition(async () => {
      await mockSincronizarJogosAPI();
      alert('Jogos sincronizados com a API com sucesso!');
    });
  };

  const handleSalvarResultado = (jogoId: string) => {
    const casa = prompt('Placar do time da Casa:');
    if (casa === null) return;
    
    const visitante = prompt('Placar do time Visitante:');
    if (visitante === null) return;

    const numCasa = parseInt(casa);
    const numVis = parseInt(visitante);

    if (isNaN(numCasa) || isNaN(numVis)) {
      alert('Placar inválido.');
      return;
    }

    startTransition(async () => {
      const res = await salvarResultado(jogoId, numCasa, numVis);
      if (res.error) alert(res.error);
      else alert('Resultado salvo e pontuações calculadas!');
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="title" style={{ marginBottom: '0.25rem' }}>Jogos e Resultados</h1>
          <p className="text-muted">Integração com API de Futebol e validação de resultados.</p>
        </div>
        
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleSincronizar} disabled={isPending}>
          {isPending ? 'Sincronizando...' : '🔄 Sincronizar API de Jogos'}
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--background)' }}>
            <tr>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Data/Hora</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Partida</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Placar Real</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {jogos.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Nenhum jogo cadastrado. Clique em Sincronizar API.
                </td>
              </tr>
            )}
            {jogos.map((j, i) => (
              <tr key={j.id} style={{ borderBottom: i < jogos.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                  {new Date(j.data_hora).toLocaleString('pt-BR')}
                  <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    {j.campeonato} • Rodada {j.rodada}
                  </div>
                </td>
                <td style={{ padding: '1rem', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {j.time_casa_logo && <img src={j.time_casa_logo} alt={j.time_casa} style={{ width: 24, height: 24, objectFit: 'contain' }} />}
                    {j.time_casa} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>x</span> {j.time_visitante}
                    {j.time_visitante_logo && <img src={j.time_visitante_logo} alt={j.time_visitante} style={{ width: 24, height: 24, objectFit: 'contain' }} />}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  {j.encerrado ? (
                    <span className="badge badge-success" style={{ fontSize: '1rem' }}>
                      {j.placar_real_casa} x {j.placar_real_visitante}
                    </span>
                  ) : (
                    <span className="text-muted" style={{ fontSize: '0.875rem' }}>Aguardando</span>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                    onClick={() => handleSalvarResultado(j.id)}
                    disabled={j.encerrado || isPending}
                  >
                    {j.encerrado ? 'Encerrado' : 'Informar Resultado'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
