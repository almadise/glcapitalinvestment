import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital8049.builtwithrocket.new';

export const metadata: Metadata = {
  title: 'FAQ — Questions Fréquentes sur le Financement Institutionnel',
  description:
    'Trouvez les réponses à vos questions sur les services de GL Capital : documents requis, délais de traitement, types de financement, conformité KYC/AML, et processus de soumission de dossier.',
  keywords: 'FAQ financement, questions fréquentes, KYC AML, délais traitement, documents requis, SBLC BG',
  alternates: { canonical: `${baseUrl}/faq` },
  openGraph: {
    title: 'FAQ GL Capital — Questions sur le Financement Institutionnel',
    description: 'Réponses aux questions fréquentes sur les services de structuration et de financement de GL Capital.',
    url: `${baseUrl}/faq`,
    type: 'website',
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
