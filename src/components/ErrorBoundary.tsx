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

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <span className="text-5xl mb-4">😵</span>
          <h2 className="text-lg font-bold text-white mb-2">出错了</h2>
          <p className="text-sm text-dark-400 mb-4 max-w-md">
            {this.state.error?.message ?? '页面渲染时发生了未知错误'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-5 py-2.5 text-sm font-medium text-accent-purple bg-accent-purple/15 hover:bg-accent-purple/25 border border-accent-purple/20 hover:border-accent-purple/30 rounded-xl transition-all"
          >
            重试
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
