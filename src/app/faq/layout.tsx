import { getPublicSiteUrl } from '@/lib/companyContact';
import type { Metadata } from 'next';

const baseUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Questions sur le financement institutionnel, les prêts commerciaux USD, les programmes PPP, les instruments SBLC/BG, la conformité KYC/AML et les délais de traitement.',
  keywords:
    'FAQ financement, prêt commercial, placement privé PPP, KYC AML, SBLC BG, MT-760, résumé exécutif, surety bond',
  alternates: { canonical: `${baseUrl}/faq` },
  openGraph: {
    title: 'FAQ GL Capital - Questions sur le Financement Institutionnel',
    description:
      'Réponses aux questions fréquentes sur les services de structuration et de financement de GL Capital.',
    url: `${baseUrl}/faq`,
    type: 'website',
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
