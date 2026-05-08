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
    const novoStatus = db.pagamentos[pagIndex].status === 'pago' ? 'pendente' : 'pago';
    db.pagamentos[pagIndex].status = novoStatus;
    
    if (novoStatus === 'pago') {
      // Marca notificação para o usuário ver
      db.pagamentos[pagIndex].notificacao_nova = true;
      db.pagamentos[pagIndex].confirmado_em = new Date().toISOString();
    } else {
      // Revogado: limpa notificação
      db.pagamentos[pagIndex].notificacao_nova = false;
      db.pagamentos[pagIndex].confirmado_em = undefined;
    }
    
    await writeDB(db);
    revalidatePath('/admin/usuarios');
    revalidatePath('/dashboard');
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
  "Flamengo": "https://s.sde.globo.com/media/organizations/2018/04/10/Flamengo-2018.svg",
  "Palmeiras": "https://s.sde.globo.com/media/organizations/2018/03/11/palmeiras.svg",
  "São Paulo": "https://s.sde.globo.com/media/organizations/2018/03/11/sao-paulo.svg",
  "Corinthians": "https://logodownload.org/wp-content/uploads/2016/11/corinthians-logo-0.png",
  "Fluminense": "https://s.sde.globo.com/media/organizations/2018/03/11/fluminense.svg",
  "Botafogo": "https://s.sde.globo.com/media/organizations/2019/02/04/botafogo-65.png",
  "Vasco da Gama": "https://logodownload.org/wp-content/uploads/2016/09/vasco-logo-1.png",
  "Cruzeiro": "https://s.sde.globo.com/media/organizations/2018/03/11/cruzeiro.svg",
  "Atlético Mineiro": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Clube_Atl%C3%A9tico_Mineiro_logo.svg/120px-Clube_Atl%C3%A9tico_Mineiro_logo.svg.png",
  "Grêmio": "https://s.sde.globo.com/media/organizations/2018/03/12/gremio.svg",
  "Internacional": "https://s.sde.globo.com/media/organizations/2018/03/11/internacional.svg",
  "Bahia": "https://s.sde.globo.com/media/organizations/2018/03/11/bahia.svg",
  "Vitória": "https://s.sde.globo.com/media/organizations/2018/03/11/vitoria.svg",
  "Red Bull Bragantino": "https://s.sde.globo.com/media/organizations/2021/06/28/bragantino.svg",
  "Athletico": "https://s.sde.globo.com/media/organizations/2019/09/09/Athletico-PR.svg",
  "Coritiba": "https://s.sde.globo.com/media/organizations/2018/03/11/coritiba.svg",
  "Mirassol": "https://upload.wikimedia.org/wikipedia/pt/thumb/6/64/Mirassol_Futebol_Clube.png/120px-Mirassol_Futebol_Clube.png",
  "Remo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Clube_do_Remo.svg/120px-Clube_do_Remo.svg.png",
  "Chapecoense": "https://s.sde.globo.com/media/organizations/2018/03/11/chapecoense.svg",
  "Santos": "https://s.sde.globo.com/media/organizations/2018/03/12/santos.svg"
};

const flagsISO: Record<string, string> = {
  "Brasil": "br", "Brazil": "br",
  "Argentina": "ar",
  "França": "fr", "France": "fr",
  "Espanha": "es", "Spain": "es",
  "Inglaterra": "gb-eng", "England": "gb-eng",
  "Portugal": "pt",
  "Alemanha": "de", "Germany": "de",
  "Itália": "it", "Italy": "it",
  "Uruguai": "uy", "Uruguay": "uy",
  "Holanda": "nl", "Netherlands": "nl",
  "Bélgica": "be", "Belgium": "be",
  "Croácia": "hr", "Croatia": "hr",
  "Estados Unidos": "us", "USA": "us", "United States": "us",
  "México": "mx", "Mexico": "mx",
  "Canadá": "ca", "Canada": "ca",
  "Colômbia": "co", "Colombia": "co",
  "Chile": "cl",
  "Equador": "ec", "Ecuador": "ec",
  "Paraguai": "py", "Paraguay": "py",
  "Venezuela": "ve",
  "Bolívia": "bo", "Bolivia": "bo",
  "Peru": "pe",
  "Japão": "jp", "Japan": "jp",
  "Coreia do Sul": "kr", "South Korea": "kr",
  "Senegal": "sn",
  "Marrocos": "ma", "Morocco": "ma",
  "Egito": "eg", "Egypt": "eg",
  "Camarões": "cm", "Cameroon": "cm",
  "Nigéria": "ng", "Nigeria": "ng",
  "Suíça": "ch", "Switzerland": "ch",
  "Suécia": "se", "Sweden": "se",
  "Dinamarca": "dk", "Denmark": "dk",
  "Polônia": "pl", "Poland": "pl",
  "Sérvia": "rs", "Serbia": "rs",
  "País de Gales": "gb-wls", "Wales": "gb-wls",
  "Escócia": "gb-sct", "Scotland": "gb-sct",
  "Gana": "gh", "Ghana": "gh",
  "Tunísia": "tn", "Tunisia": "tn",
  "Arábia Saudita": "sa", "Saudi Arabia": "sa",
  "Austrália": "au", "Australia": "au",
  "Costa Rica": "cr",
  "Irã": "ir", "Iran": "ir",
  "Catar": "qa", "Qatar": "qa",
  "Panamá": "pa", "Panama": "pa",
  "Jamaica": "jm",
  "Costa do Marfim": "ci", "Ivory Coast": "ci",
  "Argélia": "dz", "Algeria": "dz",
  "Mali": "ml"
};

const getLogo = (teamName: string) => {
  if (logosBR[teamName]) return logosBR[teamName];
  if (flagsISO[teamName]) return `https://flagcdn.com/w160/${flagsISO[teamName]}.png`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=random&color=fff`;
};

  const formatarJogos = (lista: any[], campeonato: 'brasileirao' | 'copa'): Jogo[] => {
    return lista.filter((item: any) => {
      const is2026 = item.event_date && item.event_date.startsWith('2026');
      const roundNum = parseInt(item.round_number) || 0;
      
      if (campeonato === 'brasileirao') {
        return is2026 && roundNum >= 14;
      }
      
      if (campeonato === 'copa') {
        return is2026 && roundNum >= 1;
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
  const dataReferencia = jogo.rodada.toString();
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
