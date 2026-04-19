import { imageHosts } from './image-hosts.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  distDir: process.env.DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: true},
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
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.builtwithrocket.new https://*.rocket.new; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://*.builtwithrocket.new https://*.rocket.new; font-src 'self' data:; frame-ancestors 'self' https://*.rocket.new https://www.rocket.new"}]}];
  },

  webpack(
    config,
    {
      dev: dev
    }
  ) {
    config.module.rules.push({
      test: /\.(jsx|tsx)$/,
      exclude: [/node_modules/],
      use: [{
        loader: '@dhiwise/component-tagger/nextLoader'}]});
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