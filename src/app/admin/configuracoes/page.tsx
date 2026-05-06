import { readDB } from '@/lib/db';
import { salvarConfiguracoes } from '@/app/actions/admin';

export default async function AdminConfig() {
  const db = await readDB();

  return (
    <div>
      <h1 className="title">Configurações Gerais</h1>
      
      <div className="card" style={{ maxWidth: '500px' }}>
        <form action={salvarConfiguracoes}>
          <div className="form-group mb-4">
            <label className="form-label" htmlFor="valor">Valor do Bolão (R$)</label>
            <input 
              className="form-input" 
              id="valor" 
              name="valor" 
              type="number" 
              step="0.01" 
              defaultValue={db.config.valor_bolao} 
              required 
            />
          </div>

          <div className="form-group mb-6">
            <label className="form-label" htmlFor="pix">Chave PIX do Administrador</label>
            <input 
              className="form-input" 
              id="pix" 
              name="pix" 
              type="text" 
              defaultValue={db.config.chave_pix} 
              required 
            />
            <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
              Esta chave será exibida para os usuários com pagamento pendente.
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            Salvar Configurações
          </button>
        </form>
      </div>
    </div>
  );
}
