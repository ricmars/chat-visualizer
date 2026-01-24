/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables are loaded from .env at runtime
  // No validation during build to allow builds without secrets
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  webpack: (config) => {
    // Deduplicate styled-components to avoid multiple instances
    // (Pega Cosmos bundles its own styled-components)
    config.resolve.alias = {
      ...config.resolve.alias,
      'styled-components': require.resolve('styled-components'),
    };
    return config;
  },
};

module.exports = nextConfig;
