'use server';

import { getCurrentUser } from './auth';
import { readDB, writeDB, User, Jogo } from '@/lib/db';
import { revalidatePath } from 'next/cache';

async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Acesso Negado');
  }
}

// Pagamentos
export async function aprovarPagamento(pagamentoId: string) {
  await checkAdmin();
  const db = await readDB();
  const pagIndex = db.pagamentos.findIndex(p => p.id === pagamentoId);
  if (pagIndex >= 0) {
    db.pagamentos[pagIndex].status = db.pagamentos[pagIndex].status === 'pago' ? 'pendente' : 'pago';
    await writeDB(db);
    revalidatePath('/admin/usuarios');
  }
}

// Configurações
export async function salvarConfiguracoes(formData: FormData): Promise<void> {
  await checkAdmin();
  const valor = parseFloat(formData.get('valor') as string);
  const pix = formData.get('pix') as string;

  if (isNaN(valor) || !pix) throw new Error('Valores inválidos.');

  const db = await readDB();
  db.config.valor_bolao = valor;
  db.config.chave_pix = pix;
  await writeDB(db);
  revalidatePath('/admin/configuracoes');
}

// Jogos e Resultados
const API_KEY = '445ac94e945834d5d59855b1e885541cfb100979';

async function fetchFromApiBzzoiro(leagueId: number) {
  let allResults: any[] = [];
  let nextUrl: string | null = `https://sports.bzzoiro.com/api/v2/events/?league_id=${leagueId}&page_size=50`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        'Authorization': `Token ${API_KEY}`
      }
    });
    if (!response.ok) {
      console.error(`Erro API League ${leagueId}:`, await response.text());
      break;
    }
    const data = await response.json();
    if (data.results && Array.isArray(data.results)) {
      allResults = allResults.concat(data.results);
    }
    
    // As vezes a API pode retornar HTTP no next, forçar HTTPS por segurança
    if (data.next) {
      nextUrl = data.next.replace('http://', 'https://');
    } else {
      nextUrl = null;
    }
  }

  return allResults;
}

export async function mockSincronizarJogosAPI() {
  await checkAdmin();
  const db = await readDB();
  
  // Limpa os jogos mockados anteriores se houver (para demonstração)
  db.jogos = [];

  // Busca Brasileirão (League 9) e Copa do Mundo (League 27)
  const jogosBrasileirao = await fetchFromApiBzzoiro(9);
  const jogosCopa = await fetchFromApiBzzoiro(27);

  const formatarJogos = (lista: any[], campeonato: 'brasileirao' | 'copa'): Jogo[] => {
    return lista.map((item: any) => {
      return {
        id: `api-${item.id}`,
        time_casa: item.home_team,
        time_visitante: item.away_team,
        data_hora: item.event_date,
        rodada: item.round_number || 1,
        campeonato,
        placar_real_casa: item.home_score,
        placar_real_visitante: item.away_score,
        encerrado: item.status === 'finished'
      };
    });
  };

  db.jogos.push(...formatarJogos(jogosBrasileirao, 'brasileirao'));
  db.jogos.push(...formatarJogos(jogosCopa, 'copa'));

  await writeDB(db);
  revalidatePath('/admin/jogos');
  revalidatePath('/dashboard');
}

export async function salvarResultado(jogoId: string, placarCasa: number, placarVisitante: number) {
  await checkAdmin();
  const db = await readDB();
  
  const jogoIndex = db.jogos.findIndex(j => j.id === jogoId);
  if (jogoIndex === -1) return { error: 'Jogo não encontrado.' };

  const jogo = db.jogos[jogoIndex];
  jogo.placar_real_casa = placarCasa;
  jogo.placar_real_visitante = placarVisitante;
  jogo.encerrado = true;

  // Calcula pontos da rodada para esse jogo
  // Regra definida: acertou placar = 1 ponto. Errou = 0.
  const dataReferencia = jogo.data_hora.split('T')[0];
  const palpitesDoJogo = db.palpites.filter(p => p.jogo_id === jogoId);
  
  for (const palpite of palpitesDoJogo) {
    // Só pontua se pagou naquele dia
    const pag = db.pagamentos.find(p => p.user_id === palpite.user_id && p.data_referencia === dataReferencia);
    if (!pag || pag.status !== 'pago') continue;

    if (palpite.palpite_casa === placarCasa && palpite.palpite_visitante === placarVisitante) {
      // Ganhou 1 ponto
      let pontuacao = db.pontuacoes.find(p => p.user_id === palpite.user_id && p.data_referencia === dataReferencia);
      if (pontuacao) {
        pontuacao.pontos += 1;
      } else {
        db.pontuacoes.push({
          user_id: palpite.user_id,
          data_referencia: dataReferencia,
          pontos: 1
        });
      }
    }
  }

  await writeDB(db);
  revalidatePath('/admin/jogos');
  revalidatePath('/dashboard');
  return { success: true };
}
