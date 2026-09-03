import 'dotenv/config'
import { existsSync, readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { importQuestions } from '../src/services/importService'
import type { ImportedQuestion } from '../src/utils/normalizeQuestion'
import { prisma } from '../src/services/questionService'

function markdownToQuestions(content: string): ImportedQuestion[] {
  return content.split(/^---$/m).map((block) => {
    const read = (name: string) => block.match(new RegExp(`^${name}:\\s*(.+)$`, 'mi'))?.[1]?.trim()
    const question = read('question')
    if (!question) return null
    return {
      id: read('id'), category: read('category'), type: read('type'), difficulty: read('difficulty'), question,
      answer: read('answer'), explanation: read('explanation'), keywords: read('keywords'),
      commonMissingPoints: read('commonMissingPoints'), followUps: read('followUps'),
      sourceName: read('sourceName'), sourceUrl: read('sourceUrl'), codeExample: read('codeExample'),
    }
  }).filter((item): item is ImportedQuestion => item !== null)
}

function readImportFile(): { file: string; items: ImportedQuestion[] } {
  const requested = process.argv[2]
  const candidates = requested ? [resolve(process.cwd(), requested)] : [
    resolve(process.cwd(), '../data-import/questions.json'),
    resolve(process.cwd(), '../data-import/questions.example.json'),
    resolve(process.cwd(), '../data-import/questions.md'),
    resolve(process.cwd(), '../data-import/questions.example.md'),
  ]
  const file = candidates.find(existsSync)
  if (!file) throw new Error('No import file found. Add data-import/questions.json or pass a file path.')
  const content = readFileSync(file, 'utf8')
  const items = file.endsWith('.md') ? markdownToQuestions(content) : JSON.parse(content)
  if (!Array.isArray(items)) throw new Error(`${basename(file)} must contain a JSON array.`)
  return { file, items }
}

async function main() {
  const { file, items } = readImportFile()
  const summary = await importQuestions(items)
  console.log(`Imported from ${file}`)
  console.log(`总读取数量: ${summary.read}`)
  console.log(`成功导入数量: ${summary.imported}`)
  console.log(`跳过重复数量: ${summary.skipped}`)
  console.log(`失败数量: ${summary.failed}`)
  console.log('每个分类数量:')
  Object.entries(summary.categories).forEach(([category, count]) => console.log(`- ${category}: ${count}`))
}

main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
