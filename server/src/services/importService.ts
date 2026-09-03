import { Prisma } from '@prisma/client'
import { normalizeQuestion, type ImportedQuestion } from '../utils/normalizeQuestion'
import { prisma } from './questionService'

export interface ImportSummary {
  read: number
  imported: number
  skipped: number
  failed: number
  categories: Record<string, number>
}

export async function importQuestions(items: ImportedQuestion[]): Promise<ImportSummary> {
  const summary: ImportSummary = { read: items.length, imported: 0, skipped: 0, failed: 0, categories: {} }
  for (const item of items) {
    try {
      const question = normalizeQuestion(item)
      await prisma.question.create({ data: question })
      summary.imported += 1
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        summary.skipped += 1
      } else {
        summary.failed += 1
        console.error(`Failed to import: ${item.question ?? '(missing question)'}`, error)
      }
    }
  }
  const groups = await prisma.question.groupBy({ by: ['category'], _count: { _all: true } })
  summary.categories = Object.fromEntries(groups.map((group) => [group.category, group._count._all]))
  return summary
}
