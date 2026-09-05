import { allQuestions } from '../src/data/questions/index.ts'

const categories = new Set([
  'HTML', 'CSS', 'JavaScript 基础', 'Vue', 'React', '性能优化', '前端工程化',
  'HTTP / 网络', '浏览器原理', '手写代码', '代码输出', 'AI Agent', 'RAG', '项目追问',
])
const difficulties = new Set(['easy', 'medium', 'hard'])
const types = new Set(['choice', 'short_answer'])
const requiredFields = ['id', 'category', 'type', 'difficulty', 'question', 'answer', 'explanation', 'keywords', 'commonMissingPoints', 'followUps']
const errors = []
const ids = new Set()

for (const question of allQuestions) {
  const name = question.id || '(missing id)'
  for (const field of requiredFields) {
    const value = question[field]
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      errors.push(`${name}: required field ${field} is empty`)
    }
  }
  if (ids.has(question.id)) errors.push(`${name}: duplicate id`)
  ids.add(question.id)
  if (!categories.has(question.category)) errors.push(`${name}: invalid category ${question.category}`)
  if (!difficulties.has(question.difficulty)) errors.push(`${name}: invalid difficulty ${question.difficulty}`)
  if (!types.has(question.type)) errors.push(`${name}: invalid type ${question.type}`)
  if (question.type === 'choice' && (!Array.isArray(question.options) || question.options.length < 2)) errors.push(`${name}: choice question requires options`)
  if (question.type === 'short_answer' && (!Array.isArray(question.keywords) || question.keywords.length === 0)) errors.push(`${name}: short_answer question requires keywords`)
}

if (errors.length > 0) {
  console.error(`Question validation failed with ${errors.length} error(s):`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log(`Question validation passed: ${allQuestions.length} questions checked.`)
