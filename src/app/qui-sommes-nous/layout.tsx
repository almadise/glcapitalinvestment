import { getPublicSiteUrl } from '@/lib/companyContact';
import type { Metadata } from 'next';

const baseUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  title: 'Qui Sommes-Nous - GL Capital Investment SA',
  description:
    "Découvrez GL Capital Investment SA : notre mission, nos valeurs de conformité, confidentialité et transparence, et notre engagement envers les porteurs de projets institutionnels en Europe de l'Ouest, en Amérique du Nord, en Asie et au Moyen-Orient.",
  keywords:
    'GL Capital équipe, mission financement institutionnel, valeurs conformité, structuration financière',
  alternates: { canonical: `${baseUrl}/qui-sommes-nous` },
  openGraph: {
    title: 'Qui Sommes-Nous - GL Capital Investment SA',
    description:
      'Notre mission, nos valeurs et notre engagement envers les porteurs de projets institutionnels.',
    url: `${baseUrl}/qui-sommes-nous`,
    type: 'website',
    images: [
      {
        url: '/assets/images/about-hero-bg.png',
        width: 1200,
        height: 630,
        alt: 'Équipe GL Capital Investment SA',
      },
    ],
  },
};

export default function QuiSommesNousLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
