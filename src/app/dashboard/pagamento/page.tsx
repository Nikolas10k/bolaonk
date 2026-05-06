import { getCurrentUser } from '../../actions/auth';
import { readDB } from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function PagamentoPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const user = await getCurrentUser();
  const db = await readDB();
  const sp = await searchParams;
  const dataReferencia = sp.data;

  if (!user || !dataReferencia) {
    if (!dataReferencia) redirect('/dashboard');
    return null;
  }

  const pagamento = db.pagamentos.find(p => p.user_id === user.id && p.data_referencia === dataReferencia);

  if (!pagamento) {
    redirect('/dashboard');
  }

  const formatarDataBR = (dataIso: string) => {
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  if (pagamento.status === 'pago') {
    return (
      <div className="card text-center flex flex-col items-center justify-center py-10">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h2 className="title">Pagamento Confirmado!</h2>
        <p className="text-muted mb-6">Seus palpites do dia <strong>{formatarDataBR(dataReferencia)}</strong> já estão na disputa.</p>
        <Link href="/dashboard" className="btn btn-primary" style={{ maxWidth: '300px' }}>
          Fazer mais palpites
        </Link>
      </div>
    );
  }

  return (
    <div className="card text-center flex flex-col items-center justify-center py-10">
      <div style={{ 
        width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.2)', 
        color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '1.5rem'
      }}>
        ⏳
      </div>
      <h2 className="title" style={{ marginBottom: '0.5rem' }}>Aguardando Pagamento</h2>
      <p className="text-muted mb-6">
        Para confirmar seus palpites para o dia <strong>{formatarDataBR(dataReferencia)}</strong>, realize o pagamento via PIX.
      </p>
      
      <div style={{ backgroundColor: 'var(--background)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Valor da Inscrição (Por Dia)</div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem' }}>
          R$ {db.config.valor_bolao.toFixed(2).replace('.', ',')}
        </div>
        
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Chave PIX do Administrador</div>
        <div style={{ 
          backgroundColor: 'var(--surface)', padding: '1rem', borderRadius: '6px', 
          fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--primary)', border: '1px dashed var(--primary)',
          userSelect: 'all'
        }}>
          {db.config.chave_pix}
        </div>
      </div>
      
      <p className="mt-6 text-muted" style={{ fontSize: '0.875rem' }}>
        Após o pagamento, aguarde o administrador liberar seu acesso. <br/>
        (Dica: atualize a página em alguns minutos)
      </p>

      <div className="mt-8">
        <Link href="/dashboard" className="text-muted" style={{ textDecoration: 'underline', fontSize: '0.875rem' }}>
          Voltar para os jogos
        </Link>
      </div>
    </div>
  );
}
