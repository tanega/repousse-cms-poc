/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/dashboard/home", permanent: false },
    ];
  },
};

export default nextConfig;
