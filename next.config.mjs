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
  // One Node copy of the tracing stack. Next otherwise compiles instrumentation
  // and route handlers separately, so spans and the exporter miss each other.
  serverExternalPackages: [
    '@langfuse/core',
    '@langfuse/otel',
    '@langfuse/tracing',
    '@opentelemetry/api',
    '@opentelemetry/sdk-trace-node',
  ],
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
      ];
    }
    return config;
  },
};

export default nextConfig;