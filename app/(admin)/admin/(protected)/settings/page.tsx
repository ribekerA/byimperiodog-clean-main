import { Header } from '@/components/dashboard/Header';
import { Main } from '@/components/dashboard/Main';

export default function AdminSettings(){
  return (
  <>
  <Header />
  <Main>
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="text-sm text-[var(--text-muted)]">Tema e integrações (UI mock).</p>
  </Main>
  </>
  );
}
