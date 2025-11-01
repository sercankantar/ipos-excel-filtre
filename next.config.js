/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
    outputFileTracingIncludes: {
      '/**/*': [
        './node_modules/.prisma/client',
        './node_modules/@prisma/client'
      ],
    },
  },
}

module.exports = nextConfig
