'use client';

import { useState } from 'react';
import { marcarNotificacaoLida } from '../actions/palpites';

interface Props {
  pagamentoId: string;
  rodada: string;
  confirmadoEm?: string;
}

export default function NotificacaoPagamento({ pagamentoId, rodada, confirmadoEm }: Props) {
  const [visivel, setVisivel] = useState(true);

  const fechar = async () => {
    setVisivel(false);
    await marcarNotificacaoLida(pagamentoId);
  };

  const formatarHorario = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!visivel) return null;

  return (
    <div className="notif-pagamento" role="alert">
      <div className="notif-pagamento-icon">🎉</div>
      <div className="notif-pagamento-content">
        <div className="notif-pagamento-titulo">
          Pagamento Confirmado! Rodada {rodada}
        </div>
        <div className="notif-pagamento-texto">
          O administrador confirmou seu pagamento
          {confirmadoEm ? ` em ${formatarHorario(confirmadoEm)}` : ''}.
          {' '}Seus palpites estão na disputa! 🏆
        </div>
      </div>
      <button
        onClick={fechar}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: '1.1rem',
          cursor: 'pointer',
          padding: '0.25rem',
          lineHeight: 1,
          flexShrink: 0,
          alignSelf: 'flex-start',
        }}
        aria-label="Fechar notificação"
        title="Fechar"
      >
        ✕
      </button>
    </div>
  );
}
