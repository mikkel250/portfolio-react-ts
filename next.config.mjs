/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx"],
  reactStrictMode: true,
  images: {
    domains: [
      "api.microlink.io",
      "avatars.githubusercontent.com",
    ],
  },
  experimental: {
    scrollRestoration: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark Node.js built-ins and gRPC-related packages as externals
      // to avoid bundling them in the server build. OpenTelemetry SDK
      // imports these but they're available at runtime in Node.js.
      config.externals = [
        ...(config.externals || []),
        // Node.js built-ins
        'fs',
        'stream',
        'net',
        'tls',
        'crypto',
        'zlib',
        'http',
        'https',
        'path',
        'os',
        'util',
        'events',
        'buffer',
        'child_process',
        'timers',
        'console',
        'url',
        'querystring',
        'string_decoder',
        'async_hooks',
        // gRPC-related packages that require Node.js built-ins
        '@grpc/grpc-js',
        '@grpc/proto-loader',
        '@opentelemetry/exporter-logs-otlp-grpc',
        '@opentelemetry/exporter-trace-otlp-grpc',
        '@opentelemetry/exporter-metrics-otlp-grpc',
        '@opentelemetry/otlp-grpc-exporter-base',
        '@opentelemetry/configuration',
        '@opentelemetry/exporter-prometheus',
      ];
    }
    return config;
  },
};

export default nextConfig;