import { buildServicePageMetadata } from '@/lib/seo/publicMetadata';
import type { Metadata } from 'next';

export const metadata: Metadata = buildServicePageMetadata({
  title: 'Instruments bancaires',
  description:
    'SBLC, garanties bancaires, MT-760 et MT-799. Conseil documentaire et structuration pour instruments adossés à des fonds réels. Instruments loués non acceptés.',
  path: '/services/instruments-bancaires',
  keywords: 'SBLC, garantie bancaire, BG, MT-760, MT-799, instruments bancaires, trade finance',
});

export default function InstrumentsBancairesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
