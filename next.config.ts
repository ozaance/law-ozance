import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fixe la racine du projet (un package-lock.json parasite existe dans ~).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
