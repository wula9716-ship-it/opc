# OPC OS — One Person Company Operating System

AI 驱动的一人公司操作系统。让一个人像管理一家完整公司那样管理 AI Agent 团队。

## 功能模块（v0.2）

### 核心页面
- **仪表盘** — 6个KPI卡片 + 4个图表 + 任务表 + 讨论流 + 产出卡片 + 建议
- **任务中心** — 列表/看板双视图、按状态筛选、新建任务弹窗、标签系统
- **Agent 库** — 12个角色卡片、活跃度监控、技能标签、层级分类
- **工作流引擎** — 5个预置模板、步骤可视化、模拟运行
- **群聊** — 真实 AI 对话（流式输出）、Agent 角色切换
- **产出中心** — 文件管理、状态流转、新建产出弹窗
- **记忆库** — 全文搜索、分类筛选、详情面板、新增条目弹窗
- **分析报表** — 产出趋势、Agent排名、效能指标
- **设置** — AI 平台接入、通用配置、预算管理

### AI 平台接入（10个平台）
| 平台 | 区域 | 兼容模式 |
|------|------|---------|
| OpenAI | 🌍 | 原生 |
| Anthropic Claude | 🌍 | Anthropic格式 |
| Google Gemini | 🌍 | Gemini格式 |
| DeepSeek | 🇨🇳 | OpenAI兼容 |
| 通义千问 | 🇨🇳 | OpenAI兼容 |
| 智谱 AI | 🇨🇳 | OpenAI兼容 |
| Moonshot/Kimi | 🇨🇳 | OpenAI兼容 |
| 百度文心 | 🇨🇳 | 自定义 |
| 硅基流动 | 🇨🇳 | OpenAI兼容 |
| OpenRouter | 🌍 | OpenAI兼容 |

### 技术特性
- 统一 AI 客户端（自动路由到正确的 API 格式）
- 流式输出（SSE）
- localStorage 持久化配置
- 免费模型推荐
- 多平台共存
- 响应式布局（侧边栏可折叠）
- 错误边界
- 404 页面

## 技术栈

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts

## 快速开始

```powershell
cd D:\ai文件\opc-os
npm install
npm run dev
```

打开 http://localhost:3000

首次使用：
1. 进入 **设置 → AI 平台接入**
2. 选择一个平台（推荐硅基流动或智谱，有免费模型）
3. 填入 API Key → 测试连接 → 确认接入
4. 返回 **群聊** 页面，选择 Agent 开始对话

## 项目结构

```
src/
├── app/                   # 9个页面 + 错误/加载态
│   ├── page.tsx           # 仪表盘
│   ├── tasks/             # 任务中心
│   ├── agents/            # Agent 库
│   ├── workflows/         # 工作流引擎
│   ├── chat/              # 群聊（AI对话）
│   ├── outputs/           # 产出中心
│   ├── memory/            # 记忆库
│   ├── analytics/         # 分析报表
│   └── settings/          # 设置（AI平台接入）
├── components/            # 12个可复用组件
│   ├── Modal.tsx           # 通用弹窗
│   ├── TaskForm.tsx        # 新建任务表单
│   ├── OutputForm.tsx      # 新建产出表单
│   ├── MemoryForm.tsx      # 新增记忆表单
│   ├── ErrorBoundary.tsx   # 错误边界
│   └── ...                 # 图表、表格等
├── lib/
│   ├── ai-providers/       # AI 平台抽象层
│   │   ├── types.ts        # 统一接口定义
│   │   ├── registry.ts     # 10个平台配置
│   │   ├── client.ts       # 统一客户端
│   │   ├── store.ts        # 持久化存储
│   │   └── chat-engine.ts  # Agent对话引擎
│   ├── data.ts             # Mock 数据
│   └── utils.ts            # 工具函数
└── types/                  # TypeScript 类型
```
