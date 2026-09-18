/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  poweredByHeader: false,
  // The PNG pipeline (@jsquash/png, @jsquash/oxipng) is WASM-based and is
  // only ever imported lazily, inside the image-compressor Worker — see
  // src/lib/image-compressor/png-encoder.ts. asyncWebAssembly is required
  // by webpack to bundle a dynamic `import()` of a .wasm-backed module at
  // all; it does NOT pull WASM into the main app bundle by itself.
  // Confirmed sufficient across many real `npm install` + `next build`
  // runs in this project's history — see PROJECT_CONTEXT.md changelog.
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/icon",
        destination: "/icon.png",
      },
      {
        source: "/apple-icon",
        destination: "/apple-icon.png",
      },
    ];
  },
};

module.exports = nextConfig;
