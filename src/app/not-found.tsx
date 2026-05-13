import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <span className="text-6xl mb-4">🔍</span>
      <h1 className="text-3xl font-bold text-white mb-2">404</h1>
      <p className="text-sm text-dark-400 mb-6">页面不存在或已被移除</p>
      <Link
        href="/"
        className="px-5 py-2.5 text-sm font-medium text-white bg-accent-purple/15 hover:bg-accent-purple/25 border border-accent-purple/20 hover:border-accent-purple/30 rounded-xl transition-all"
      >
        返回仪表盘
      </Link>
    </div>
  )
}
