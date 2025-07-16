/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude native modules from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        util: false,
        assert: false,
        os: false,
        path: false,
      }
    }

    // Handle native modules and binary files
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    })

    // Externalize Docker-related modules for server-side only
    if (isServer) {
      config.externals = [...(config.externals || []), 'dockerode', 'ssh2']
    }

    return config
  },
}

export default nextConfig
