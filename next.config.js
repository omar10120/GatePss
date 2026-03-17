const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    compress: true,
    poweredByHeader: false,
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
            },
        ],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
                ],
            },
        ];
    },
    experimental: {
        workerThreads: false,
        cpus: 1
    },
    output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
};

module.exports = withNextIntl(nextConfig);
