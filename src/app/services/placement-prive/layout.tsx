import { buildServicePageMetadata } from '@/lib/seo/publicMetadata';
import type { Metadata } from 'next';

export const metadata: Metadata = buildServicePageMetadata({
  title: 'Programmes de placement privé (PPP)',
  description:
    'Programmes PPP : Small Cap à partir de 100 K, Large Cap cash 100 M à 5 Md, instruments 125 M à 5 Md USD/EUR. Sans offre publique continue.',
  path: '/services/placement-prive',
  keywords:
    'placement privé, PPP, programme structuré, MT-760, MT-799, Euroclear, MTN, financement institutionnel',
});

export default function PlacementPriveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
