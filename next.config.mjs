/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // @libsql/client ships native bindings that must stay external to the server bundle
    config.externals.push("@libsql/client");
    return config;
  },
};

export default nextConfig;
