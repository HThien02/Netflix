/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /** Tránh 307/308 khi SePay POST không có slash cuối */
  skipTrailingSlashRedirect: true,
}

export default nextConfig
