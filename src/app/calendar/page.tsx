'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { loadOutputs, loadTasks, onWorkspaceDataChanged } from '@/lib/workspace-store'
import type { Output, Task } from '@/types'

type ViewMode = 'month' | 'week' | 'timeline'
type CalendarEvent =
  | { type: 'task'; id: string; title: string; date: string; status: Task['status']; priority: Task['priority']; assignee: string }
  | { type: 'output'; id: string; title: string; date: string; status: Output['status']; format: string }

const DAYS = ['一', '二', '三', '四', '五', '六', '日']

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function monthLabel(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

function buildMonthCells(current: Date) {
  const year = current.getFullYear()
  const month = current.getMonth()
  const first = new Date(year, month, 1)
  const firstDay = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - firstDay)
  return Array.from({ length: 35 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function buildWeekCells(anchor: Date) {
  const day = (anchor.getDay() + 6) % 7
  const start = new Date(anchor)
  start.setDate(anchor.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function collectEvents(tasks: Task[], outputs: Output[]): CalendarEvent[] {
  return [
    ...tasks.filter(task => task.dueDate).map(task => ({
      type: 'task' as const,
      id: task.id,
      title: task.title,
      date: task.dueDate,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
    })),
    ...outputs.filter(output => output.createdAt).map(output => ({
      type: 'output' as const,
      id: output.id,
      title: output.title,
      date: output.createdAt,
      status: output.status,
      format: output.format,
    })),
  ]
}

function eventClass(event: CalendarEvent): string {
  if (event.type === 'output') return 'bg-accent-blue/20 text-accent-blue'
  if (event.priority === 'high') return 'bg-accent-red/20 text-accent-red'
  if (event.priority === 'medium') return 'bg-accent-yellow/20 text-accent-yellow'
  return 'bg-accent-green/20 text-accent-green'
}

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>('month')
  const [current, setCurrent] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [outputs, setOutputs] = useState<Output[]>([])

  useEffect(() => {
    const refresh = () => {
      setTasks(loadTasks())
      setOutputs(loadOutputs())
    }
    refresh()
    return onWorkspaceDataChanged(refresh)
  }, [])

  const events = useMemo(() => collectEvents(tasks, outputs), [tasks, outputs])
  const monthCells = useMemo(() => buildMonthCells(current), [current])
  const weekCells = useMemo(() => buildWeekCells(current), [current])
  const todayKey = toDateKey(new Date())
  const selectedEvents = selectedDate ? events.filter(event => event.date === selectedDate) : []
  const dueThisWeek = weekCells.reduce((sum, day) => sum + events.filter(event => event.date === toDateKey(day)).length, 0)
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(task => task.status === 'completed').length / tasks.length) * 100) : 0

  const moveMonth = (delta: number) => {
    const next = new Date(current)
    next.setMonth(current.getMonth() + delta)
    setCurrent(next)
    setSelectedDate('')
  }

  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">日历</h1>
          <p className="text-sm text-dark-300 mt-1">只展示你真实创建的任务截止日和产出日期。</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex p-0.5 bg-dark-800 rounded-lg border border-white/[0.08]">
            {[
              { key: 'month' as const, label: '月' },
              { key: 'week' as const, label: '周' },
              { key: 'timeline' as const, label: '时间线' },
            ].map(item => (
              <button key={item.key} onClick={() => setView(item.key)} className={`px-3 py-1.5 rounded-md text-xs font-medium ${view === item.key ? 'bg-accent-purple/25 text-white' : 'text-dark-300 hover:text-white'}`}>
                {item.label}
              </button>
            ))}
          </div>
          <Link href="/tasks" className="px-3 py-2 bg-accent-purple/15 hover:bg-accent-purple/25 text-accent-purple text-xs rounded-xl border border-accent-purple/20 transition-colors">
            + 新建任务
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '今日事件', value: events.filter(event => event.date === todayKey).length, color: 'text-accent-blue', icon: '📋' },
          { label: '本周事件', value: dueThisWeek, color: 'text-accent-yellow', icon: '⏰' },
          { label: '真实任务', value: tasks.length, color: 'text-dark-100', icon: '🗓️' },
          { label: '完成率', value: tasks.length > 0 ? `${completionRate}%` : '-', color: 'text-accent-green', icon: '✅' },
        ].map(item => (
          <div key={item.label} className="glass-card p-4 flex items-center gap-3">
            <span className="text-xl">{item.icon}</span>
            <div>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-dark-300">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="glass-card p-10 text-center">
          <p className="text-base text-dark-100">日历还没有任何记录</p>
          <p className="text-sm text-dark-300 mt-2">创建带截止日期的任务，或创建产出后，日历会自动出现真实事件。</p>
        </div>
      )}

      {view === 'month' && (
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <button onClick={() => moveMonth(-1)} className="text-dark-300 hover:text-white">←</button>
              <span className="text-sm font-semibold text-white">{monthLabel(current)}</span>
              <button onClick={() => moveMonth(1)} className="text-dark-300 hover:text-white">→</button>
            </div>
            <button onClick={() => { setCurrent(new Date()); setSelectedDate(todayKey) }} className="text-xs text-accent-purple hover:text-accent-purple/80">今天</button>
          </div>
          <div className="grid grid-cols-7 border-b border-white/[0.08]">
            {DAYS.map(day => <div key={day} className="px-2 py-2 text-center text-xs font-medium text-dark-300">{day}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {monthCells.map(day => {
              const key = toDateKey(day)
              const dayEvents = events.filter(event => event.date === key)
              const isCurrentMonth = day.getMonth() === current.getMonth()
              const isToday = key === todayKey
              return (
                <button key={key} onClick={() => setSelectedDate(key)} className={`min-h-[100px] p-2 border-r border-b border-white/[0.04] text-left hover:bg-white/[0.03] ${selectedDate === key ? 'bg-accent-purple/[0.08]' : ''}`}>
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs mb-1 ${isToday ? 'bg-accent-purple text-white font-bold' : isCurrentMonth ? 'text-dark-100' : 'text-dark-500'}`}>
                    {day.getDate()}
                  </span>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(event => (
                      <div key={`${event.type}-${event.id}`} className={`text-[9px] px-1.5 py-0.5 rounded truncate ${eventClass(event)}`}>{event.title}</div>
                    ))}
                    {dayEvents.length > 3 && <span className="text-[9px] text-dark-300 pl-1.5">+{dayEvents.length - 3} 更多</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-white">{toDateKey(weekCells[0])} 至 {toDateKey(weekCells[6])}</span>
            <button onClick={() => setCurrent(new Date())} className="text-xs text-accent-purple hover:text-accent-purple/80">回到本周</button>
          </div>
          <div className="space-y-2">
            {weekCells.map(day => {
              const key = toDateKey(day)
              const dayEvents = events.filter(event => event.date === key)
              return (
                <div key={key} className={`p-3 rounded-xl border ${key === todayKey ? 'bg-accent-purple/[0.06] border-accent-purple/20' : 'bg-dark-800/40 border-white/[0.06]'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-dark-100">{key}</span>
                    {key === todayKey && <span className="text-[9px] bg-accent-purple/20 text-accent-purple px-1.5 py-0.5 rounded-full">今天</span>}
                  </div>
                  <div className="space-y-1.5">
                    {dayEvents.map(event => <div key={`${event.type}-${event.id}`} className={`rounded-lg px-2.5 py-1.5 text-xs ${eventClass(event)}`}>{event.title}</div>)}
                    {dayEvents.length === 0 && <p className="text-[10px] text-dark-400 py-1">暂无安排</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'timeline' && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-dark-100 mb-4">真实时间线</h3>
          <div className="space-y-2">
            {events.sort((a, b) => a.date.localeCompare(b.date)).map(event => (
              <div key={`${event.type}-${event.id}`} className="flex items-center gap-3 p-3 bg-dark-800/60 border border-white/[0.06] rounded-xl">
                <span className="text-xs text-dark-300 w-24">{event.date}</span>
                <span className={`text-[10px] px-2 py-1 rounded-full ${eventClass(event)}`}>{event.type === 'task' ? '任务' : '产出'}</span>
                <span className="text-sm text-dark-100">{event.title}</span>
              </div>
            ))}
            {events.length === 0 && <p className="text-sm text-dark-300 text-center py-10">暂无时间线记录</p>}
          </div>
        </div>
      )}

      {selectedDate && view === 'month' && (
        <div className="glass-card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dark-100">{selectedDate} 详情</h3>
            <button onClick={() => setSelectedDate('')} className="text-dark-300 hover:text-white text-xs">✕</button>
          </div>
          <div className="space-y-2">
            {selectedEvents.map(event => (
              <div key={`${event.type}-${event.id}`} className="flex items-center gap-2 p-3 bg-dark-800 rounded-lg">
                <span className={`text-[10px] px-2 py-1 rounded-full ${eventClass(event)}`}>{event.type === 'task' ? '任务' : '产出'}</span>
                <span className="text-xs text-dark-100">{event.title}</span>
                <Link href={event.type === 'task' ? '/tasks' : '/outputs'} className="ml-auto text-[10px] text-accent-purple hover:text-accent-purple/80">查看</Link>
              </div>
            ))}
            {selectedEvents.length === 0 && <p className="text-xs text-dark-300">这一天没有记录</p>}
          </div>
        </div>
      )}
    </div>
  )
}
