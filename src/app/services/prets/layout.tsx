import { buildServicePageMetadata } from '@/lib/seo/publicMetadata';
import type { Metadata } from 'next';

export const metadata: Metadata = buildServicePageMetadata({
  title: 'Prêts institutionnels et commerciaux',
  description:
    'Procédure de prêt commercial USD : prêteurs USA, Vietnam et Dubaï, caution d\'assurance, 12 documents, conditions indicatives. GL Capital structure les dossiers.',
  path: '/services/prets',
  keywords:
    'prêt commercial, prêt projet, surety bond, financement USD, prêteur institutionnel, résumé exécutif',
});

export default function PretsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
