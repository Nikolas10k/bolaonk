'use server';

import { getCurrentUser } from './auth';
import { readDB, writeDB, Palpite, Pagamento } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function salvarPalpites(
  dataReferencia: string,
  palpitesData: { jogo_id: string; palpite_casa: number; palpite_visitante: number }[]
) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Não autorizado.' };
  }

  const db = await readDB();
  const agora = new Date().getTime();

  for (const item of palpitesData) {
    const jogo = db.jogos.find(j => j.id === item.jogo_id);
    if (!jogo) continue;

    const dataJogo = new Date(jogo.data_hora).getTime();
    if (agora > dataJogo) {
      continue; // Não pode palpitar em jogo que já começou
    }

    const palpiteExistenteIndex = db.palpites.findIndex(p => p.user_id === user.id && p.jogo_id === item.jogo_id);
    
    if (palpiteExistenteIndex >= 0) {
      db.palpites[palpiteExistenteIndex].palpite_casa = item.palpite_casa;
      db.palpites[palpiteExistenteIndex].palpite_visitante = item.palpite_visitante;
    } else {
      const novoPalpite: Palpite = {
        id: `palpite-${Date.now()}-${Math.random()}`,
        user_id: user.id,
        jogo_id: item.jogo_id,
        palpite_casa: item.palpite_casa,
        palpite_visitante: item.palpite_visitante,
      };
      db.palpites.push(novoPalpite);
    }
  }

  // Verifica/Cria pagamento para esse dia
  const pagamentoIndex = db.pagamentos.findIndex(p => p.user_id === user.id && p.data_referencia === dataReferencia);
  let statusAtual = 'pendente';

  if (pagamentoIndex >= 0) {
    statusAtual = db.pagamentos[pagamentoIndex].status;
  } else {
    const novoPagamento: Pagamento = {
      id: `pag-${Date.now()}`,
      user_id: user.id,
      data_referencia: dataReferencia,
      status: 'pendente'
    };
    db.pagamentos.push(novoPagamento);
  }

  await writeDB(db);

  if (statusAtual === 'pendente') {
    return { success: true, redirectTo: `/dashboard/pagamento?data=${dataReferencia}` };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
