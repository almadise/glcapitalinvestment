import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital8049.builtwithrocket.new';

export const metadata: Metadata = {
  title: 'Contact — Soumettre un Dossier de Financement',
  description:
    'Soumettez votre dossier de financement à GL Capital Investment SA. Notre équipe analyse votre projet et vous accompagne dans la structuration de votre demande institutionnelle. Réponse sous 48h.',
  keywords: 'contact GL Capital, soumettre dossier financement, demande financement institutionnel',
  alternates: { canonical: `${baseUrl}/contact` },
  openGraph: {
    title: 'Contact GL Capital — Soumettre un Dossier de Financement',
    description: 'Soumettez votre dossier de financement à GL Capital Investment SA. Analyse et structuration de projets institutionnels.',
    url: `${baseUrl}/contact`,
    type: 'website',
    images: [{ url: '/assets/images/contact-hero-bg.png', width: 1200, height: 630, alt: 'Contactez GL Capital Investment SA' }],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
