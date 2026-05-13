/**
 * 技能匹配算法
 * 根据任务所需技能，为每个候选 Agent 评分，选出最佳人选
 */

import { SkillRequirement, MatchScore, AgentCapability } from './types'
import { getOnlineAgents, getAgentCapability } from './agent-registry'

// 各维度权重（总和 = 1）
const WEIGHTS = {
  skill: 0.50,       // 技能匹配度
  load: 0.25,        // 负载均衡（越空闲越好）
  reliability: 0.15,  // 历史可靠性
  response: 0.10,     // 响应速度
}

/**
 * 计算单个 Agent 对某项技能的匹配分
 */
function skillMatchScore(agent: AgentCapability, req: SkillRequirement): number {
  const skill = agent.skills.find(s => s.name === req.skill)
  if (!skill) return 0

  // 熟练度必须达到最低要求
  if (skill.proficiency < req.minProficiency) return 0

  // 基础分 = 熟练度 * 质量评分加权
  const base = skill.proficiency * 0.6 + skill.avgQuality * 0.4

  // 经验加成：完成过同类任务越多，分越高（对数衰减）
  const experienceBonus = Math.min(15, Math.log2(skill.taskCount + 1) * 3)

  return Math.min(100, base + experienceBonus)
}

/**
 * 计算 Agent 对一组技能需求的综合技能分
 */
function aggregateSkillScore(agent: AgentCapability, requirements: SkillRequirement[]): { score: number; matchedSkills: string[]; missingSkills: string[] } {
  if (requirements.length === 0) return { score: 50, matchedSkills: [], missingSkills: [] }

  let totalWeight = 0
  let weightedScore = 0
  const matched: string[] = []
  const missing: string[] = []

  for (const req of requirements) {
    const score = skillMatchScore(agent, req)
    totalWeight += req.weight

    if (score > 0) {
      weightedScore += score * req.weight
      matched.push(req.skill)
    } else {
      missing.push(req.skill)
    }
  }

  // 如果有必须的技能完全缺失，严重扣分
  const missingPenalty = missing.length > 0 ? Math.max(0, 100 - missing.length * 30) / 100 : 1
  const finalScore = totalWeight > 0 ? (weightedScore / totalWeight) * missingPenalty : 0

  return { score: Math.round(finalScore), matchedSkills: matched, missingSkills: missing }
}

/**
 * 计算负载分（越空闲分越高）
 */
function loadScore(agent: AgentCapability): number {
  return Math.max(0, 100 - agent.workload.utilizationRate)
}

/**
 * 计算可靠性分
 */
function reliabilityScore(agent: AgentCapability): number {
  return agent.reliability
}

/**
 * 计算响应速度分
 */
function responseScore(agent: AgentCapability): number {
  // 响应时间越短越好，5秒以内满分，超过30秒为0
  return Math.max(0, Math.min(100, 100 - (agent.avgResponseTime - 3) * (100 / 27)))
}

/**
 * 为一个子任务匹配最佳 Agent
 * 返回所有候选 Agent 的评分列表，按总分降序
 */
export function matchAgents(requirements: SkillRequirement[]): MatchScore[] {
  const agents = getOnlineAgents()
  const scores: MatchScore[] = []

  for (const agent of agents) {
    const skillResult = aggregateSkillScore(agent, requirements)
    const lScore = loadScore(agent)
    const rScore = reliabilityScore(agent)
    const respScore = responseScore(agent)

    const totalScore = Math.round(
      skillResult.score * WEIGHTS.skill +
      lScore * WEIGHTS.load +
      rScore * WEIGHTS.reliability +
      respScore * WEIGHTS.response
    )

    const reasons: string[] = []
    if (skillResult.matchedSkills.length > 0) {
      reasons.push(`擅长 ${skillResult.matchedSkills.join('、')}`)
    }
    if (skillResult.missingSkills.length > 0) {
      reasons.push(`缺少 ${skillResult.missingSkills.join('、')}`)
    }
    if (lScore > 70) reasons.push('当前空闲')
    if (rScore > 85) reasons.push('可靠性高')
    if (agent.workload.utilizationRate > 80) reasons.push('负载较高')

    scores.push({
      agentId: agent.agentId,
      agentName: agent.agentName,
      totalScore,
      skillScore: skillResult.score,
      loadScore: lScore,
      reliabilityScore: rScore,
      reasons,
    })
  }

  // 按总分降序
  scores.sort((a, b) => b.totalScore - a.totalScore)
  return scores
}

/**
 * 快捷函数：直接选出最佳 Agent
 */
export function findBestAgent(requirements: SkillRequirement[]): MatchScore | null {
  const scores = matchAgents(requirements)
  return scores.length > 0 && scores[0].totalScore > 0 ? scores[0] : null
}

/**
 * 为一组子任务做全局最优分配（匈牙利算法简化版）
 * 避免同一个 Agent 被过度分配
 */
export function batchAssign(subtasks: { id: string; requirements: SkillRequirement[] }[]): Map<string, string> {
  // subtaskId -> agentId
  const assignments = new Map<string, string>()
  // agentId -> 已分配数
  const agentLoad = new Map<string, number>()

  // 按技能需求的独特性排序（需求越特殊的任务越先分配）
  const sorted = [...subtasks].sort((a, b) => {
    const aUniq = a.requirements.reduce((sum, r) => sum + r.weight, 0)
    const bUniq = b.requirements.reduce((sum, r) => sum + r.weight, 0)
    return bUniq - aUniq
  })

  for (const task of sorted) {
    const candidates = matchAgents(task.requirements)

    // 选一个还没被过度分配的最佳候选人
    for (const candidate of candidates) {
      const currentLoad = agentLoad.get(candidate.agentId) ?? 0
      if (currentLoad < 3) { // 每个 Agent 最多同时分配 3 个新任务
        assignments.set(task.id, candidate.agentId)
        agentLoad.set(candidate.agentId, currentLoad + 1)
        break
      }
    }

    // 如果所有候选人都满了，分配给得分最高的
    if (!assignments.has(task.id) && candidates.length > 0) {
      assignments.set(task.id, candidates[0].agentId)
    }
  }

  return assignments
}
