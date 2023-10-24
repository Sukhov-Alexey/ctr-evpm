/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (
        config,
        { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
      ) => {
        if (isServer) {
            config.module.rules.push({
                test: /hammerjs/,
                loader: "bundle-loader",
                options: {
                  lazy: true
                }
            });
        }
        return config;
      },
}

module.exports = nextConfig
