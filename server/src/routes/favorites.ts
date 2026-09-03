import { Router } from 'express'
import { prisma, serializeQuestion } from '../services/questionService'

export const favoritesRouter = Router()

favoritesRouter.post('/:questionId', async (request, response, next) => {
  try {
    const question = await prisma.question.findUnique({ where: { id: request.params.questionId } })
    if (!question) return response.status(404).json({ message: 'Question not found' })
    const favorite = await prisma.favoriteQuestion.upsert({ where: { questionId: question.id }, update: {}, create: { questionId: question.id } })
    response.status(201).json(favorite)
  } catch (error) { next(error) }
})

favoritesRouter.delete('/:questionId', async (request, response, next) => {
  try {
    await prisma.favoriteQuestion.deleteMany({ where: { questionId: request.params.questionId } })
    response.status(204).end()
  } catch (error) { next(error) }
})

favoritesRouter.get('/', async (_request, response, next) => {
  try {
    const favorites = await prisma.favoriteQuestion.findMany({ orderBy: { createdAt: 'desc' } })
    const ids = favorites.map((favorite) => favorite.questionId)
    const questions = await prisma.question.findMany({ where: { id: { in: ids } } })
    response.json(questions.map(serializeQuestion))
  } catch (error) { next(error) }
})
