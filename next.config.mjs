/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Electron 打包需要 standalone 模式
  output: 'standalone',
  // Electron 环境下不需要图片优化服务
  images: {
    unoptimized: true,
  },
}

export default nextConfig
