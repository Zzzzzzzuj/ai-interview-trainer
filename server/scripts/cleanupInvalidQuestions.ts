import { prisma } from '../src/services/questionService'

const outputQuestionPattern = /输出是什么|输出结果|代码输出|执行结果|打印结果|console\.log|输出为/
const placeholderAnswerPattern = /^我会围绕\s*代码输出题/
const missingOutputAnswerPattern = /^这道题需要根据代码逐步推导输出/

function isBlank(value: string | null | undefined) {
  return !value || value.trim().length === 0
}

async function main() {
  const questions = await prisma.question.findMany({
    select: {
      id: true,
      category: true,
      question: true,
      answer: true,
      codeExample: true,
    },
  })

  const invalidQuestions = questions.filter((question) => {
    const looksLikeOutputQuestion = outputQuestionPattern.test(question.question)
    const hasNoCodeExample = isBlank(question.codeExample)
    const hasPlaceholderAnswer =
      placeholderAnswerPattern.test(question.answer) || missingOutputAnswerPattern.test(question.answer)

    return looksLikeOutputQuestion && (hasNoCodeExample || hasPlaceholderAnswer)
  })

  if (invalidQuestions.length > 0) {
    await prisma.question.deleteMany({
      where: {
        id: {
          in: invalidQuestions.map((question) => question.id),
        },
      },
    })
  }

  console.log(`删除数量: ${invalidQuestions.length}`)
  console.log('被删除题目:')
  invalidQuestions.forEach((question) => {
    console.log(`- ${question.id} | ${question.category} | ${question.question}`)
  })

  const categoryCounts = invalidQuestions.reduce<Record<string, number>>((counts, question) => {
    counts[question.category] = (counts[question.category] ?? 0) + 1
    return counts
  }, {})

  console.log('删除分类分布:')
  Object.entries(categoryCounts).forEach(([category, count]) => {
    console.log(`- ${category}: ${count}`)
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
