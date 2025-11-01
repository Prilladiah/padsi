/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Experimental features (App Router sudah stable di Next.js 14)
  experimental: {
    // appDir sudah enabled by default di Next.js 14
  },
  
  // Image optimization configuration
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development', // Optimize for production
  },
  
  // Environment variables that should be available at build time
  env: {
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
  },
  
  // Compiler options for smaller bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console.log in production
  },
  
  // Enable trailing slashes for better SEO (optional)
  trailingSlash: false,
  
  // For static export (if needed)
  // output: 'export',
  
  // For Vercel deployment optimization
  output: 'standalone',
}

module.exports = nextConfig