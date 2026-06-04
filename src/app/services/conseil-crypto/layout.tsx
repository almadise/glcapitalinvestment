import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conseil crypto-actifs',
  description:
    'Courtage prime, trading OTC, prêt-emprunt et conservation de monnaies numériques pour investisseurs institutionnels.',
};

export default function ConseilCryptoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
