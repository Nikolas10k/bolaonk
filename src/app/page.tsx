import Link from "next/link";

export default function Home() {
  return (
    <main className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
      <div className="card text-center" style={{ width: '100%' }}>
        <h1 className="title text-primary">Bolão Premium</h1>
        <p className="subtitle">Faça seus palpites e concorra a prêmios incríveis no Brasileirão e Copa do Mundo.</p>
        
        <div className="form-group mt-4">
          <Link href="/cadastro" className="btn btn-primary">
            Criar minha conta
          </Link>
          <Link href="/login" className="btn btn-secondary mt-4">
            Já tenho conta (Entrar)
          </Link>
        </div>
      </div>
    </main>
  );
}
