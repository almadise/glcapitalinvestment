import { getPublicSiteUrl } from '@/lib/companyContact';
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicSiteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/_next/',
        '/back-office-admin-panel',
        '/client-portal-dashboard',
        '/dossier-submission-wizard',
        '/sign-up-login-screen',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
