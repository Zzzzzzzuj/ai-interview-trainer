import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { favoritesRouter } from './routes/favorites'
import { practiceRecordsRouter } from './routes/practiceRecords'
import { questionsRouter } from './routes/questions'
import { reviewAnswerRouter } from './routes/reviewAnswer'
import { prisma } from './services/questionService'

const defaultCorsOrigins = ['http://localhost:5173']
const corsOrigins = (process.env.CORS_ORIGIN ?? defaultCorsOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const app = express()
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true)
      return
    }
    callback(new Error(`CORS origin not allowed: ${origin}`))
  },
}))
app.use(express.json({ limit: '1mb' }))
app.get('/health', (_request, response) => response.json({ ok: true }))
app.use('/api/questions', questionsRouter)
app.use('/api/practice-records', practiceRecordsRouter)
app.use('/api/favorites', favoritesRouter)
app.use('/api/review-answer', reviewAnswerRouter)
app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error)
  response.status(500).json({ message: 'Internal server error' })
})

const PORT = Number(process.env.PORT) || 3001
const server = app.listen(PORT, () => console.log(`Interview API running at http://localhost:${PORT}`))

async function shutdown() {
  server.close()
  await prisma.$disconnect()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
