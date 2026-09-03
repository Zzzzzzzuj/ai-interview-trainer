import 'dotenv/config'
import { allQuestions } from '../../src/data/questions/index.ts'
import { prisma } from '../src/services/questionService'
import { normalizeQuestion } from '../src/utils/normalizeQuestion'

async function main() {
  let created = 0
  let updated = 0

  for (const localQuestion of allQuestions) {
    const question = normalizeQuestion(localQuestion)
    const existing = await prisma.question.findUnique({ where: { id: question.id } })

    await prisma.question.upsert({
      where: { id: question.id },
      create: question,
      update: question,
    })

    if (existing) updated += 1
    else created += 1
  }

  const [total, groups] = await Promise.all([
    prisma.question.count(),
    prisma.question.groupBy({ by: ['category'], _count: { _all: true }, orderBy: { category: 'asc' } }),
  ])

  console.log(`本地题库总数: ${allQuestions.length}`)
  console.log(`新增数量: ${created}`)
  console.log(`更新数量: ${updated}`)
  console.log(`数据库最终总数: ${total}`)
  console.log('每个分类数量:')
  groups.forEach((group) => console.log(`- ${group.category}: ${group._count._all}`))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
