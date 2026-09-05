import fs from 'node:fs'
import path from 'node:path'
import { prisma } from '../src/services/questionService'

type PriorityLabel = 'high' | 'medium'

interface TaggableQuestion {
  id: string
  category: string
  question: string
  answer?: string
  keywords?: unknown
  priority?: PriorityLabel | number | null
  tags?: string[]
}

interface TaggedQuestion {
  priority: PriorityLabel
  tags: string[]
}

const jsonPath = path.resolve(__dirname, '../../data-import/questions.json')

const highRules: Record<string, RegExp[]> = {
  'JavaScript 基础': [
    /var\s+let\s+const|var|let|const/i,
    /闭包|this|原型链|promise|async\s*await|事件循环|深拷贝|防抖|节流|作用域|垃圾回收/i,
    /\bcall\b|\bapply\b|\bbind\b|\bnew\b/i,
  ],
  Vue: [
    /vue2\s*和\s*vue3|响应式|\bref\b|reactive|computed|watch|watchEffect|nextTick/i,
    /v-if|v-show|\bkey\b|组件通信|生命周期|pinia|vue router/i,
  ],
  React: [
    /useState|useEffect|useMemo|useCallback|React\.memo|\bkey\b|虚拟\s*DOM|diff|受控组件|hooks?/i,
  ],
  '浏览器原理': [
    /跨域|cors|cookie|localStorage|sessionStorage|缓存|输入\s*URL|重排|重绘|渲染流程/i,
  ],
  'HTTP / 网络': [
    /跨域|cors|http\s*状态码|状态码|\bget\b|\bpost\b|cookie|缓存/i,
  ],
  前端工程化: [
    /vite|webpack|loader|plugin|tree\s*shaking|代码分割|source\s*map|hmr|打包优化/i,
  ],
  性能优化: [
    /首屏优化|懒加载|虚拟列表|打包优化|tree\s*shaking|代码分割|重排|重绘|缓存/i,
  ],
  手写代码: [
    /debounce|throttle|deepClone|Promise\.all|instanceof|\bnew\b|\bcall\b|\bbind\b|数组扁平化|发布订阅/i,
  ],
  代码输出: [
    /var|let|const|闭包|this|原型链|promise|async|await|事件循环|作用域|\bnew\b|\bcall\b|\bapply\b|\bbind\b/i,
  ],
}

const tagRules: Array<[string, RegExp]> = [
  ['html', /html|doctype|src|href|meta|iframe|canvas|svg|label|drag/i],
  ['css', /css|盒模型|bfc|flex|grid|position|z-index|居中|浮动|margin|rem|em|px/i],
  ['js-basic', /javascript|js|var|let|const|类型|作用域|原型|闭包|this/i],
  ['closure', /闭包|closure/i],
  ['this', /\bthis\b|this 指向/i],
  ['prototype', /原型|prototype|instanceof|继承/i],
  ['promise', /promise|async|await|异步/i],
  ['event-loop', /事件循环|宏任务|微任务|event loop/i],
  ['vue', /vue|pinia|vue router|v-if|v-show|ref|reactive|watch|computed/i],
  ['vue-reactivity', /响应式|ref|reactive|computed|watch|watchEffect|nextTick/i],
  ['react', /react|jsx|虚拟\s*dom|diff|受控组件/i],
  ['hooks', /hooks?|useState|useEffect|useMemo|useCallback/i],
  ['browser', /浏览器|渲染|重排|重绘|缓存|cookie|storage|dom|bom/i],
  ['network', /网络|http|https|tcp|dns|跨域|cors|get|post|websocket/i],
  ['http', /http|https|状态码|get|post|缓存|cookie/i],
  ['performance', /性能|首屏|懒加载|虚拟列表|重排|重绘|优化|压缩/i],
  ['engineering', /工程化|vite|webpack|loader|plugin|hmr|source map|tree shaking|打包/i],
  ['handwriting', /手写|debounce|throttle|deepClone|promise\.all|数组扁平化|发布订阅/i],
  ['storage', /localStorage|sessionStorage|indexedDB|cookie|缓存|离线/i],
  ['code-output', /代码输出|输出是什么|输出结果|执行结果|打印结果|console\.log/i],
  ['ai-agent', /agent|workflow|rag|llm|trace|fallback|human review/i],
  ['rag', /\brag\b|召回|rerank|向量|检索|质量门控/i],
]

const categoryTags: Record<string, string[]> = {
  HTML: ['html'],
  CSS: ['css'],
  'JavaScript 基础': ['js-basic'],
  Vue: ['vue'],
  React: ['react'],
  浏览器原理: ['browser'],
  'HTTP / 网络': ['network', 'http'],
  前端工程化: ['engineering'],
  性能优化: ['performance'],
  手写代码: ['handwriting'],
  代码输出: ['code-output', 'js-basic'],
  'AI Agent': ['ai-agent'],
  RAG: ['rag'],
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean)
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean)
  } catch {
    return value.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean)
  }
  return []
}

function textFor(question: TaggableQuestion) {
  return [
    question.category,
    question.question,
    question.answer ?? '',
    ...stringArray(question.keywords),
  ].join(' ')
}

function detectPriority(question: TaggableQuestion): PriorityLabel {
  const content = textFor(question)
  const rules = highRules[question.category] ?? []
  return rules.some((rule) => rule.test(content)) ? 'high' : 'medium'
}

function detectTags(question: TaggableQuestion) {
  const content = textFor(question)
  const tags = new Set(categoryTags[question.category] ?? [])
  for (const [tag, rule] of tagRules) {
    if (rule.test(content)) tags.add(tag)
  }
  return [...tags].sort()
}

function tagQuestion(question: TaggableQuestion): TaggedQuestion {
  return {
    priority: detectPriority(question),
    tags: detectTags(question),
  }
}

function priorityToDatabaseValue(priority: PriorityLabel) {
  return priority === 'high' ? 100 : 50
}

function summarize(items: Array<TaggableQuestion & TaggedQuestion>) {
  const categoryStats = new Map<string, { high: number; medium: number }>()
  const tagCounts = new Map<string, number>()
  let high = 0
  let medium = 0

  for (const item of items) {
    if (item.priority === 'high') high += 1
    else medium += 1

    const stats = categoryStats.get(item.category) ?? { high: 0, medium: 0 }
    stats[item.priority] += 1
    categoryStats.set(item.category, stats)

    for (const tag of item.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }

  return {
    high,
    medium,
    categoryStats: [...categoryStats.entries()].sort(([left], [right]) => left.localeCompare(right, 'zh-Hans-CN')),
    topTags: [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 20),
  }
}

async function hasDatabaseTagsColumn() {
  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>("PRAGMA table_info('Question')")
  return columns.some((column) => column.name === 'tags')
}

async function main() {
  const jsonItems = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as TaggableQuestion[]
  let updatedJsonCount = 0
  const taggedJsonItems = jsonItems.map((question) => {
    const tagged = tagQuestion(question)
    if (question.priority !== tagged.priority || JSON.stringify(question.tags ?? []) !== JSON.stringify(tagged.tags)) {
      updatedJsonCount += 1
    }
    return { ...question, priority: tagged.priority, tags: tagged.tags }
  })
  fs.writeFileSync(jsonPath, `${JSON.stringify(taggedJsonItems, null, 2)}\n`, 'utf8')

  const databaseQuestions = await prisma.question.findMany({
    select: { id: true, category: true, question: true, answer: true, keywords: true, priority: true },
  })
  const canWriteTagsToDatabase = await hasDatabaseTagsColumn()
  let updatedDatabaseCount = 0

  for (const question of databaseQuestions) {
    const tagged = tagQuestion(question)
    const nextPriority = priorityToDatabaseValue(tagged.priority)
    if (question.priority !== nextPriority) updatedDatabaseCount += 1

    await prisma.question.update({
      where: { id: question.id },
      data: { priority: nextPriority },
    })
  }

  const taggedDatabaseQuestions = databaseQuestions.map((question) => ({
    ...question,
    ...tagQuestion(question),
  }))
  const summary = summarize(taggedDatabaseQuestions)

  console.log(`总题数: ${databaseQuestions.length}`)
  console.log(`high 数量: ${summary.high}`)
  console.log(`medium 数量: ${summary.medium}`)
  console.log('每个分类 high / medium 数量:')
  for (const [category, stats] of summary.categoryStats) {
    console.log(`- ${category}: high ${stats.high}, medium ${stats.medium}`)
  }
  console.log('tags Top 20:')
  for (const [tag, count] of summary.topTags) {
    console.log(`- ${tag}: ${count}`)
  }
  console.log(`更新 JSON 题目数量: ${updatedJsonCount}`)
  console.log(`更新数据库题目数量: ${updatedDatabaseCount}`)
  console.log(`数据库 tags 字段: ${canWriteTagsToDatabase ? '存在，当前脚本可扩展写入' : '不存在，已按要求仅写回 data-import/questions.json'}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
