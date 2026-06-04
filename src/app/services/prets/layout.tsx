import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prêts institutionnels',
  description:
    'Prêts commerciaux et de projet, financements adossés à des instruments bancaires. GL Capital Investment SA.',
};

export default function PretsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
