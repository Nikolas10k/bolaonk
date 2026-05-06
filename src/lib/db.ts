import fs from 'fs/promises';
import path from 'path';

// Estrutura de dados mockada
export type User = {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  role: 'admin' | 'user';
};

export type Pagamento = {
  id: string;
  user_id: string;
  data_referencia: string; // Ex: '2026-10-17'
  status: 'pendente' | 'pago';
};

export type Jogo = {
  id: string;
  time_casa: string;
  time_casa_logo?: string;
  time_visitante: string;
  time_visitante_logo?: string;
  data_hora: string; // ISO string
  rodada: number;
  campeonato: 'brasileirao' | 'copa';
  placar_real_casa: number | null;
  placar_real_visitante: number | null;
  encerrado: boolean;
};

export type Palpite = {
  id: string;
  user_id: string;
  jogo_id: string;
  palpite_casa: number;
  palpite_visitante: number;
};

export type Pontuacao = {
  user_id: string;
  data_referencia: string;
  pontos: number;
};

export type Config = {
  valor_bolao: number;
  chave_pix: string;
};

export type DatabaseSchema = {
  config: Config;
  users: User[];
  jogos: Jogo[];
  palpites: Palpite[];
  pontuacoes: Pontuacao[];
  pagamentos: Pagamento[];
};

const DB_PATH = path.join(process.cwd(), 'data.json');

const defaultData: DatabaseSchema = {
  config: {
    valor_bolao: 50,
    chave_pix: 'admin@pix.com.br'
  },
  users: [
    {
      id: 'admin-1',
      nome: 'Administrador',
      cpf: '07056578179',
      telefone: '11999999999',
      role: 'admin'
    }
  ],
  jogos: [
    {
      id: 'jogo-1',
      time_casa: 'Flamengo',
      time_casa_logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg',
      time_visitante: 'Palmeiras',
      time_visitante_logo: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg',
      data_hora: new Date(Date.now() + 86400000 * 2).toISOString(), // Daqui a 2 dias
      rodada: 1,
      campeonato: 'brasileirao',
      placar_real_casa: null,
      placar_real_visitante: null,
      encerrado: false
    },
    {
      id: 'jogo-2',
      time_casa: 'São Paulo',
      time_casa_logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/S%C3%A3o_Paulo_Futebol_Clube.png',
      time_visitante: 'Corinthians',
      time_visitante_logo: 'https://upload.wikimedia.org/wikipedia/pt/b/b4/Corinthians_simbolo.png',
      data_hora: new Date(Date.now() - 86400000).toISOString(), // Ontem (para testar travamento)
      rodada: 1,
      campeonato: 'brasileirao',
      placar_real_casa: null,
      placar_real_visitante: null,
      encerrado: false
    }
  ],
  palpites: [],
  pontuacoes: [],
  pagamentos: []
};

export async function readDB(): Promise<DatabaseSchema> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.pagamentos) {
      parsed.pagamentos = [];
    }
    if (!parsed.pontuacoes) {
      parsed.pontuacoes = [];
    }
    return parsed;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await writeDB(defaultData);
      return defaultData;
    }
    throw error;
  }
}

export async function writeDB(data: DatabaseSchema): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
