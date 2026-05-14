'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

const FRIENDLY_MESSAGES: Record<string, string> = {
  'Failed to fetch': '网络连接异常，请检查网络后重试。',
  'NetworkError': '无法连接到服务器，请确认服务是否已启动。',
  'TypeError': '程序遇到意外数据，请刷新页面重试。',
  'ChunkLoadError': '资源加载失败，可能是版本已更新，请刷新页面。',
}

function getFriendlyMessage(error: Error): string {
  const name = error.name
  const message = error.message
  for (const [key, msg] of Object.entries(FRIENDLY_MESSAGES)) {
    if (name.includes(key) || message.includes(key)) return msg
  }
  return message || '页面渲染时发生了未知错误，请尝试刷新页面。'
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReport = () => {
    const error = this.state.error
    const body = `**错误报告**\n\n- 时间: ${new Date().toLocaleString()}\n- 错误: ${error?.message || '未知'}\n- 堆栈: ${error?.stack?.slice(0, 500) || '无'}`
    const url = `https://github.com/wula9716-ship-it/opc/issues/new?title=Bug: ${encodeURIComponent(error?.message?.slice(0, 60) || 'Error')}&body=${encodeURIComponent(body)}`
    window.open(url, '_blank')
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      const error = this.state.error
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
          <span className="text-5xl mb-4">😵</span>
          <h2 className="text-lg font-bold text-white mb-2">出错了</h2>
          <p className="text-sm text-dark-300 mb-2 max-w-md">
            {error ? getFriendlyMessage(error) : '未知错误'}
          </p>
          <p className="text-xs text-dark-500 mb-6 max-w-md font-mono bg-dark-900/60 px-3 py-1.5 rounded-lg">
            {error?.message || ''}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-5 py-2.5 text-sm font-medium text-accent-purple bg-accent-purple/15 hover:bg-accent-purple/25 border border-accent-purple/20 rounded-xl transition-all"
            >
              重试
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-sm font-medium text-white bg-accent-purple hover:bg-accent-purple/90 rounded-xl transition-all"
            >
              刷新页面
            </button>
            <button
              onClick={this.handleReport}
              className="px-5 py-2.5 text-sm font-medium text-dark-300 hover:text-white bg-dark-800 hover:bg-dark-700 rounded-xl transition-all"
            >
              📋 反馈问题
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
