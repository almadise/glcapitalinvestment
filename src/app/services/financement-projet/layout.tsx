import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Financement de Projet - Accès aux Capitaux Institutionnels',
  description:
    'GL Capital structure et présente vos dossiers de financement de projet auprès d\'institutions financières internationales. Montants à partir de 10M€.',
  openGraph: {
    title: 'Financement de Projet - GL Capital Investment SA',
    description:
      'Structuration et présentation de dossiers de financement de projet auprès d\'institutions financières internationales.',
    url: 'https://glcapital9393.builtwithrocket.new/services/financement-projet',
  },
};

export default function FinancementProjetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
