# Frontend AI Interview Trainer｜前端与 AI 应用面试练习平台

一个面向前端开发实习和 AI 应用开发实习的面试复习平台。项目支持结构化题库练习、选择题自动判分、简答题评分、错题复盘、收藏、高频题专项练习，以及通过后端安全接入的真实 AI 批改。

平台优先从后端 API 读取 SQLite 数据库题库；当 API 不可用时，前端会自动 fallback 到本地内置题库，避免页面白屏。

## 技术栈

前端：

- Vue3
- TypeScript
- Vite
- Pinia
- Vue Router
- localStorage

后端：

- Node.js
- Express
- Prisma
- SQLite
- OpenAI-compatible API / DeepSeek

## 核心功能

- 题库浏览、关键词搜索、分类筛选、题型筛选、难度筛选
- 选择题练习与自动判分
- 简答题本地规则评分
- 真实 AI 批改简答题
- AI 异常时自动 fallback 到本地规则评分
- 错题本自动收集与复盘
- 题目收藏
- 高频题练习
- 随机刷题、顺序刷题、只刷错题、只刷收藏、按分类刷题、按题型刷题
- 题库 JSON 导入 SQLite
- 题库 priority / tags 自动标注
- API 不可用时前端 fallback 到本地题库

## 系统架构

整体数据链路：

```text
Vue 前端 -> Express API -> Prisma -> SQLite
```

简答题 AI 批改链路：

```text
用户答案 -> 后端 /api/review-answer -> LLM API -> JSON 解析 -> 前端展示评分结果
```

异常兜底链路：

```text
LLM 失败 / 超时 / JSON 异常 / 字段不合法 -> localRuleReview fallback -> 前端展示本地规则评分
```

API Key 只读取 `server/.env`，不会出现在前端代码中。

## 本地启动

前端：

```bash
npm install
npm run dev
```

服务端：

```bash
cd server
npm install
npm run db:generate
npm run db:migrate
npm run import:questions
npm run dev
```

默认前端开发服务由 Vite 启动，后端 API 默认运行在：

```text
http://localhost:3001
```

## 环境变量

复制 `server/.env.example` 为 `server/.env`，再填写自己的 Key：

```env
LLM_PROVIDER=deepseek
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat
LLM_TIMEOUT_MS=30000
```

注意：`server/.env` 不要提交 Git，项目已在 `.gitignore` 中忽略该文件。

## 常用命令

前端 build：

```bash
npm run build
```

服务端 build：

```bash
cd server
npm run build
```

导入题库：

```bash
cd server
npm run import:questions -- ../data-import/questions.json
```

本地题库 seed：

```bash
cd server
npm run seed:local
```

题库 priority / tags 标注：

```bash
cd server
npm run tag:questions
```

AI 批改 demo：

```bash
cd server
npm run demo:review-answer
```

## AI 批改 Fallback 机制

简答题评分优先走后端 `/api/review-answer`。后端会调用 OpenAI-compatible Chat Completions API，并要求模型返回结构化 JSON。

以下情况会自动 fallback 到本地规则评分：

- 缺少 API Key
- 请求超时
- 模型接口返回异常
- 模型返回内容不是合法 JSON
- 返回字段不合法
- 前端请求后端失败

fallback 会返回同样结构的评分结果，并标记：

```json
{
  "source": "local_fallback"
}
```

AI 成功批改时会标记：

```json
{
  "source": "ai"
}
```

## 项目亮点

- 不是单纯题库，而是带评分、反馈、错题复盘的练习平台。
- 前后端分离，前端负责练习体验，后端负责题库 API、数据库和 AI 批改代理。
- 题库数据库化，当前 SQLite 中已有 580 道结构化面试题。
- 支持随机、顺序、错题、收藏、高频、分类和题型等多种刷题模式。
- AI 批改与本地规则评分双通道，演示时更稳定。
- API Key 只在服务端环境变量中读取，避免暴露到浏览器。
- API 不可用时自动 fallback 到本地题库，保证基础练习可用。
- 题库支持导入、分类治理、priority / tags 标注，后续扩展成本低。

## 面试 1 分钟介绍

这个项目是我做的一个前端与 AI 应用面试练习平台，目标不是简单展示题库，而是帮助用户真正完成刷题、评分和复盘。前端使用 Vue3、TypeScript、Vite、Pinia 和 Vue Router，支持题库浏览、搜索筛选、随机刷题、顺序刷题、错题本、收藏和高频题练习。后端使用 Express、Prisma 和 SQLite，把题库数据库化，目前有 580 道结构化题目。简答题评分有两套机制：默认可以用本地关键词规则评分，也可以通过后端 `/api/review-answer` 调用 DeepSeek 这类 OpenAI-compatible 模型做 AI 批改。为了稳定性，API Key 只放在服务端，如果模型超时、报错或 JSON 解析失败，会自动 fallback 到本地评分，保证页面不会崩。这个项目重点体现了前后端分离、数据持久化、AI 能力接入和工程兜底设计。

## 后续计划

- 接入用户登录
- 练习记录后端持久化
- 代码题在线运行
- 更多 AI 追问
- 部署上线
