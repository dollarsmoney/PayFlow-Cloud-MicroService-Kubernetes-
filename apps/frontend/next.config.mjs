/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@payflow/db', '@payflow/events'],
};

export default nextConfig;
