import { buildServicePageMetadata } from '@/lib/seo/publicMetadata';
import type { Metadata } from 'next';

export const metadata: Metadata = buildServicePageMetadata({
  title: 'Conseil et structuration',
  description:
    "Évaluation de bancabilité, revue documentaire et structuration de dossier avant soumission aux institutions financières agréées.",
  path: '/services/conseil-structuration',
  keywords: 'conseil structuration, bancabilité, due diligence, KYC, documentation financement',
});

export default function ConseilStructurationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
