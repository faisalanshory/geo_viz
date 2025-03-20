/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      // Tambahkan domain untuk gambar eksternal jika ada
    ],
  },
  // Tambahkan konfigurasi lain jika diperlukan
  transpilePackages: ['@simonwep/pickr']
}

module.exports = nextConfig 