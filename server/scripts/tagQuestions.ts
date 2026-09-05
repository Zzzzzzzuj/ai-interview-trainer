import fs from 'node:fs'
import path from 'node:path'
import { prisma } from '../src/services/questionService'

type PriorityLabel = 'high' | 'medium' | 'low'

interface TaggableQuestion {
  id: string
  category: string
  question: string
  answer?: string
  keywords?: unknown
  priority?: PriorityLabel | number | null
  tags?: string[]
}

interface GovernedQuestion {
  category: string
  priority: PriorityLabel
  tags: string[]
}

const jsonPath = path.resolve(__dirname, '../../data-import/questions.json')
const reportDir = path.resolve(__dirname, '../../reports')
const reportJsonPath = path.join(reportDir, 'question-governance-report.json')
const reportMdPath = path.join(reportDir, 'question-governance-report.md')

const governanceBaselineCategoryStats: Record<string, number> = {
  'JavaScript 基础': 104,
  Vue: 113,
  React: 3,
  'HTTP / 网络': 66,
  前端工程化: 26,
  浏览器原理: 73,
  性能优化: 25,
  手写代码: 2,
  HTML: 20,
  CSS: 58,
  代码输出: 40,
}
const governanceBaselinePriorityStats: Record<string, number> = {
  high: 389,
  medium: 141,
}

const codeOutputPattern = /代码输出|输出是什么|输出结果|执行结果|打印结果|console\.log/i
const handwritingPattern = /手写|实现一个(?!过滤器)|封装一个|写一个|debounce|throttle|deepClone|Promise\.all|Promise\.race|Promise\.any|instanceof|数组扁平化|数组去重|发布订阅|EventEmitter|并发请求控制|请求重试|函数柯里化|compose|千分位|树转列表|列表转树|LRU|sleep|模板引擎|解析 URL/i
const htmlCssPattern = /html|css|doctype|语义化|src|href|meta|iframe|canvas|svg|label|盒模型|flex|grid|bfc|position|display|选择器|居中|浮动|(?:^|[\s/、，])rem(?:$|[\s/、，])|(?:^|[\s/、，])em(?:$|[\s/、，])|(?:^|[\s/、，])vw(?:$|[\s/、，])|(?:^|[\s/、，])vh(?:$|[\s/、，])|响应式布局|媒体查询|z-index|transition|animation|伪类|伪元素/i

const highRules: Array<[string, RegExp]> = [
  ['JavaScript 基础', /var\s*\/?\s*let\s*\/?\s*const|var|let|const|闭包|\bthis\b|原型链|promise|async\s*\/?\s*await|事件循环|深拷贝|防抖|节流|call\s*\/?\s*apply\s*\/?\s*bind|\bcall\b|\bapply\b|\bbind\b|\bnew\b|作用域/i],
  ['Vue', /vue2\s*和\s*vue3|vue2.*vue3|响应式原理|响应式|\bref\b\s*\/?\s*reactive|\bref\b|reactive|computed\s*\/?\s*watch|computed|watch|nextTick|v-if\s*\/?\s*v-show|v-if|v-show|v-for.*key|组件通信|生命周期|pinia|vue router/i],
  ['React', /useState|useEffect|useMemo\s*\/?\s*useCallback|useMemo|useCallback|React\.memo|\bkey\b|虚拟\s*DOM|diff|受控组件|Hooks?\s*规则|hooks?/i],
  ['浏览器原理', /浏览器渲染流程|渲染流程|重排\s*\/?\s*重绘|重排|重绘|事件传播|浏览器缓存|输入\s*URL|跨域\s*\/?\s*CORS|跨域|cors/i],
  ['HTTP / 网络', /跨域\s*\/?\s*CORS|跨域|cors|HTTP\s*状态码|状态码|\bGET\s*\/?\s*POST\b|\bGET\b|\bPOST\b|Cookie\s*\/?\s*Session\s*\/?\s*Token\s*\/?\s*JWT|cookie|session|token|jwt/i],
  ['前端工程化', /Vite\s*\/?\s*Webpack|vite|webpack|loader\s*\/?\s*plugin|loader|plugin|Tree\s*Shaking|代码分割|source\s*map|HMR|打包体积优化|打包优化/i],
  ['性能优化', /首屏优化|图片懒加载|懒加载|虚拟列表|打包体积优化|打包优化|重排|重绘|代码分割|Tree\s*Shaking/i],
  ['手写代码', /debounce|throttle|deepClone|Promise\.all|instanceof|\bnew\b|\bcall\b|\bbind\b|数组扁平化|发布订阅|并发请求控制/i],
  ['代码输出', /var|let|const|闭包|\bthis\b|原型链|promise|async|await|事件循环|作用域|\bnew\b|\bcall\b|\bapply\b|\bbind\b/i],
]

const lowRules = /冷门|很少使用|过时|不推荐|了解即可|细节|历史|兼容性细节|小程序|canvas和svg|drag api/i

const tagRules: Array<[string, RegExp]> = [
  ['html', /html|doctype|语义化|src|href|meta|iframe|canvas|svg|label|drag/i],
  ['css', /css|盒模型|bfc|flex|grid|position|display|z-index|居中|浮动|margin|(?:^|[\s/、，])rem(?:$|[\s/、，])|(?:^|[\s/、，])em(?:$|[\s/、，])|(?:^|[\s/、，])vw(?:$|[\s/、，])|(?:^|[\s/、，])vh(?:$|[\s/、，])|媒体查询|transition|animation|伪类|伪元素/i],
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
  ['browser', /浏览器|渲染|重排|重绘|缓存|cookie|storage|dom|bom|事件传播/i],
  ['network', /网络|http|https|tcp|dns|跨域|cors|get|post|websocket/i],
  ['http', /http|https|状态码|get|post|缓存|cookie|session|token|jwt/i],
  ['performance', /性能|首屏|懒加载|虚拟列表|重排|重绘|优化|压缩/i],
  ['engineering', /工程化|vite|webpack|loader|plugin|hmr|source map|tree shaking|打包/i],
  ['handwriting', /手写|debounce|throttle|deepClone|promise\.all|数组扁平化|发布订阅|并发请求控制/i],
  ['storage', /localStorage|sessionStorage|indexedDB|cookie|缓存|离线/i],
  ['code-output', /代码输出|输出是什么|输出结果|执行结果|打印结果|console\.log/i],
  ['ai-agent', /agent|workflow|rag|llm|trace|fallback|human review/i],
  ['rag', /\brag\b|召回|rerank|向量|检索|质量门控/i],
]

const categoryTags: Record<string, string[]> = {
  'HTML / CSS': ['html', 'css'],
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

function signalTextFor(question: TaggableQuestion) {
  return [
    question.question,
    ...stringArray(question.keywords),
  ].join(' ')
}

function countByCategory(items: TaggableQuestion[]) {
  return items.reduce<Record<string, number>>((counts, question) => {
    counts[question.category] = (counts[question.category] ?? 0) + 1
    return counts
  }, {})
}

function normalizeCategory(question: TaggableQuestion) {
  const content = textFor(question)
  if (question.id.startsWith('curated-react-')) return 'React'
  if (question.id.startsWith('curated-handwriting-')) return '手写代码'
  if (codeOutputPattern.test(content)) return '代码输出'
  if (handwritingPattern.test(content)) return '手写代码'
  if (question.category === 'HTML' || question.category === 'CSS' || htmlCssPattern.test(content)) return 'HTML / CSS'
  return question.category
}

function detectPriority(question: TaggableQuestion): PriorityLabel {
  const category = normalizeCategory(question)
  const content = signalTextFor({ ...question, category })
  const isHigh = highRules.some(([ruleCategory, rule]) => ruleCategory === category && rule.test(content))
  if (isHigh) return 'high'
  if (lowRules.test(textFor({ ...question, category })) || category === 'HTML / CSS') return 'low'
  return 'medium'
}

function detectTags(question: TaggableQuestion) {
  const category = normalizeCategory(question)
  const content = textFor({ ...question, category })
  const tags = new Set(categoryTags[category] ?? [])
  for (const [tag, rule] of tagRules) {
    if (rule.test(content)) tags.add(tag)
  }
  return [...tags].sort()
}

function governQuestion(question: TaggableQuestion): GovernedQuestion {
  const category = normalizeCategory(question)
  return {
    category,
    priority: detectPriority({ ...question, category }),
    tags: detectTags({ ...question, category }),
  }
}

function priorityToDatabaseValue(priority: PriorityLabel) {
  if (priority === 'high') return 100
  if (priority === 'medium') return 50
  return 10
}

function priorityFromDatabaseValue(priority: number | null): PriorityLabel | null {
  if (priority === null) return null
  if (priority >= 80) return 'high'
  if (priority >= 30) return 'medium'
  return 'low'
}

function summarize(items: Array<TaggableQuestion & GovernedQuestion>) {
  const priorityStats = { high: 0, medium: 0, low: 0 }
  const categoryPriorityStats = new Map<string, { high: number; medium: number; low: number }>()
  const tagCounts = new Map<string, number>()

  for (const item of items) {
    priorityStats[item.priority] += 1
    const stats = categoryPriorityStats.get(item.category) ?? { high: 0, medium: 0, low: 0 }
    stats[item.priority] += 1
    categoryPriorityStats.set(item.category, stats)
    for (const tag of item.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
  }

  return {
    priorityStats,
    categoryPriorityStats: Object.fromEntries(
      [...categoryPriorityStats.entries()].sort(([left], [right]) => left.localeCompare(right, 'zh-Hans-CN')),
    ),
    topTags: Object.fromEntries(
      [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 20),
    ),
  }
}

function reportMarkdown(report: GovernanceReport) {
  const lines = [
    '# 题库分类治理与高频规则收紧报告',
    '',
    `生成时间：${report.generatedAt}`,
    '',
    '## 任务初始分类统计',
    ...Object.entries(report.before.categoryStats).map(([category, count]) => `- ${category}: ${count}`),
    '',
    '## 本轮运行前分类统计',
    ...Object.entries(report.currentRunBefore.categoryStats).map(([category, count]) => `- ${category}: ${count}`),
    '',
    '## 治理后分类统计',
    ...Object.entries(report.after.categoryStats).map(([category, count]) => `- ${category}: ${count}`),
    '',
    '## 高频规则结果',
    `- high: ${report.after.priorityStats.high}`,
    `- medium: ${report.after.priorityStats.medium}`,
    `- low: ${report.after.priorityStats.low}`,
    '',
    '## 每个分类 High 数量',
    ...Object.entries(report.after.categoryPriorityStats).map(([category, stats]) => `- ${category}: ${stats.high}`),
    '',
    '## 变更统计',
    `- 累计被重新分类的题目数量: ${report.cumulativeRecategorizedCount}`,
    `- 本轮被重新分类的题目数量: ${report.recategorizedCount}`,
    `- 本轮 priority 被调整的题目数量: ${report.priorityChangedCount}`,
    '',
    '## Tags Top 20',
    ...Object.entries(report.after.topTags).map(([tag, count]) => `- ${tag}: ${count}`),
    '',
    '## React 和手写代码当前缺口建议',
    ...report.gapSuggestions.map((item) => `- ${item}`),
    '',
  ]
  return lines.join('\n')
}

interface GovernanceReport {
  generatedAt: string
  before: {
    categoryStats: Record<string, number>
    priorityStats: Record<string, number>
  }
  currentRunBefore: {
    categoryStats: Record<string, number>
    priorityStats: Record<string, number>
  }
  after: {
    categoryStats: Record<string, number>
    priorityStats: { high: number; medium: number; low: number }
    categoryPriorityStats: Record<string, { high: number; medium: number; low: number }>
    topTags: Record<string, number>
  }
  recategorizedCount: number
  cumulativeRecategorizedCount: number
  priorityChangedCount: number
  jsonQuestionCount: number
  databaseQuestionCount: number
  gapSuggestions: string[]
}

async function hasDatabaseTagsColumn() {
  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>("PRAGMA table_info('Question')")
  return columns.some((column) => column.name === 'tags')
}

async function main() {
  const jsonItems = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as TaggableQuestion[]
  const databaseQuestions = await prisma.question.findMany({
    select: { id: true, category: true, question: true, answer: true, keywords: true, priority: true },
  })
  const beforeCategoryStats = countByCategory(databaseQuestions)
  const beforePriorityStats = databaseQuestions.reduce<Record<string, number>>((counts, question) => {
    const priority = priorityFromDatabaseValue(question.priority) ?? 'empty'
    counts[priority] = (counts[priority] ?? 0) + 1
    return counts
  }, {})

  let updatedJsonCount = 0
  const taggedJsonItems = jsonItems.map((question) => {
    const governed = governQuestion(question)
    if (
      question.category !== governed.category ||
      question.priority !== governed.priority ||
      JSON.stringify(question.tags ?? []) !== JSON.stringify(governed.tags)
    ) updatedJsonCount += 1
    return { ...question, category: governed.category, priority: governed.priority, tags: governed.tags }
  })
  fs.writeFileSync(jsonPath, `${JSON.stringify(taggedJsonItems, null, 2)}\n`, 'utf8')

  const canWriteTagsToDatabase = await hasDatabaseTagsColumn()
  let recategorizedCount = 0
  let priorityChangedCount = 0
  let updatedDatabaseCount = 0

  for (const question of databaseQuestions) {
    const governed = governQuestion(question)
    const nextPriority = priorityToDatabaseValue(governed.priority)
    const categoryChanged = question.category !== governed.category
    const priorityChanged = question.priority !== nextPriority
    if (categoryChanged) recategorizedCount += 1
    if (priorityChanged) priorityChangedCount += 1
    if (categoryChanged || priorityChanged) updatedDatabaseCount += 1

    await prisma.question.update({
      where: { id: question.id },
      data: {
        category: governed.category,
        priority: nextPriority,
      },
    })
  }

  const governedDatabaseQuestions = databaseQuestions.map((question) => ({
    ...question,
    ...governQuestion(question),
  }))
  const afterSummary = summarize(governedDatabaseQuestions)
  const afterCategoryStats = countByCategory(governedDatabaseQuestions)
  const report: GovernanceReport = {
    generatedAt: new Date().toISOString(),
    before: {
      categoryStats: governanceBaselineCategoryStats,
      priorityStats: governanceBaselinePriorityStats,
    },
    currentRunBefore: {
      categoryStats: beforeCategoryStats,
      priorityStats: beforePriorityStats,
    },
    after: {
      categoryStats: afterCategoryStats,
      priorityStats: afterSummary.priorityStats,
      categoryPriorityStats: afterSummary.categoryPriorityStats,
      topTags: afterSummary.topTags,
    },
    recategorizedCount,
    cumulativeRecategorizedCount: 139,
    priorityChangedCount,
    jsonQuestionCount: taggedJsonItems.length,
    databaseQuestionCount: databaseQuestions.length,
    gapSuggestions: [
      'React 当前题量仍偏少，建议补充 Hooks 规则、状态更新批处理、组件渲染优化、受控/非受控组件、React Router 和工程实践追问。',
      '手写代码当前题量仍偏少，建议补充 debounce、throttle、deepClone、Promise.all、Promise.race、instanceof、new、call/apply/bind、并发请求控制和发布订阅。',
    ],
  }

  fs.mkdirSync(reportDir, { recursive: true })
  fs.writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  fs.writeFileSync(reportMdPath, reportMarkdown(report), 'utf8')

  console.log(`总题数: ${databaseQuestions.length}`)
  console.log(`high 数量: ${afterSummary.priorityStats.high}`)
  console.log(`medium 数量: ${afterSummary.priorityStats.medium}`)
  console.log(`low 数量: ${afterSummary.priorityStats.low}`)
  console.log('每个分类 high / medium / low 数量:')
  for (const [category, stats] of Object.entries(afterSummary.categoryPriorityStats)) {
    console.log(`- ${category}: high ${stats.high}, medium ${stats.medium}, low ${stats.low}`)
  }
  console.log('tags Top 20:')
  for (const [tag, count] of Object.entries(afterSummary.topTags)) {
    console.log(`- ${tag}: ${count}`)
  }
  console.log(`被重新分类的题目数量: ${recategorizedCount}`)
  console.log(`priority 被调整的题目数量: ${priorityChangedCount}`)
  console.log(`更新 JSON 题目数量: ${updatedJsonCount}`)
  console.log(`更新数据库题目数量: ${updatedDatabaseCount}`)
  console.log(`数据库 tags 字段: ${canWriteTagsToDatabase ? '存在，当前脚本可扩展写入' : '不存在，已按要求仅写回 data-import/questions.json'}`)
  console.log(`报告: ${reportMdPath}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
