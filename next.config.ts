import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.html": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.html$/,
      type: "asset/source",
    });
    config.module.rules.push({
      test: /legacy\/.*\.js$/,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
