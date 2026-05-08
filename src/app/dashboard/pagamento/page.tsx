import { getCurrentUser } from '../../actions/auth';
import { readDB } from '@/lib/db';
import Link from 'next/link';
import CopiaPix from './CopiaPix';

export default async function PagamentoPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const user = await getCurrentUser();
  const db = await readDB();
  const sp = await searchParams;
  const dataReferencia = sp.data;

  if (!user || !dataReferencia) {
    if (!dataReferencia) {
      // Redirecionar de forma segura sem import dinâmico
      return (
        <div className="card text-center" style={{ padding: '2rem' }}>
          <p className="text-muted">Rodada não especificada.</p>
          <Link href="/dashboard" className="btn btn-primary" style={{ maxWidth: '300px', marginTop: '1rem' }}>
            Voltar ao Dashboard
          </Link>
        </div>
      );
    }
    return null;
  }

  const pagamento = db.pagamentos.find(p => p.user_id === user.id && p.data_referencia === dataReferencia);

  // Conta quantos palpites o usuário tem para esta rodada
  const jogosDaRodada = db.jogos.filter(j => j.rodada.toString() === dataReferencia);
  const palpitesDaRodada = db.palpites.filter(p =>
    p.user_id === user.id && jogosDaRodada.some(j => j.id === p.jogo_id)
  );

  if (!pagamento) {
    // Não tem pagamento criado ainda — usuário acessou direto pela URL
    return (
      <div className="card text-center flex flex-col items-center justify-center py-10">
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
        <h2 className="title">Nenhum palpite encontrado</h2>
        <p className="text-muted mb-6">
          Você ainda não registrou palpites para a Rodada {dataReferencia}.<br />
          Preencha seus palpites primeiro para gerar o pagamento.
        </p>
        <Link href="/dashboard" className="btn btn-primary" style={{ maxWidth: '300px' }}>
          Fazer Palpites
        </Link>
      </div>
    );
  }

  if (pagamento.status === 'pago') {
    return (
      <div className="card text-center flex flex-col items-center justify-center py-10">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h2 className="title">Pagamento Confirmado!</h2>
        <p className="text-muted mb-6">
          Seus palpites da <strong>Rodada {dataReferencia}</strong> foram confirmados pelo administrador e já estão na disputa!
        </p>
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: 'var(--text-muted)'
        }}>
          ✅ {palpitesDaRodada.length} palpite{palpitesDaRodada.length !== 1 ? 's' : ''} registrado{palpitesDaRodada.length !== 1 ? 's' : ''}
        </div>
        <Link href="/dashboard" className="btn btn-primary" style={{ maxWidth: '300px' }}>
          Fazer mais palpites
        </Link>
      </div>
    );
  }

  // Status: pendente — exibe dados de pagamento + opção de alterar palpites
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Cabeçalho */}
      <div className="card text-center" style={{ padding: '1.5rem' }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '50%', 
          backgroundColor: 'rgba(245, 158, 11, 0.2)', 
          color: '#F59E0B', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', fontSize: '2rem', 
          marginBottom: '1rem', margin: '0 auto 1rem'
        }}>
          ⏳
        </div>
        <h2 className="title" style={{ marginBottom: '0.5rem' }}>Aguardando Pagamento</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>
          Você tem <strong style={{ color: 'var(--text-main)' }}>{palpitesDaRodada.length} palpite{palpitesDaRodada.length !== 1 ? 's' : ''}</strong> registrado{palpitesDaRodada.length !== 1 ? 's' : ''} para a <strong style={{ color: 'var(--text-main)' }}>Rodada {dataReferencia}</strong>.
        </p>
      </div>

      {/* Dados do PIX */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          💰 Dados para Pagamento via PIX
        </h3>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Valor do Bolão (por rodada)</div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)' }}>
            R$ {db.config.valor_bolao.toFixed(2).replace('.', ',')}
          </div>
        </div>
        
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Chave PIX do Administrador</div>
          <CopiaPix chave={db.config.chave_pix} />
        </div>
      </div>

      {/* Instruções */}
      <div className="card" style={{ background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.875rem', color: '#3B82F6' }}>
          📱 Como realizar o pagamento
        </h3>
        <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <li>Copie a chave PIX acima</li>
          <li>Abra o app do seu banco e acesse o PIX</li>
          <li>Cole a chave e insira o valor <strong style={{ color: 'var(--text-main)' }}>R$ {db.config.valor_bolao.toFixed(2).replace('.', ',')}</strong></li>
          <li>Envie o comprovante para o administrador</li>
          <li>Aguarde a confirmação (normalmente em minutos) ⏱️</li>
        </ol>
      </div>

      {/* Ação: Alterar palpites */}
      <div className="card" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
            ✏️ Quer alterar seus palpites?
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Você ainda pode editar seus palpites enquanto o pagamento não for confirmado e os jogos não tiverem começado.
          </div>
        </div>
        <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
          Voltar e Alterar Palpites
        </Link>
      </div>

      {/* Aviso de atualização */}
      <p className="text-center text-muted" style={{ fontSize: '0.8rem', padding: '0.5rem 0 1rem' }}>
        Após o pagamento, atualize a página. A confirmação é feita pelo administrador.
      </p>
    </div>
  );
}
