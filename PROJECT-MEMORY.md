# OPC OS 项目记忆

> 在任何电脑上打开 OPC OS 项目时，把这份文件给 AI 看，它就能接上上下文。

## 项目概况

OPC OS（One Person Company Operating System）是一个 AI 驱动的一人公司操作系统。
让一个人像管理一家完整公司那样管理 AI Agent 团队。

- **技术栈**: Next.js 14 + TypeScript + Tailwind CSS + Electron
- **GitHub**: https://github.com/wula9716-ship-it/opc
- **本地路径**: `D:\ai文件\opc-os`（Windows）

## 当前进度（2026-05-14）

### 已完成
- [x] 9个核心页面全部搭建
- [x] 10个 AI 平台接入 + 自定义平台（支持多个）
- [x] 统一 AI 客户端 + 流式输出
- [x] 12个可复用组件
- [x] 桌面快捷方式（通过 C:\opc-os 目录联接绕过中文路径问题）
- [x] 代码推送到 GitHub
- [x] Electron 桌面应用模式运行
- [x] 真正 AI 执行引擎 — 创建任务后自动拆解、分配 Agent、调用 API 执行、级联推进
- [x] 子任务完成后自动创建产出记录 + 任务列表状态实时同步
- [x] Agent 自动发现平台优化建议（6个维度分析）
- [x] 优化建议导出 Markdown + 一键清空
- [x] 所有平台支持手动输入模型 ID + 自动拉取模型列表
- [x] Agent 模型绑定（每个 Agent 可指定不同大模型）
- [x] 取消调度功能
- [x] 性能优化 — 8个独立轮询合并为全局心跳
- [x] 子任务失败自动重试（最多2次）
- [x] 执行耗时显示
- [x] 错误边界友好提示 + 一键反馈到 GitHub Issues
- [x] CSP 安全策略
- [x] 通知中心/Modal Portal 渲染（修复被 backdropFilter 遮挡）

### 待完成 / 可优化
- [ ] electron-builder 打包 exe（中文路径导致失败，需要从纯英文路径 build）
- [ ] 真实 Agent 调度系统（目前 dispatch 是模拟的）
- [ ] 用户认证系统
- [ ] 移动端适配

## 核心页面结构

```
src/app/
├── page.tsx           # 仪表盘（KPI + 图表 + 任务表 + 讨论流）
├── tasks/             # 任务中心（列表/看板双视图）
├── agents/            # Agent 库（12个角色卡片）
├── workflows/         # 工作流引擎（5个预置模板）
├── chat/              # 群聊（真实 AI 对话，流式输出）
├── outputs/           # 产出中心（文件管理）
├── memory/            # 记忆库（全文搜索 + 分类）
├── analytics/         # 分析报表
├── settings/          # 设置（AI 平台配置）
├── dispatch/          # 任务调度监控
├── calendar/          # 日历
└── archive/           # 归档
```

## AI 平台接入架构

文件位置: `src/lib/ai-providers/`

- `types.ts` — 统一接口定义
- `registry.ts` — 10个平台配置（模型列表、endpoint、兼容模式）
- `client.ts` — 统一客户端（自动路由到正确的 API 格式）
- `store.ts` — localStorage 持久化 API Key
- `chat-engine.ts` — Agent 对话引擎

兼容模式:
- `openai` — OpenAI、DeepSeek、通义、智谱、Kimi、硅基流动、OpenRouter
- `anthropic` — Claude
- `gemini` — Google Gemini
- `baidu` — 百度文心

## 启动方式

### 本机开发
```bash
cd D:\ai文件\opc-os
npm run electron:dev    # Electron 桌面应用
npm run dev             # 纯 Web 版（浏览器打开 localhost:3000）
```

### 其他电脑
```bash
git clone https://github.com/wula9716-ship-it/opc.git
cd opc
npm install
npm run electron:dev
```

### 快捷方式（本机）
桌面有「OPC OS」快捷方式，通过以下链路启动：
`快捷方式` → `wscript.exe` → `C:\opc-os\run.vbs` → `launch.bat` → `npm run electron:dev`
（C:\opc-os 是指向 D:\ai文件\opc-os 的目录联接，绕过中文路径编码问题）

### 调式
- Electron 内按 **Ctrl+Shift+I** 打开开发者工具
- 所有 Toast 通知由 DispatchWatcher 驱动，子任务执行事件会自动弹出

## 架构关键点
- `src/lib/dispatch/executor.ts` — AI 执行引擎，真正调用 API
- `src/lib/dispatch/dispatcher.ts` — 任务拆解、Agent 匹配、分派、级联
- `src/lib/heartbeat.ts` — 全局心跳，合并所有轮询
- `src/components/TaskForm.tsx` — 任务创建入口，内部直接调用 createAndExecute
- `src/components/OptimizationPanel.tsx` — 优化建议展示 + 导出
- 所有弹窗/通知都用 Portal 渲染到 body，避免 backdropFilter 层叠问题

## 已知问题

1. **中文路径**: Electron 相关工具（electron-builder）对中文路径支持差，打包需要从纯英文路径操作
2. **端口占用**: 3000 端口可能被之前的进程占用，launch.bat 已内置自动清理
3. **首次启动慢**: Electron dev 模式需要等 Next.js 编译完成，约 10-30 秒

## 呜啦的偏好

- 喜欢「程序一样」的桌面应用体验，不喜欢纯网页
- 希望能在多台电脑上同步使用
- 项目名叫 OPC OS，是一人公司操作系统
