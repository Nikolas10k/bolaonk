'use client';

import { useState, useMemo } from 'react';
import { salvarPalpites } from '../actions/palpites';
import { Jogo, Palpite, Pagamento } from '@/lib/db';
import { useRouter } from 'next/navigation';

export default function ListaJogos({ jogos, palpitesUsuario, pagamentosUsuario }: { jogos: Jogo[], palpitesUsuario: Palpite[], pagamentosUsuario: Pagamento[] }) {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<'brasileirao' | 'copa'>('brasileirao');
  
  const jogosCampeonato = useMemo(() => jogos.filter(j => j.campeonato === abaAtiva), [jogos, abaAtiva]);
  
  const diasDisponiveis = useMemo(() => {
    const dias = jogosCampeonato.map(j => j.data_hora.split('T')[0]);
    const unicos = Array.from(new Set(dias)).sort();
    return unicos;
  }, [jogosCampeonato]);

  const [abaDia, setAbaDia] = useState<string>(diasDisponiveis[0] || '');

  // Atualiza abaDia quando muda o campeonato se o dia atual não existir no novo campeonato
  useMemo(() => {
    if (diasDisponiveis.length > 0 && !diasDisponiveis.includes(abaDia)) {
      setAbaDia(diasDisponiveis[0]);
    }
  }, [diasDisponiveis, abaDia]);

  const [palpites, setPalpites] = useState<{ [key: string]: { casa: string, visitante: string } }>(() => {
    const estadoInicial: any = {};
    for (const p of palpitesUsuario) {
      estadoInicial[p.jogo_id] = { casa: p.palpite_casa.toString(), visitante: p.palpite_visitante.toString() };
    }
    return estadoInicial;
  });
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null);

  const jogosDoDia = jogosCampeonato.filter(j => j.data_hora.startsWith(abaDia));
  const pagamentoDoDia = pagamentosUsuario.find(p => p.data_referencia === abaDia);
  const isPago = pagamentoDoDia?.status === 'pago';
  const isPendente = pagamentoDoDia?.status === 'pendente';

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
    if (!abaDia) return;

    setLoading(true);
    setMensagem(null);
    try {
      const dataParaSalvar = [];
      const agora = new Date().getTime();

      for (const jogo of jogosDoDia) {
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
        setMensagem({ tipo: 'erro', texto: 'Nenhum palpite válido preenchido para salvar neste dia.' });
        setLoading(false);
        return;
      }

      const result = await salvarPalpites(abaDia, dataParaSalvar);
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

  const formatarDataBR = (dataIsoString: string) => {
    if (!dataIsoString) return '';
    const [ano, mes, dia] = dataIsoString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div>
      <div className="tabs-container">
        <button 
          className={`btn ${abaAtiva === 'brasileirao' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setAbaAtiva('brasileirao')}
        >
          Brasileirão
        </button>
        <button 
          className={`btn ${abaAtiva === 'copa' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setAbaAtiva('copa')}
        >
          Copa do Mundo
        </button>
      </div>

      {diasDisponiveis.length > 0 && (
        <div className="days-scroll">
          {diasDisponiveis.map(dia => (
            <button
              key={dia}
              className={`badge ${abaDia === dia ? 'badge-success' : 'badge-neutral'}`}
              style={{ padding: '0.5rem 1rem', cursor: 'pointer', whiteSpace: 'nowrap', border: 'none', fontWeight: 600 }}
              onClick={() => { setAbaDia(dia); setMensagem(null); }}
            >
              {formatarDataBR(dia)}
            </button>
          ))}
        </div>
      )}

      {abaDia && <h2 className="title text-center mb-6">Jogos do dia {formatarDataBR(abaDia)}</h2>}
      
      {mensagem && (
        <div className={`badge ${mensagem.tipo === 'sucesso' ? 'badge-success' : 'badge-danger'} mb-6`} style={{ width: '100%', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
          {mensagem.texto}
        </div>
      )}

      {isPago && (
        <div className="badge badge-success mb-6" style={{ width: '100%', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem', textAlign: 'center' }}>
          ✅ Pagamento confirmado para este dia. Seus palpites estão na disputa!
        </div>
      )}

      {isPendente && (
        <div className="badge badge-danger mb-6" style={{ width: '100%', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem', textAlign: 'center', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B' }}>
          ⏳ Pagamento pendente para este dia. Aguardando aprovação do admin.
        </div>
      )}

      {jogosDoDia.length === 0 && (
        <div className="text-center text-muted py-10">
          Nenhum jogo disponível para esta data.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {jogosDoDia.map(jogo => {
          const dataJogo = new Date(jogo.data_hora);
          const jaComecou = new Date().getTime() >= dataJogo.getTime();
          const bloqueado = jaComecou || jogo.encerrado;

          return (
            <div key={jogo.id} className="card">
              <div className="flex justify-between items-center mb-4 text-muted" style={{ fontSize: '0.75rem' }}>
                <span style={{ textTransform: 'uppercase' }}>{jogo.campeonato} • Rodada {jogo.rodada}</span>
                <span>{dataJogo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <div className="match-row">
                <div className="match-team">
                  <div className="team-name" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
                    {jogo.time_casa_logo && <img src={jogo.time_casa_logo} alt={jogo.time_casa} style={{ width: 40, height: 40, objectFit: 'contain' }} />}
                    <span>{jogo.time_casa}</span>
                  </div>
                  <input
                    className="form-input score-input"
                    value={palpites[jogo.id]?.casa ?? ''}
                    onChange={(e) => handleMudar(jogo.id, 'casa', e.target.value)}
                    disabled={bloqueado}
                    placeholder="-"
                  />
                </div>
                
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>X</div>
                
                <div className="match-team">
                  <div className="team-name" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
                    {jogo.time_visitante_logo && <img src={jogo.time_visitante_logo} alt={jogo.time_visitante} style={{ width: 40, height: 40, objectFit: 'contain' }} />}
                    <span>{jogo.time_visitante}</span>
                  </div>
                  <input
                    className="form-input score-input"
                    value={palpites[jogo.id]?.visitante ?? ''}
                    onChange={(e) => handleMudar(jogo.id, 'visitante', e.target.value)}
                    disabled={bloqueado}
                    placeholder="-"
                  />
                </div>
              </div>

              {jaComecou && !jogo.encerrado && (
                <div className="text-center text-muted mt-4" style={{ fontSize: '0.75rem' }}>
                  Partida iniciada. Palpites bloqueados.
                </div>
              )}
              {jogo.encerrado && (
                <div className="text-center mt-4" style={{ fontSize: '0.875rem' }}>
                  <span className="text-primary font-bold">Placar Real: </span> 
                  {jogo.placar_real_casa} x {jogo.placar_real_visitante}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {jogosDoDia.length > 0 && (
        <div className="mt-6" style={{ position: 'sticky', bottom: '2rem', display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" style={{ boxShadow: 'var(--shadow-lg)' }} onClick={handleSalvar} disabled={loading}>
            {loading ? 'Processando...' : 'Salvar Palpites'}
          </button>
          {isPendente && (
            <button className="btn btn-secondary" onClick={() => router.push(`/dashboard/pagamento?data=${abaDia}`)}>
              Pagar Bolão
            </button>
          )}
        </div>
      )}
    </div>
  );
}
