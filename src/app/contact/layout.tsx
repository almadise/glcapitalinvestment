import { getPublicSiteUrl } from '@/lib/companyContact';
import type { Metadata } from 'next';

const baseUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contactez GL Capital pour un financement de projet, un prêt commercial, un programme PPP ou des instruments bancaires. Réponse sous 48 h ouvrées.',
  keywords:
    'contact GL Capital, soumettre dossier, prêt commercial, placement privé, financement projet, SBLC',
  alternates: { canonical: `${baseUrl}/contact` },
  openGraph: {
    title: 'Contact GL Capital - Soumettre un Dossier de Financement',
    description:
      'Soumettez votre dossier de financement à GL Capital Investment SA. Analyse et structuration de projets institutionnels.',
    url: `${baseUrl}/contact`,
    type: 'website',
    images: [
      {
        url: '/assets/images/contact-hero-bg.png',
        width: 1200,
        height: 630,
        alt: 'Contactez GL Capital Investment SA',
      },
    ],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
