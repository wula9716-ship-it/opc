import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/Toast'
import DispatchWatcher from '@/components/DispatchWatcher'
import { CommandPalette } from '@/components/CommandPalette'

export const metadata: Metadata = {
  title: 'OPC OS — One Person Company',
  description: 'AI 驱动的一人公司操作系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="bg-dark-950 text-dark-100 antialiased">
        <ErrorBoundary>
          <ToastProvider>
          <DispatchWatcher />
          <CommandPalette />
          <div className="flex h-screen overflow-hidden relative">
            {/* Ambient background glow */}
            <div className="ambient-glow" style={{ top: '10%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.08), transparent 70%)' }} />
            <div className="ambient-glow" style={{ bottom: '15%', right: '10%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06), transparent 70%)', animationDelay: '10s' }} />
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <Header />
              <main className="flex-1 overflow-y-auto p-4 lg:p-6 page-enter">
                {children}
              </main>
            </div>
          </div>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
