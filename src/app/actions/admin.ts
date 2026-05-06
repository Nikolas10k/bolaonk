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
    const res: Response = await fetch(nextUrl, {
      headers: {
        'Authorization': `Token ${API_KEY}`
      }
    });
    if (!res.ok) {
      console.error(`Erro API League ${leagueId}:`, await res.text());
      break;
    }
    const data = await res.json();
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

const logosBR: Record<string, string> = {
  "Flamengo": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg",
  "Palmeiras": "https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg",
  "São Paulo": "https://upload.wikimedia.org/wikipedia/commons/4/4b/S%C3%A3o_Paulo_Futebol_Clube.png",
  "Corinthians": "https://upload.wikimedia.org/wikipedia/pt/b/b4/Corinthians_simbolo.png",
  "Fluminense": "https://upload.wikimedia.org/wikipedia/commons/a/a3/Escudo_Fluminense.svg",
  "Botafogo": "https://upload.wikimedia.org/wikipedia/commons/c/c2/Botafogo_de_Futebol_e_Regatas_logo.svg",
  "Vasco da Gama": "https://upload.wikimedia.org/wikipedia/pt/a/ac/CRVascodaGama.png",
  "Cruzeiro": "https://upload.wikimedia.org/wikipedia/commons/0/0b/Cruzeiro_Esporte_Clube_logo.svg",
  "Atlético Mineiro": "https://upload.wikimedia.org/wikipedia/commons/5/5f/Atletico_mineiro_galo.png",
  "Grêmio": "https://upload.wikimedia.org/wikipedia/commons/f/f1/Gremio_logo.svg",
  "Internacional": "https://upload.wikimedia.org/wikipedia/commons/f/f1/Escudo_do_Sport_Club_Internacional.svg",
  "Bahia": "https://upload.wikimedia.org/wikipedia/pt/9/90/ECBahia.png",
  "Vitória": "https://upload.wikimedia.org/wikipedia/pt/2/2c/Esporte_Clube_Vit%C3%B3ria_logo.png",
  "Red Bull Bragantino": "https://upload.wikimedia.org/wikipedia/pt/9/94/Red_Bull_Bragantino.png",
  "Athletico": "https://upload.wikimedia.org/wikipedia/pt/c/c7/Club_Athletico_Paranaense_2019.png",
  "Coritiba": "https://upload.wikimedia.org/wikipedia/commons/4/48/Coritiba_Foot_Ball_Club_logo.svg",
  "Mirassol": "https://upload.wikimedia.org/wikipedia/pt/6/64/Mirassol_Futebol_Clube.png",
  "Remo": "https://upload.wikimedia.org/wikipedia/commons/4/4c/Clube_do_Remo.svg",
  "Chapecoense": "https://upload.wikimedia.org/wikipedia/commons/4/40/Associa%C3%A7%C3%A3o_Chapecoense_de_Futebol.svg",
  "Santos": "https://upload.wikimedia.org/wikipedia/commons/3/35/Santos_logo.svg"
};

const getLogo = (teamName: string) => logosBR[teamName] || `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=random&color=fff`;

  const formatarJogos = (lista: any[], campeonato: 'brasileirao' | 'copa'): Jogo[] => {
    return lista.filter((item: any) => {
      if (campeonato === 'brasileirao') {
        const is2026 = item.event_date && item.event_date.startsWith('2026');
        const roundNum = parseInt(item.round_number) || 0;
        return is2026 && roundNum >= 14;
      }
      return true;
    }).map((item: any) => {
      return {
        id: `api-${item.id}`,
        time_casa: item.home_team,
        time_casa_logo: getLogo(item.home_team),
        time_visitante: item.away_team,
        time_visitante_logo: getLogo(item.away_team),
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
