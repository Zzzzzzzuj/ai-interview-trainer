import { Router } from 'express'
import { prisma, serializeQuestion } from '../services/questionService'

export const questionsRouter = Router()

questionsRouter.get('/categories', async (_request, response, next) => {
  try {
    const groups = await prisma.question.groupBy({ by: ['category'], _count: { _all: true }, orderBy: { category: 'asc' } })
    response.json(groups.map((group) => ({ category: group.category, count: group._count._all })))
  } catch (error) { next(error) }
})

questionsRouter.get('/', async (request, response, next) => {
  try {
    const page = Math.max(1, Number(request.query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(request.query.pageSize) || 50))
    const category = typeof request.query.category === 'string' ? request.query.category : undefined
    const type = typeof request.query.type === 'string' ? request.query.type : undefined
    const difficulty = typeof request.query.difficulty === 'string' ? request.query.difficulty : undefined
    const keyword = typeof request.query.keyword === 'string' ? request.query.keyword.trim() : ''
    const where = {
      ...(category ? { category } : {}), ...(type ? { type } : {}), ...(difficulty ? { difficulty } : {}),
      ...(keyword ? { OR: [{ question: { contains: keyword } }, { keywords: { contains: keyword } }] } : {}),
    }
    const [items, total] = await prisma.$transaction([
      prisma.question.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.question.count({ where }),
    ])
    response.json({ items: items.map(serializeQuestion), total, page, pageSize })
  } catch (error) { next(error) }
})

questionsRouter.get('/:id', async (request, response, next) => {
  try {
    const question = await prisma.question.findUnique({ where: { id: request.params.id } })
    if (!question) return response.status(404).json({ message: 'Question not found' })
    response.json(serializeQuestion(question))
  } catch (error) { next(error) }
})
