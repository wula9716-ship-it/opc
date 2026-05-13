export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center animate-pulse-soft" style={{ boxShadow: '0 0 16px rgba(124, 58, 237, 0.2)' }}>
          <span className="text-white text-sm font-bold">O</span>
        </div>
        <span className="text-sm text-dark-400 animate-pulse-soft">加载中...</span>
      </div>
    </div>
  )
}
