import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital8049.builtwithrocket.new';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/_next/', '/back-office-admin-panel', '/client-portal-dashboard', '/dossier-submission-wizard', '/sign-up-login-screen'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}