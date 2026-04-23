import { imageHosts } from './image-hosts.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  distDir: process.env.DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: false},
  // Le dépôt contient encore beaucoup d'écarts Prettier ; le lint en CI reste recommandé.
  eslint: {
    ignoreDuringBuilds: true},
  serverExternalPackages: ['resend'],
  images: {
    remotePatterns: imageHosts,
    minimumCacheTTL: 60},
  async redirects() {
    return [
      {
        source: '/',
        destination: '/home-page',
        permanent: false}];
  },

  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    const csp = [
      "default-src 'self'",
      `script-src 'self' ${isDev ? "'unsafe-inline' 'unsafe-eval'" : "'unsafe-inline'"}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co ${isDev ? 'ws://localhost:* ws://127.0.0.1:*' : ''}`.trim(),
      "font-src 'self' data:",
      "frame-ancestors 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'},
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'},
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'},
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'},
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'},
          {
            key: 'Content-Security-Policy',
            value: csp}]}];
  },

  webpack(
    config,
    {
      dev: dev
    }
  ) {
    // @dhiwise/component-tagger retiré : injectait le widget flottant (icône / « static router ») en bas à gauche.
    if (dev) {
      const ignoredPaths = (process.env.WATCH_IGNORED_PATHS || '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      config.watchOptions = {
        ignored: ignoredPaths.length
          ? ignoredPaths.map((p) => `**/${p.replace(/^\/+|\/+$/g, '')}/**`)
          : undefined};
    }
    return config;
  }};
export default nextConfig;