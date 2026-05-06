import { getCurrentUser } from '../actions/auth';
import { readDB } from '@/lib/db';
import ListaJogos from './ListaJogos';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const db = await readDB();

  if (!user) return null;

  const palpitesUsuario = db.palpites.filter(p => p.user_id === user.id);
  const pagamentosUsuario = db.pagamentos.filter(p => p.user_id === user.id);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="title" style={{ marginBottom: '0.25rem' }}>Faça Seus Palpites</h1>
          <p className="text-muted">
            Navegue pelos campeonatos e dias. O valor do bolão é cobrado por cada dia em que você palpitar!
          </p>
        </div>
      </div>
      
      <ListaJogos jogos={db.jogos} palpitesUsuario={palpitesUsuario} pagamentosUsuario={pagamentosUsuario} />
    </div>
  );
}
