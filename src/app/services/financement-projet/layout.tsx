import { buildServicePageMetadata } from '@/lib/seo/publicMetadata';
import type { Metadata } from 'next';

export const metadata: Metadata = buildServicePageMetadata({
  title: 'Financement de projet',
  description:
    'Structuration de dossiers de financement de projet en euros (2 M€ à 4 Md€). Mise en relation institutionnelle. Prêts commerciaux USD sur la page Prêts.',
  path: '/services/financement-projet',
  keywords:
    'financement de projet, financement institutionnel, structuration dossier, euro, éligibilité projet',
});

export default function FinancementProjetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
