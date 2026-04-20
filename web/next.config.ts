import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const baseConfig: NextConfig = {
  reactStrictMode: true,
};

const isDev = process.env.NODE_ENV === "development";

const config: NextConfig = isDev
  ? baseConfig
  : withSerwistInit({
      swSrc: "app/sw.ts",
      swDest: "public/sw.js",
      cacheOnNavigation: true,
    })(baseConfig);

export default config;
