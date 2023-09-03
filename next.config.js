module.exports = {
  // set port to 3001
  port: 3001,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
    dirs: ["pages", "frontend", "backend", "util"],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });
    config.module.rules.push({
      test: /\.gz$/,
      enforce: "pre",
      use: "gzip-loader",
    });

    return config;
  },
};
