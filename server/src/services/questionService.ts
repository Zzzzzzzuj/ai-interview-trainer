import { PrismaClient, type Question } from '@prisma/client'

export const prisma = new PrismaClient()

function parseArray(value: string | null): string[] {
  if (!value) return []
  try { return JSON.parse(value) } catch { return [] }
}

function parseOptions(value: string | null) {
  if (!value) return undefined
  try { return JSON.parse(value) } catch { return undefined }
}

export function serializeQuestion(question: Question) {
  return {
    ...question,
    options: parseOptions(question.options),
    keywords: parseArray(question.keywords),
    commonMissingPoints: parseArray(question.commonMissingPoints),
    followUps: question.followUps ? parseArray(question.followUps) : undefined,
  }
}
