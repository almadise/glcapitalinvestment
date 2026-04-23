import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/tailwind.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import ErrorBoundary from '@/components/ErrorBoundary';
import CookieBanner from '@/components/CookieBanner';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'GL Capital Investment SA - Structuration & Financement de Dossiers',
    template: '%s | GL Capital Investment SA',
  },
  description:
    'GL Capital accompagne la structuration et la présentation de dossiers de financement. Plateforme institutionnelle sécurisée pour entreprises et porteurs de projets.',
  metadataBase: new URL('https://glcapital9393.builtwithrocket.new'),
  openGraph: {
    type: 'website',
    siteName: 'GL Capital Investment SA',
    title: 'GL Capital Investment SA - Structuration & Financement de Dossiers',
    description:
      'GL Capital accompagne la structuration et la présentation de dossiers de financement. Plateforme institutionnelle sécurisée pour entreprises et porteurs de projets.',
    url: 'https://glcapital9393.builtwithrocket.new',
    images: [
      {
        url: '/assets/images/gl-capital-financial-district.png',
        width: 1200,
        height: 630,
        alt: 'GL Capital Investment SA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GL Capital Investment SA - Structuration & Financement de Dossiers',
    description:
      'GL Capital accompagne la structuration et la présentation de dossiers de financement.',
    images: ['/assets/images/gl-capital-financial-district.png'],
  },
  icons: {
    icon: [
      { url: '/assets/images/logo-1776395060575.png', type: 'image/png' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: '/assets/images/logo-1776395060575.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <LanguageProvider>
          <AuthProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </AuthProvider>
        </LanguageProvider>
        <CookieBanner />
        <GoogleAnalytics />
      </body>
    </html>
  );
}