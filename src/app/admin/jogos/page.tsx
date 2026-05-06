import { readDB } from '@/lib/db';
import AdminJogosClient from './AdminJogosClient';

export default async function AdminJogos() {
  const db = await readDB();

  // Ordena para os não encerrados ficarem primeiro
  const jogos = [...db.jogos].sort((a, b) => {
    if (a.encerrado === b.encerrado) {
      return new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime();
    }
    return a.encerrado ? 1 : -1;
  });

  return <AdminJogosClient jogos={jogos} />;
}
