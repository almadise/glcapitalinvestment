import { getPublicSiteUrl } from '@/lib/companyContact';
import type { Metadata } from 'next';

type ServiceMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string;
};

export function buildServicePageMetadata({
  title,
  description,
  path,
  keywords,
}: ServiceMetadataInput): Metadata {
  const baseUrl = getPublicSiteUrl();
  const canonical = `${baseUrl}${path}`;
  const fullTitle = `${title} | GL Capital Investment SA`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      type: 'website',
      siteName: 'GL Capital Investment SA',
    },
    twitter: {
      card: 'summary',
      title: fullTitle,
      description,
    },
  };
}
