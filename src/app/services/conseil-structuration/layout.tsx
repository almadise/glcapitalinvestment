import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conseil & Structuration - Optimisation de Dossiers',
  description:
    'GL Capital vous accompagne dans la structuration et l\'optimisation de vos dossiers de financement pour maximiser leur éligibilité auprès des institutions financières.',
  openGraph: {
    title: 'Conseil & Structuration - GL Capital Investment SA',
    description:
      'Accompagnement dans la structuration et l\'optimisation de dossiers de financement institutionnel.',
    url: 'https://glcapital9393.builtwithrocket.new/services/conseil-structuration',
  },
};

export default function ConseilStructurationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
