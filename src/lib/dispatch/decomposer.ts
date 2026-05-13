/**
 * 任务拆解引擎
 * 把高层任务拆解为可分派的子任务，建立依赖关系
 *
 * 核心逻辑：
 * 1. 识别任务类型（产品开发/内容创作/数据分析/运维部署/...）
 * 2. 匹配预置的拆解模板
 * 3. 根据具体描述微调子任务
 * 4. 建立依赖图（DAG）
 */

import { Subtask, SkillRequirement, DispatchedTask } from './types'

// ============ 技能需求常量 ============

const SKILLS = {
  REQUIREMENT_ANALYSIS: { skill: '需求分析', minProficiency: 70, weight: 1.0 } as SkillRequirement,
  TASK_DECOMPOSITION: { skill: '任务拆解', minProficiency: 70, weight: 0.8 } as SkillRequirement,
  RESEARCH: { skill: '市场调研', minProficiency: 70, weight: 1.0 } as SkillRequirement,
  COMPETITOR_ANALYSIS: { skill: '竞品分析', minProficiency: 70, weight: 0.9 } as SkillRequirement,
  UI_DESIGN: { skill: 'UI设计', minProficiency: 75, weight: 1.0 } as SkillRequirement,
  INTERACTION_DESIGN: { skill: '交互设计', minProficiency: 70, weight: 0.8 } as SkillRequirement,
  WIREFRAME: { skill: '线框图', minProficiency: 70, weight: 0.9 } as SkillRequirement,
  CODE_DEV: { skill: '代码开发', minProficiency: 75, weight: 1.0 } as SkillRequirement,
  TECH_SOLUTION: { skill: '技术方案', minProficiency: 70, weight: 0.9 } as SkillRequirement,
  API_DESIGN: { skill: 'API设计', minProficiency: 70, weight: 0.8 } as SkillRequirement,
  TESTING: { skill: '功能测试', minProficiency: 70, weight: 1.0 } as SkillRequirement,
  AUTO_TEST: { skill: '自动化测试', minProficiency: 70, weight: 0.8 } as SkillRequirement,
  CICD: { skill: 'CI/CD', minProficiency: 70, weight: 0.9 } as SkillRequirement,
  COPYWRITING: { skill: '文案撰写', minProficiency: 75, weight: 1.0 } as SkillRequirement,
  CONTENT_PLANNING: { skill: '内容策划', minProficiency: 70, weight: 0.8 } as SkillRequirement,
  SEO: { skill: 'SEO优化', minProficiency: 70, weight: 0.7 } as SkillRequirement,
  DATA_ANALYSIS: { skill: '数据分析', minProficiency: 70, weight: 1.0 } as SkillRequirement,
  DATA_VIZ: { skill: '数据可视化', minProficiency: 70, weight: 0.8 } as SkillRequirement,
  RISK_ASSESSMENT: { skill: '风险预警', minProficiency: 70, weight: 0.8 } as SkillRequirement,
  DOC_WRITING: { skill: '文档撰写', minProficiency: 70, weight: 0.7 } as SkillRequirement,
  BRAND_DESIGN: { skill: '品牌设计', minProficiency: 70, weight: 0.9 } as SkillRequirement,
  PROGRESS_TRACK: { skill: '进度跟踪', minProficiency: 70, weight: 0.7 } as SkillRequirement,
  DECISION_SUPPORT: { skill: '决策支持', minProficiency: 70, weight: 0.8 } as SkillRequirement,
}

let subtaskCounter = 0
function nextSubtaskId(): string {
  subtaskCounter++
  return `sub-${Date.now()}-${subtaskCounter}`
}

// ============ 拆解模板 ============

interface SubtaskTemplate {
  title: string
  description: string
  requiredSkills: SkillRequirement[]
  estimatedMinutes: number
  priority: 'high' | 'medium' | 'low'
  dependsOnIndex: number[] // 依赖的子任务在数组中的索引
}

const DECOMPOSITION_TEMPLATES: Record<string, SubtaskTemplate[]> = {
  // 产品开发流程
  product_development: [
    { title: '需求分析', description: '分析用户需求，明确功能范围和优先级', requiredSkills: [SKILLS.REQUIREMENT_ANALYSIS], estimatedMinutes: 20, priority: 'high', dependsOnIndex: [] },
    { title: '竞品调研', description: '调研市场上同类产品，找到差异化切入点', requiredSkills: [SKILLS.RESEARCH, SKILLS.COMPETITOR_ANALYSIS], estimatedMinutes: 40, priority: 'high', dependsOnIndex: [] },
    { title: '撰写 PRD', description: '产出产品需求文档，包含功能列表、用户故事、验收标准', requiredSkills: [SKILLS.REQUIREMENT_ANALYSIS, SKILLS.DOC_WRITING], estimatedMinutes: 30, priority: 'high', dependsOnIndex: [0] },
    { title: '交互设计', description: '设计用户交互流程和页面结构', requiredSkills: [SKILLS.INTERACTION_DESIGN, SKILLS.WIREFRAME], estimatedMinutes: 40, priority: 'medium', dependsOnIndex: [2] },
    { title: 'UI 视觉设计', description: '产出高保真 UI 设计稿', requiredSkills: [SKILLS.UI_DESIGN, SKILLS.BRAND_DESIGN], estimatedMinutes: 60, priority: 'medium', dependsOnIndex: [3] },
    { title: '技术方案设计', description: '确定技术架构、API 接口、数据模型', requiredSkills: [SKILLS.TECH_SOLUTION, SKILLS.API_DESIGN], estimatedMinutes: 30, priority: 'high', dependsOnIndex: [2] },
    { title: '前端开发', description: '实现前端页面和交互', requiredSkills: [SKILLS.CODE_DEV], estimatedMinutes: 90, priority: 'medium', dependsOnIndex: [4, 5] },
    { title: '后端开发', description: '实现后端接口和业务逻辑', requiredSkills: [SKILLS.CODE_DEV, SKILLS.API_DESIGN], estimatedMinutes: 90, priority: 'medium', dependsOnIndex: [5] },
    { title: '测试验收', description: '功能测试、回归测试、产出测试报告', requiredSkills: [SKILLS.TESTING, SKILLS.AUTO_TEST], estimatedMinutes: 40, priority: 'high', dependsOnIndex: [6, 7] },
    { title: '部署上线', description: 'CI/CD 配置、部署到生产环境', requiredSkills: [SKILLS.CICD], estimatedMinutes: 20, priority: 'medium', dependsOnIndex: [8] },
    { title: '项目复盘', description: '总结项目过程中的经验和教训', requiredSkills: [SKILLS.PROGRESS_TRACK, SKILLS.DECISION_SUPPORT], estimatedMinutes: 15, priority: 'low', dependsOnIndex: [9] },
  ],

  // 内容营销流程
  content_marketing: [
    { title: '选题策划', description: '基于用户画像和热点趋势确定选题方向', requiredSkills: [SKILLS.CONTENT_PLANNING, SKILLS.DATA_ANALYSIS], estimatedMinutes: 15, priority: 'high', dependsOnIndex: [] },
    { title: '关键词研究', description: 'SEO 关键词调研和竞争度分析', requiredSkills: [SKILLS.SEO, SKILLS.DATA_ANALYSIS], estimatedMinutes: 20, priority: 'medium', dependsOnIndex: [0] },
    { title: '内容撰写', description: '撰写长文内容', requiredSkills: [SKILLS.COPYWRITING], estimatedMinutes: 40, priority: 'high', dependsOnIndex: [0, 1] },
    { title: '配图设计', description: '设计文章配图和封面', requiredSkills: [SKILLS.UI_DESIGN, SKILLS.BRAND_DESIGN], estimatedMinutes: 25, priority: 'medium', dependsOnIndex: [2] },
    { title: '内容审校', description: '审核内容质量、事实准确性和品牌调性', requiredSkills: [SKILLS.COPYWRITING, SKILLS.REQUIREMENT_ANALYSIS], estimatedMinutes: 15, priority: 'high', dependsOnIndex: [2] },
    { title: 'SEO 优化', description: '优化标题、Meta 标签、内链外链', requiredSkills: [SKILLS.SEO], estimatedMinutes: 10, priority: 'medium', dependsOnIndex: [4] },
    { title: '多渠道分发', description: '发布到各内容平台并优化格式', requiredSkills: [SKILLS.CONTENT_PLANNING], estimatedMinutes: 15, priority: 'low', dependsOnIndex: [3, 5] },
    { title: '数据追踪', description: '追踪阅读量、转化率等指标', requiredSkills: [SKILLS.DATA_ANALYSIS, SKILLS.DATA_VIZ], estimatedMinutes: 10, priority: 'low', dependsOnIndex: [6] },
  ],

  // 数据分析流程
  data_analysis: [
    { title: '需求明确', description: '确定分析目标、范围和关键指标', requiredSkills: [SKILLS.REQUIREMENT_ANALYSIS], estimatedMinutes: 10, priority: 'high', dependsOnIndex: [] },
    { title: '数据收集', description: '从各来源收集相关数据', requiredSkills: [SKILLS.DATA_ANALYSIS], estimatedMinutes: 25, priority: 'high', dependsOnIndex: [0] },
    { title: '数据清洗', description: '处理缺失值、异常值、格式标准化', requiredSkills: [SKILLS.DATA_ANALYSIS], estimatedMinutes: 20, priority: 'high', dependsOnIndex: [1] },
    { title: '深度分析', description: '统计分析、趋势识别、关联挖掘', requiredSkills: [SKILLS.DATA_ANALYSIS, SKILLS.RESEARCH], estimatedMinutes: 40, priority: 'high', dependsOnIndex: [2] },
    { title: '数据可视化', description: '产出图表和数据看板', requiredSkills: [SKILLS.DATA_VIZ], estimatedMinutes: 25, priority: 'medium', dependsOnIndex: [3] },
    { title: '报告撰写', description: '产出分析报告，包含洞察和建议', requiredSkills: [SKILLS.DOC_WRITING, SKILLS.DECISION_SUPPORT], estimatedMinutes: 30, priority: 'high', dependsOnIndex: [3, 4] },
  ],

  // 竞品分析流程
  competitor_analysis: [
    { title: '竞品筛选', description: '确定直接竞品和间接竞品列表', requiredSkills: [SKILLS.RESEARCH], estimatedMinutes: 15, priority: 'high', dependsOnIndex: [] },
    { title: '功能对比', description: '逐一对比各竞品的核心功能', requiredSkills: [SKILLS.COMPETITOR_ANALYSIS, SKILLS.RESEARCH], estimatedMinutes: 35, priority: 'high', dependsOnIndex: [0] },
    { title: '定价分析', description: '对比各竞品的定价策略和商业模式', requiredSkills: [SKILLS.COMPETITOR_ANALYSIS, SKILLS.DATA_ANALYSIS], estimatedMinutes: 20, priority: 'medium', dependsOnIndex: [0] },
    { title: '用户口碑', description: '收集竞品的用户评价和反馈', requiredSkills: [SKILLS.RESEARCH], estimatedMinutes: 25, priority: 'medium', dependsOnIndex: [0] },
    { title: 'SWOT 分析', description: '基于调研结果做优劣势分析', requiredSkills: [SKILLS.COMPETITOR_ANALYSIS, SKILLS.DECISION_SUPPORT], estimatedMinutes: 20, priority: 'high', dependsOnIndex: [1, 2, 3] },
    { title: '策略建议', description: '产出差异化策略建议', requiredSkills: [SKILLS.DECISION_SUPPORT, SKILLS.DOC_WRITING], estimatedMinutes: 20, priority: 'high', dependsOnIndex: [4] },
  ],
}

// ============ 任务类型识别 ============

function identifyTaskType(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase()

  if (text.match(/产品|功能|开发|上线|发布|prd|需求|landing|落地页|网站|app/)) return 'product_development'
  if (text.match(/内容|文章|博客|社媒|营销|文案|seo|公众号|小红书/)) return 'content_marketing'
  if (text.match(/数据|分析|报表|指标|转化|漏斗|埋点|看板/)) return 'data_analysis'
  if (text.match(/竞品|对手|竞争|市场|调研|对比/)) return 'competitor_analysis'

  // 默认走产品开发流程
  return 'product_development'
}

// ============ 主拆解函数 ============

/**
 * 将高层任务拆解为子任务 DAG
 */
export function decomposeTask(
  taskId: string,
  title: string,
  description: string
): DispatchedTask {
  const taskType = identifyTaskType(title, description)
  const templates = DECOMPOSITION_TEMPLATES[taskType] ?? DECOMPOSITION_TEMPLATES.product_development

  // 从模板生成子任务
  const subtasks: Subtask[] = templates.map((tpl, index) => ({
    id: nextSubtaskId(),
    parentTaskId: taskId,
    title: tpl.title,
    description: tpl.description,
    requiredSkills: tpl.requiredSkills,
    assignedAgentId: null,
    status: 'queued' as const,
    dependsOn: [], // 下面填充
    blocks: [],
    priority: tpl.priority,
    estimatedMinutes: tpl.estimatedMinutes,
    actualMinutes: null,
    result: null,
    resultArtifacts: [],
    startedAt: null,
    completedAt: null,
    retryCount: 0,
    maxRetries: 2,
    handoffFrom: null,
    handoffTo: null,
  }))

  // 建立依赖关系
  for (let i = 0; i < templates.length; i++) {
    for (const depIdx of templates[i].dependsOnIndex) {
      if (depIdx >= 0 && depIdx < subtasks.length) {
        subtasks[i].dependsOn.push(subtasks[depIdx].id)
        subtasks[depIdx].blocks.push(subtasks[i].id)
      }
    }
  }

  return {
    id: taskId,
    title,
    description,
    createdBy: 'user',
    creatorAgentId: null,
    strategy: 'skill_match',
    subtasks,
    status: 'planning',
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
  }
}

/**
 * 识别哪些子任务当前可执行（所有前置依赖已完成）
 */
export function getReadySubtasks(task: DispatchedTask): Subtask[] {
  return task.subtasks.filter(s => {
    if (s.status !== 'queued') return false
    return s.dependsOn.every(depId => {
      const dep = task.subtasks.find(ds => ds.id === depId)
      return dep?.status === 'completed'
    })
  })
}

/**
 * 更新任务进度
 */
export function updateTaskProgress(task: DispatchedTask): void {
  const total = task.subtasks.length
  const completed = task.subtasks.filter(s => s.status === 'completed').length
  task.progress = total > 0 ? Math.round((completed / total) * 100) : 0

  if (completed === total && total > 0) {
    task.status = 'completed'
    task.completedAt = new Date().toISOString()
  } else if (task.subtasks.some(s => s.status === 'running')) {
    task.status = 'executing'
  } else if (task.subtasks.some(s => s.status === 'assigned')) {
    task.status = 'dispatching'
  }

  task.updatedAt = new Date().toISOString()
}
