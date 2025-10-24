/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx"],
  reactStrictMode: true,
  images: {
    domains: [
      "api.microlink.io", // Microlink Image Preview
      "avatars.githubusercontent.com", // GitHub avatars
    ],
  },
  experimental: {
    scrollRestoration: true,
  },
};

export default nextConfig;