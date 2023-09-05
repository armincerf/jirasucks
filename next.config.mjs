export const typescript = {
  // !! WARN !!
  // Dangerously allow production builds to successfully complete even if
  // your project has type errors.
  // !! WARN !!
  ignoreBuildErrors: true,
};
export const eslint = {
  // Warning: This allows production builds to successfully complete even if
  // your project has ESLint errors.
  ignoreDuringBuilds: true,
  dirs: ["pages", "frontend", "backend", "util"],
};
export const experimental = {
  swcPlugins: [["@swc-jotai/react-refresh", {}]],
};
export async function rewrites() {
  return [
    {
      source: "/t.js",
      destination: "https://analytics.umami.is/script.js",
    },
    {
      source: "/api/send",
      destination: "https://analytics.umami.is/api/send",
    },
  ];
}
export function webpack(config) {
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
}
