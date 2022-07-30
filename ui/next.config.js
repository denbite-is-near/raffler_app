/** @type {import('next').NextConfig} */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

// @ts-ignore
module.exports = withBundleAnalyzer({
  reactStrictMode: true,
  pageExtensions: ["page.ts", "page.tsx"],
  distDir: "build",
  productionBrowserSourceMaps: process.env.ENABLE_SOURCE_MAPS === "1",
  images: {
    minimumCacheTTL: 300,
  },
  trailingSlash: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }

    config.module.rules.push({
      test: /\.js$/,
      exclude: [/node_modules/],
      use: {
        loader: "babel-loader?compact=false",
        options: {
          presets: ["@babel/preset-env"],
        },
      },
    });

    return config;
  },
});
