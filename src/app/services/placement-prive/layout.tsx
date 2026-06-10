import { buildServicePageMetadata } from '@/lib/seo/publicMetadata';
import type { Metadata } from 'next';

export const metadata: Metadata = buildServicePageMetadata({
  title: 'Programmes de placement privé (PPP)',
  description:
    'Programmes PPP institutionnels : cash hold, blocage MT-799, MT-760, MT-542, Euroclear. Tickets indicatifs à partir de 100 M USD/EUR. Sans offre publique continue.',
  path: '/services/placement-prive',
  keywords:
    'placement privé, PPP, programme structuré, MT-760, MT-799, Euroclear, MTN, financement institutionnel',
});

export default function PlacementPriveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
