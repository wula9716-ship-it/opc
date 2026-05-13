import { Task, Agent, Output, MemoryEntry, KPIData, Discussion, Suggestion } from '@/types'

export const kpiData: KPIData[] = [
  { label: '任务', value: '0', subValue: '待创建', icon: '📋', color: 'from-blue-500 to-blue-600' },
  { label: 'Agent', value: '0', subValue: '未接入 AI', icon: '🤖', color: 'from-purple-500 to-purple-600' },
  { label: '产出', value: '0', subValue: '待生成', icon: '📦', color: 'from-cyan-500 to-cyan-600' },
  { label: '自动化节省', value: '0h', subValue: '真实任务后统计', icon: '⚡', color: 'from-amber-500 to-amber-600' },
  { label: '留资转化率', value: '-', subValue: '未接入数据源', icon: '📈', color: 'from-emerald-500 to-emerald-600' },
  { label: '预算使用', value: '¥0', subValue: '未产生调用', icon: '💰', color: 'from-pink-500 to-pink-600' },
]

export const agents: Agent[] = [
  { id: '1', name: 'CEO 助理', role: '全局统筹', avatar: '👔', status: 'offline', activity: 0, tasksCompleted: 0, skills: ['需求分析', '任务拆解', '优先级排序', '决策支持'], level: 'management' },
  { id: '2', name: '项目经理', role: '进度管理', avatar: '📊', status: 'offline', activity: 0, tasksCompleted: 0, skills: ['进度跟踪', '风险预警', '资源协调', '甘特图'], level: 'management' },
  { id: '3', name: '研究员', role: '调研分析', avatar: '🔬', status: 'offline', activity: 0, tasksCompleted: 0, skills: ['市场调研', '竞品分析', '用户研究', '数据收集'], level: 'professional' },
  { id: '4', name: '设计师', role: '视觉设计', avatar: '🎨', status: 'offline', activity: 0, tasksCompleted: 0, skills: ['UI设计', '线框图', '品牌视觉', '交互设计'], level: 'professional' },
  { id: '5', name: '工程师', role: '技术实现', avatar: '⚙️', status: 'offline', activity: 0, tasksCompleted: 0, skills: ['代码开发', '技术方案', '系统架构', '性能优化'], level: 'execution' },
  { id: '6', name: '内容运营', role: '内容生产', avatar: '✍️', status: 'offline', activity: 0, tasksCompleted: 0, skills: ['文案撰写', '社媒运营', 'SEO优化', '内容策划'], level: 'execution' },
  { id: '7', name: '数据分析师', role: '数据洞察', avatar: '📉', status: 'offline', activity: 0, tasksCompleted: 0, skills: ['数据建模', '可视化', 'A/B测试', 'BI报表'], level: 'professional' },
  { id: '8', name: '客服专员', role: '客户服务', avatar: '💬', status: 'offline', activity: 0, tasksCompleted: 0, skills: ['问题解答', '反馈收集', '满意度跟踪', 'FAQ维护'], level: 'execution' },
  { id: '9', name: '法务顾问', role: '合规审查', avatar: '⚖️', status: 'offline', activity: 0, tasksCompleted: 0, skills: ['合同审核', '知识产权', '合规检查', '风险评估'], level: 'support' },
  { id: '10', name: '财务助理', role: '财务管理', avatar: '🧮', status: 'offline', activity: 0, tasksCompleted: 0, skills: ['记账', '预算分析', '报表生成', '成本控制'], level: 'support' },
  { id: '11', name: '测试工程师', role: '质量保障', avatar: '🔍', status: 'offline', activity: 0, tasksCompleted: 0, skills: ['功能测试', '自动化测试', '性能测试', 'Bug追踪'], level: 'execution' },
  { id: '12', name: 'DevOps', role: '运维部署', avatar: '🚀', status: 'offline', activity: 0, tasksCompleted: 0, skills: ['CI/CD', '容器化', '监控告警', '自动化运维'], level: 'execution' },
]

export const tasks: Task[] = []
export const outputs: Output[] = []
export const memoryEntries: MemoryEntry[] = []
export const discussions: Discussion[] = []
export const suggestions: Suggestion[] = []

export const taskProgressData = [
  { name: '已完成', value: 0, color: '#10b981' },
  { name: '进行中', value: 0, color: '#3b82f6' },
  { name: '待开始', value: 0, color: '#f59e0b' },
  { name: '已阻塞', value: 0, color: '#ef4444' },
]

export const roleCompositionData = [
  { name: '管理层', value: 2, color: '#7c3aed' },
  { name: '执行层', value: 6, color: '#3b82f6' },
  { name: '专业层', value: 3, color: '#06b6d4' },
  { name: '支援层', value: 1, color: '#f59e0b' },
]

export const weeklyOutputData: { date: string; count: number }[] = []
export const monthlyOutputData: { date: string; count: number }[] = []
