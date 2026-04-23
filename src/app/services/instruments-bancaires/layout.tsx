import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Instruments Bancaires - SBLC, BG & Lettres de Crédit',
  description:
    'GL Capital facilite l\'accès aux instruments bancaires internationaux : SBLC, garanties bancaires et lettres de crédit pour sécuriser vos opérations de financement.',
  openGraph: {
    title: 'Instruments Bancaires - GL Capital Investment SA',
    description:
      'Accès aux instruments bancaires internationaux : SBLC, garanties bancaires et lettres de crédit.',
    url: 'https://glcapital9393.builtwithrocket.new/services/instruments-bancaires',
  },
};

export default function InstrumentsBancairesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
