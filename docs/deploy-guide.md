# 线上部署指南

本文档用于把“Frontend AI Interview Trainer｜前端与 AI 应用面试练习平台”部署到线上，让手机可以直接打开网址使用。

推荐部署方式：

- 前端：Vercel
- 后端：Render 或 Railway
- 数据库：Neon / Supabase / Railway Postgres
- AI 批改：DeepSeek 或其他 OpenAI-compatible API

## 1. 创建 PostgreSQL 数据库

可以任选一个 PostgreSQL 托管服务：

- Neon
- Supabase
- Railway Postgres

创建数据库后，复制连接字符串。线上通常需要 SSL，格式类似：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
```

## 2. 配置服务端环境变量

在 Render / Railway 的后端服务环境变量中配置：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
PORT=3001
CORS_ORIGIN=http://localhost:5173,https://your-app.vercel.app
LLM_PROVIDER=deepseek
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat
LLM_TIMEOUT_MS=30000
```

说明：

- `DATABASE_URL` 填线上 PostgreSQL 地址。
- `CORS_ORIGIN` 填允许访问后端的前端域名，多个域名用英文逗号分隔。
- `LLM_API_KEY` 只配置在后端部署平台，不要写进前端，也不要提交到 Git。
- `PORT` 在 Render / Railway 上通常会由平台自动注入；保留默认值方便本地运行。

## 3. 部署后端

后端目录是 `server/`。

Render / Railway 配置建议：

```bash
cd server
npm install
npm run db:generate
npm run build
```

启动命令：

```bash
cd server
npm run start
```

后端启动后，健康检查接口：

```text
GET /health
```

题库接口：

```text
GET /api/questions?page=1&pageSize=20
GET /api/questions/categories
```

AI 批改接口：

```text
POST /api/review-answer
```

## 4. 运行 Prisma Migrate

线上数据库初始化或发版后，在后端环境执行：

```bash
cd server
npm run db:migrate
```

当前 `db:migrate` 使用：

```bash
prisma migrate deploy
```

它适合线上环境，不会打开交互式迁移流程。

本地如果要继续开发迁移，可以使用：

```bash
cd server
npm run db:migrate:dev
```

## 5. 导入题库

数据库建表后，导入结构化题库：

```bash
cd server
npm run import:questions -- ../data-import/questions.json
```

导入后可运行标注脚本，补齐 priority / tags 治理结果：

```bash
cd server
npm run tag:questions
```

验证数据库是否有题：

```text
GET https://your-backend.onrender.com/api/questions?page=1&pageSize=20
GET https://your-backend.onrender.com/api/questions/categories
```

## 6. 配置 AI 批改

服务端通过 OpenAI-compatible Chat Completions API 调用模型。

DeepSeek 示例：

```env
LLM_PROVIDER=deepseek
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat
LLM_TIMEOUT_MS=30000
```

如果没有配置 `LLM_API_KEY`，或者模型超时、报错、返回 JSON 不合法，后端会自动 fallback 到本地规则评分，不会导致页面崩溃。

## 7. 部署前端

前端部署到 Vercel，根目录就是项目根目录。

Vercel 常用配置：

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

前端环境变量：

```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

也可以写成：

```env
VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

前端代码会自动兼容这两种写法。本地不配置时，默认请求：

```text
http://localhost:3001/api
```

## 8. 配置 CORS_ORIGIN

后端 `CORS_ORIGIN` 需要包含本地和线上前端域名：

```env
CORS_ORIGIN=http://localhost:5173,https://your-app.vercel.app
```

如果 Vercel 有预览环境，也可以把预览域名加入逗号列表。

## 9. 本地运行说明

当前线上版本 Prisma provider 已切换为 PostgreSQL。推荐本地也使用一个本地 PostgreSQL 或 Neon/Supabase 开发库：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
```

然后执行：

```bash
cd server
npm install
npm run db:generate
npm run db:migrate
npm run import:questions -- ../data-import/questions.json
npm run dev
```

如果你想继续使用旧 SQLite 本地库，需要保留旧版本代码或单独维护一个 SQLite 分支，因为当前 Prisma schema 已经面向 PostgreSQL。

前端本地启动：

```bash
npm install
npm run dev
```

## 10. 常见问题

### 前端打不开后端

检查：

- `VITE_API_BASE_URL` 是否配置为后端线上地址。
- 后端服务是否启动成功。
- 后端 `/health` 是否能访问。
- Render 免费服务可能冷启动，首次访问需要等待一会儿。

### CORS 报错

检查后端环境变量：

```env
CORS_ORIGIN=http://localhost:5173,https://your-app.vercel.app
```

确保线上前端域名和浏览器地址栏里的域名完全一致，包括协议 `https://`。

### 数据库没有题

先确认迁移是否执行：

```bash
cd server
npm run db:migrate
```

再导入题库：

```bash
cd server
npm run import:questions -- ../data-import/questions.json
```

最后访问：

```text
GET /api/questions/categories
```

### AI 批改一直 fallback

可能原因：

- 没有配置 `LLM_API_KEY`
- `LLM_BASE_URL` 或 `LLM_MODEL` 配置错误
- 模型请求超时
- 模型返回内容不是合法 JSON
- 部署平台网络无法访问模型服务

fallback 是预期保护机制，页面会继续显示本地规则评分。

### API Key 泄露风险

不要把 Key 写入前端 `.env`，也不要写入任何 `VITE_` 开头的变量。`VITE_` 变量会被打包进浏览器代码。

正确做法是：

- Key 只放后端部署平台环境变量。
- 本地 Key 只放 `server/.env`。
- `server/.env` 不提交 Git。
