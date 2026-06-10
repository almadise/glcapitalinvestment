import { buildServicePageMetadata } from '@/lib/seo/publicMetadata';
import type { Metadata } from 'next';

export const metadata: Metadata = buildServicePageMetadata({
  title: 'Conseil crypto-actifs',
  description:
    'Conseil sur actifs numériques : courtage prime, trading OTC, prêt-emprunt et conservation pour investisseurs institutionnels.',
  path: '/services/conseil-crypto',
  keywords: 'crypto actifs, actifs numériques, OTC, conservation, courtage prime',
});

export default function ConseilCryptoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
