import { aiAgentQuestions } from './aiAgent.ts'
import { browserQuestions } from './browser.ts'
import { engineeringQuestions } from './engineering.ts'
import { handwritingQuestions } from './handwriting.ts'
import { javascriptQuestions } from './javascript.ts'
import { networkQuestions } from './network.ts'
import { performanceQuestions } from './performance.ts'
import { projectQuestions } from './project.ts'
import { ragQuestions } from './rag.ts'
import { reactQuestions } from './react.ts'
import { vueQuestions } from './vue.ts'
import type { InterviewQuestion } from '../../types/interview'

export const allQuestions: InterviewQuestion[] = [
  ...javascriptQuestions,
  ...vueQuestions,
  ...reactQuestions,
  ...browserQuestions,
  ...networkQuestions,
  ...engineeringQuestions,
  ...performanceQuestions,
  ...handwritingQuestions,
  ...aiAgentQuestions,
  ...ragQuestions,
  ...projectQuestions,
]

export const questions = allQuestions

export const questionCountByCategory = allQuestions.reduce<Record<string, number>>((counts, question) => {
  counts[question.category] = (counts[question.category] ?? 0) + 1
  return counts
}, {})
