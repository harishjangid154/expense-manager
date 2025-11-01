/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable better optimization
  swcMinify: true,
  // Allow imports from public folder
  images: {
    domains: ['localhost'],
  },
  // Preserve client-side components
  transpilePackages: [
    'lucide-react',
    'recharts',
    'sonner',
    'vaul',
    'input-otp',
    'embla-carousel-react',
  ],
}

module.exports = nextConfig;
