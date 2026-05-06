'use client';

import { useActionState } from 'react';
import { register } from '../actions/auth';
import Link from 'next/link';

export default function Cadastro() {
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    return await register(formData);
  }, null);

  return (
    <main className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
      <div className="card" style={{ width: '100%' }}>
        <h1 className="title text-center text-primary">Criar Conta</h1>
        
        {state?.error && (
          <div className="badge badge-danger mb-4" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px' }}>
            {state.error}
          </div>
        )}

        <form action={formAction}>
          <div className="form-group">
            <label className="form-label" htmlFor="nome">Nome Completo</label>
            <input className="form-input" id="nome" name="nome" type="text" required />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="cpf">CPF</label>
            <input className="form-input" id="cpf" name="cpf" type="text" required />
          </div>

          <div className="form-group mb-6">
            <label className="form-label" htmlFor="telefone">Telefone (WhatsApp)</label>
            <input className="form-input" id="telefone" name="telefone" type="tel" required />
          </div>

          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Salvando...' : 'Cadastrar'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-muted" style={{ fontSize: '0.875rem' }}>
            Já tem conta? Faça login
          </Link>
        </div>
      </div>
    </main>
  );
}
