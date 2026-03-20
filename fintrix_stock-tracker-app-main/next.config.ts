import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true
    },
    images: {
        domains: ['fonts.googleapis.com', 'fonts.gstatic.com'],
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 60,
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    // Performance optimizations
    compress: true,
    poweredByHeader: false,
    generateEtags: true,

    // Experimental features for performance
    experimental: {
        optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
        // Removed optimizeCss as it might cause critters module issues
    },

    // Bundle analyzer in development
    webpack: (config, { dev, isServer, webpack }) => {
        // Bundle analyzer - only add if the package is installed
        if (process.env.ANALYZE) {
            try {
                const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer');
                config.plugins.push(
                    new BundleAnalyzerPlugin({
                        analyzerMode: 'static',
                        openAnalyzer: false,
                        reportFilename: isServer ? '../analyze/server.html' : '../analyze/client.html',
                    })
                );
            } catch (error) {
                console.warn('Bundle analyzer not available. Install @next/bundle-analyzer to enable bundle analysis.');
            }
        }

        // Bundle optimization for production
        if (!dev && !isServer) {
            config.optimization.splitChunks = {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                        priority: 10,
                    },
                    common: {
                        name: 'common',
                        minChunks: 2,
                        chunks: 'all',
                        enforce: true,
                        priority: 5,
                    },
                    radix: {
                        test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
                        name: 'radix',
                        chunks: 'all',
                        priority: 15,
                    },
                    lucide: {
                        test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
                        name: 'lucide',
                        chunks: 'all',
                        priority: 15,
                    },
                },
            };
        }

        // Optimize imports
        config.resolve.alias = {
            ...config.resolve.alias,
            '@': require('path').resolve(__dirname),
        };

        return config;
    },

    // Static generation and caching
    async headers() {
        return [
            {
                source: '/_next/static/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/api/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=300, s-maxage=300',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
