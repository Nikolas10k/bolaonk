'use client';

import { useState, useMemo } from 'react';
import { salvarPalpites } from '../actions/palpites';
import { Jogo, Palpite, Pagamento } from '@/lib/db';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ListaJogos({ jogos, palpitesUsuario, pagamentosUsuario }: { jogos: Jogo[], palpitesUsuario: Palpite[], pagamentosUsuario: Pagamento[] }) {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<'brasileirao' | 'copa'>('brasileirao');
  
  const jogosCampeonato = useMemo(() => jogos.filter(j => j.campeonato === abaAtiva), [jogos, abaAtiva]);
  
  const rodadasDisponiveis = useMemo(() => {
    const rodadas = jogosCampeonato.map(j => j.rodada.toString());
    const unicos = Array.from(new Set(rodadas)).sort((a, b) => parseInt(a) - parseInt(b));
    return unicos;
  }, [jogosCampeonato]);

  const [abaRodada, setAbaRodada] = useState<string>(rodadasDisponiveis[0] || '');

  // Atualiza abaRodada quando muda o campeonato
  useMemo(() => {
    if (rodadasDisponiveis.length > 0 && !rodadasDisponiveis.includes(abaRodada)) {
      setAbaRodada(rodadasDisponiveis[0]);
    }
  }, [rodadasDisponiveis, abaRodada]);

  const [palpites, setPalpites] = useState<{ [key: string]: { casa: string, visitante: string } }>(() => {
    const estadoInicial: any = {};
    for (const p of palpitesUsuario) {
      estadoInicial[p.jogo_id] = { casa: p.palpite_casa.toString(), visitante: p.palpite_visitante.toString() };
    }
    return estadoInicial;
  });
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null);

  const jogosDaRodada = jogosCampeonato.filter(j => j.rodada.toString() === abaRodada);
  const pagamentoDaRodada = pagamentosUsuario.find(p => p.data_referencia === abaRodada);
  const isPago = pagamentoDaRodada?.status === 'pago';
  const isPendente = pagamentoDaRodada?.status === 'pendente';

  const handleMudar = (jogoId: string, time: 'casa' | 'visitante', valor: string) => {
    if (valor !== '' && !/^\d+$/.test(valor)) return;
    
    setPalpites(prev => ({
      ...prev,
      [jogoId]: {
        ...prev[jogoId] || { casa: '', visitante: '' },
        [time]: valor
      }
    }));
  };

  const handleSalvar = async () => {
    if (!abaRodada) return;

    setLoading(true);
    setMensagem(null);
    try {
      const dataParaSalvar = [];
      const agora = new Date().getTime();

      for (const jogo of jogosDaRodada) {
        const dataJogo = new Date(jogo.data_hora).getTime();
        if (agora < dataJogo && palpites[jogo.id]?.casa !== '' && palpites[jogo.id]?.visitante !== '') {
          dataParaSalvar.push({
            jogo_id: jogo.id,
            palpite_casa: parseInt(palpites[jogo.id].casa),
            palpite_visitante: parseInt(palpites[jogo.id].visitante),
          });
        }
      }

      if (dataParaSalvar.length === 0 && !isPendente) {
        setMensagem({ tipo: 'erro', texto: 'Nenhum palpite válido preenchido para salvar nesta rodada.' });
        setLoading(false);
        return;
      }

      const result = await salvarPalpites(abaRodada, dataParaSalvar);
      if (result.error) {
        setMensagem({ tipo: 'erro', texto: result.error });
      } else if (result.redirectTo) {
        router.push(result.redirectTo);
      } else {
        setMensagem({ tipo: 'sucesso', texto: 'Palpites salvos com sucesso!' });
      }
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: 'Erro inesperado.' });
    }
    setLoading(false);
  };

  return (
    <div>
      {/* Abas de campeonato */}
      <div className="tabs-container">
        <button 
          className={`btn ${abaAtiva === 'brasileirao' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setAbaAtiva('brasileirao')}
        >
          🇧🇷 Brasileirão
        </button>
        <button 
          className={`btn ${abaAtiva === 'copa' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setAbaAtiva('copa')}
        >
          🌍 Copa do Mundo
        </button>
      </div>

      {/* Scroll de rodadas */}
      {rodadasDisponiveis.length > 0 && (
        <div className="days-scroll">
          {rodadasDisponiveis.map(rodada => (
            <button
              key={rodada}
              className={`badge ${abaRodada === rodada ? 'badge-success' : 'badge-neutral'}`}
              style={{ padding: '0.5rem 1rem', cursor: 'pointer', whiteSpace: 'nowrap', border: 'none', fontWeight: 600 }}
              onClick={() => { setAbaRodada(rodada); setMensagem(null); }}
            >
              Rodada {rodada}
            </button>
          ))}
        </div>
      )}

      {abaRodada && <h2 className="title text-center mb-6">Jogos da Rodada {abaRodada}</h2>}
      
      {/* Mensagem de feedback */}
      {mensagem && (
        <div className={`badge ${mensagem.tipo === 'sucesso' ? 'badge-success' : 'badge-danger'} mb-6`} style={{ width: '100%', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
          {mensagem.texto}
        </div>
      )}

      {/* Banner: Pagamento confirmado */}
      {isPago && (
        <div className="notif-pagamento" style={{ animation: 'none' }}>
          <div className="notif-pagamento-icon" style={{ animation: 'none' }}>✅</div>
          <div className="notif-pagamento-content">
            <div className="notif-pagamento-titulo">Pagamento confirmado — Rodada {abaRodada}</div>
            <div className="notif-pagamento-texto">Seus palpites estão válidos e participando do bolão!</div>
          </div>
        </div>
      )}

      {/* Banner: Pagamento pendente com botão de ir pagar */}
      {isPendente && (
        <div className="banner-pendente">
          <div className="banner-pendente-info">
            <span style={{ fontSize: '1.4rem' }}>⏳</span>
            <div>
              <div style={{ fontWeight: 700, color: '#F59E0B', fontSize: '0.875rem' }}>
                Pagamento pendente — Rodada {abaRodada}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Realize o PIX para confirmar seus palpites.
              </div>
            </div>
          </div>
          <Link href={`/dashboard/pagamento?data=${abaRodada}`} className="banner-pendente-btn">
            💰 Ver dados do PIX
          </Link>
        </div>
      )}

      {jogosDaRodada.length === 0 && (
        <div className="text-center text-muted py-10">
          Nenhum jogo disponível para esta rodada.
        </div>
      )}

      {/* Lista de jogos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {jogosDaRodada.map(jogo => {
          const dataJogo = new Date(jogo.data_hora);
          const jaComecou = new Date().getTime() >= dataJogo.getTime();
          const bloqueado = jaComecou || jogo.encerrado;

          return (
            <div key={jogo.id} className="card">
              <div className="flex justify-between items-center mb-4 text-muted" style={{ fontSize: '0.75rem' }}>
                <span style={{ textTransform: 'uppercase' }}>{jogo.campeonato === 'brasileirao' ? 'Brasileirão' : 'Copa do Mundo'} • Rd. {jogo.rodada}</span>
                <span>{dataJogo.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <div className="match-row">
                <div className="match-team">
                  <div className="team-name" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', textAlign: 'center' }}>
                    {jogo.time_casa_logo && <img src={jogo.time_casa_logo} alt={jogo.time_casa} style={{ width: 36, height: 36, objectFit: 'contain' }} />}
                    <span>{jogo.time_casa}</span>
                  </div>
                  <input
                    className="form-input score-input"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={palpites[jogo.id]?.casa ?? ''}
                    onChange={(e) => handleMudar(jogo.id, 'casa', e.target.value)}
                    disabled={bloqueado}
                    placeholder="–"
                  />
                </div>
                
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', paddingBottom: '2rem' }}>VS</div>
                
                <div className="match-team">
                  <div className="team-name" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', textAlign: 'center' }}>
                    {jogo.time_visitante_logo && <img src={jogo.time_visitante_logo} alt={jogo.time_visitante} style={{ width: 36, height: 36, objectFit: 'contain' }} />}
                    <span>{jogo.time_visitante}</span>
                  </div>
                  <input
                    className="form-input score-input"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={palpites[jogo.id]?.visitante ?? ''}
                    onChange={(e) => handleMudar(jogo.id, 'visitante', e.target.value)}
                    disabled={bloqueado}
                    placeholder="–"
                  />
                </div>
              </div>

              {jaComecou && !jogo.encerrado && (
                <div className="text-center text-muted mt-4" style={{ fontSize: '0.75rem' }}>
                  ⏱️ Partida em andamento. Palpites bloqueados.
                </div>
              )}
              {jogo.encerrado && (
                <div className="text-center mt-4" style={{ fontSize: '0.875rem' }}>
                  <span className="text-primary font-bold">Placar Final: </span> 
                  {jogo.placar_real_casa} x {jogo.placar_real_visitante}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botões de ação fixos no rodapé */}
      {jogosDaRodada.length > 0 && (
        <div className="mt-6" style={{ 
          position: 'sticky', 
          bottom: '1rem', 
          display: 'flex', 
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          {/* Botão principal: Salvar/Alterar palpites */}
          <button 
            className="btn btn-primary" 
            style={{ boxShadow: 'var(--shadow-lg)' }} 
            onClick={handleSalvar} 
            disabled={loading || isPago}
          >
            {loading ? '⏳ Processando...' : isPago ? '✅ Palpites Confirmados' : '💾 Salvar Palpites'}
          </button>

          {/* Botão de pagamento — sempre visível quando pendente */}
          {isPendente && (
            <Link 
              href={`/dashboard/pagamento?data=${abaRodada}`} 
              className="btn btn-pagar-bolao"
            >
              💰 Pagar Bolão — Ver dados do PIX
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
