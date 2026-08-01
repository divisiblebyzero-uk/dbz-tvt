/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🟢 Bind the Tailwind engine directly inside your Next configuration
  experimental: {
    optimizeCss: true, // Forces compilation of v4 @import statements safely
  },
  reactStrictMode: true,
};

module.exports = nextConfig;