'use client';

import { useActionState } from 'react';
import { login } from '../actions/auth';
import Link from 'next/link';

export default function Login() {
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    return await login(formData);
  }, null);

  return (
    <main className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
      <div className="card" style={{ width: '100%' }}>
        <h1 className="title text-center text-primary">Entrar no Bolão</h1>
        
        {state?.error && (
          <div className="badge badge-danger mb-4" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px' }}>
            {state.error}
          </div>
        )}

        <form action={formAction}>
          <div className="form-group mb-6">
            <label className="form-label" htmlFor="cpf">Seu CPF</label>
            <input className="form-input" id="cpf" name="cpf" type="text" required placeholder="Apenas números" />
          </div>

          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/cadastro" className="text-muted" style={{ fontSize: '0.875rem' }}>
            Não tem conta? Cadastre-se
          </Link>
        </div>
      </div>
    </main>
  );
}
