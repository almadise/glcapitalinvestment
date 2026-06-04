import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Programmes de placement privé',
  description:
    'Programmes de placement privé (PPP) pour propriétaires de fonds éligibles. Opérations sécurisées sur notes MTN, financement de projets.',
};

export default function PlacementPriveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
