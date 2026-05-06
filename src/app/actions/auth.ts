'use server';

import { cookies } from 'next/headers';
import { readDB, writeDB, User } from '@/lib/db';
import { redirect } from 'next/navigation';

export async function register(formData: FormData) {
  const nome = formData.get('nome') as string;
  const cpf = formData.get('cpf') as string;
  const telefone = formData.get('telefone') as string;

  if (!nome || !cpf || !telefone) {
    return { error: 'Preencha todos os campos.' };
  }

  const db = await readDB();
  
  if (db.users.find(u => u.cpf === cpf)) {
    return { error: 'CPF já cadastrado.' };
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    nome,
    cpf,
    telefone,
    role: 'user'
  };

  db.users.push(newUser);
  await writeDB(db);

  (await cookies()).set('user_id', newUser.id);
  redirect('/dashboard');
}

export async function login(formData: FormData) {
  const cpf = formData.get('cpf') as string;

  if (!cpf) {
    return { error: 'Informe o CPF.' };
  }

  const db = await readDB();
  const user = db.users.find(u => u.cpf === cpf);

  if (!user) {
    return { error: 'Usuário não encontrado.' };
  }

  (await cookies()).set('user_id', user.id);
  
  if (user.role === 'admin') {
    redirect('/admin');
  } else {
    redirect('/dashboard');
  }
}

export async function logout() {
  (await cookies()).delete('user_id');
  redirect('/login');
}

export async function getCurrentUser() {
  const userId = (await cookies()).get('user_id')?.value;
  if (!userId) return null;

  const db = await readDB();
  return db.users.find(u => u.id === userId) || null;
}
