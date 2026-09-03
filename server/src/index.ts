import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { favoritesRouter } from './routes/favorites'
import { practiceRecordsRouter } from './routes/practiceRecords'
import { questionsRouter } from './routes/questions'
import { prisma } from './services/questionService'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.get('/health', (_request, response) => response.json({ ok: true }))
app.use('/api/questions', questionsRouter)
app.use('/api/practice-records', practiceRecordsRouter)
app.use('/api/favorites', favoritesRouter)
app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error)
  response.status(500).json({ message: 'Internal server error' })
})

const port = Number(process.env.PORT) || 3001
const server = app.listen(port, () => console.log(`Interview API running at http://localhost:${port}`))

async function shutdown() {
  server.close()
  await prisma.$disconnect()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
