import { getCurrentUser } from '../actions/auth';
import { readDB } from '@/lib/db';
import ListaJogos from './ListaJogos';
import { redirect } from 'next/navigation';
import NotificacaoPagamento from './NotificacaoPagamento';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const db = await readDB();

  if (!user) return null;

  const palpitesUsuario = db.palpites.filter(p => p.user_id === user.id);
  const pagamentosUsuario = db.pagamentos.filter(p => p.user_id === user.id);

  // Pagamentos recém confirmados que o usuário ainda não viu
  const notificacoesNovas = pagamentosUsuario.filter(p => p.status === 'pago' && p.notificacao_nova === true);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="title" style={{ marginBottom: '0.25rem' }}>Faça Seus Palpites</h1>
          <p className="text-muted">
            Navegue pelos campeonatos e rodadas. O valor do bolão é cobrado por cada rodada em que você palpitar!
          </p>
        </div>
      </div>

      {/* Notificações de pagamento confirmado */}
      {notificacoesNovas.map(pag => (
        <NotificacaoPagamento
          key={pag.id}
          pagamentoId={pag.id}
          rodada={pag.data_referencia}
          confirmadoEm={pag.confirmado_em}
        />
      ))}
      
      <ListaJogos jogos={db.jogos} palpitesUsuario={palpitesUsuario} pagamentosUsuario={pagamentosUsuario} />
    </div>
  );
}
