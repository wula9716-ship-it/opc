'use client'

import { suggestions } from '@/lib/data'

export default function Suggestions() {
  if (suggestions.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in stagger-5">
      {suggestions.map((item) => (
        <div key={item.id} className="glass-card-hover p-4 cursor-pointer group">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{item.icon}</span>
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-dark-200 mb-1 group-hover:text-white transition-colors">{item.title}</h4>
              <p className="text-[11px] text-dark-400 leading-relaxed mb-3 line-clamp-2">{item.description}</p>
              <span className="text-[11px] font-medium text-accent-purple group-hover:text-accent-purple/80 transition-colors inline-flex items-center gap-1">
                {item.action}
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
