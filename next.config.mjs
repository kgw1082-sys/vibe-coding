/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  experimental: {
    serverExternalPackages: ['pdf-parse'],
  },
}

export default nextConfig
