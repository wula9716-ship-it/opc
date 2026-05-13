# OPC OS 项目记忆

> 在任何电脑上打开 OPC OS 项目时，把这份文件给 AI 看，它就能接上上下文。

## 项目概况

OPC OS（One Person Company Operating System）是一个 AI 驱动的一人公司操作系统。
让一个人像管理一家完整公司那样管理 AI Agent 团队。

- **技术栈**: Next.js 14 + TypeScript + Tailwind CSS + Electron
- **GitHub**: https://github.com/wula9716-ship-it/opc
- **本地路径**: `D:\ai文件\opc-os`（Windows）

## 当前进度（2026-05-13）

### 已完成
- [x] 9个核心页面全部搭建
- [x] 10个 AI 平台接入（OpenAI、Claude、Gemini、DeepSeek、通义、智谱、Kimi、文心、硅基流动、OpenRouter）
- [x] 统一 AI 客户端 + 流式输出
- [x] 12个可复用组件
- [x] 桌面快捷方式（通过 C:\opc-os 目录联接绕过中文路径问题）
- [x] 代码推送到 GitHub
- [x] Electron 桌面应用模式运行

### 待完成 / 可优化
- [ ] electron-builder 打包 exe（中文路径导致失败，需要从纯英文路径 build）
- [ ] 持久化数据存储（目前用 localStorage + mock 数据）
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

## 已知问题

1. **中文路径**: Electron 相关工具（electron-builder）对中文路径支持差，打包需要从纯英文路径操作
2. **端口占用**: 3000 端口可能被之前的进程占用，launch.bat 已内置自动清理
3. **首次启动慢**: Electron dev 模式需要等 Next.js 编译完成，约 10-30 秒

## 呜啦的偏好

- 喜欢「程序一样」的桌面应用体验，不喜欢纯网页
- 希望能在多台电脑上同步使用
- 项目名叫 OPC OS，是一人公司操作系统
