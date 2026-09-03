import type { InterviewQuestion } from '../../types/interview'

export const reactQuestions: InterviewQuestion[] = [
  {
    id: 'react-render-01', category: 'React', type: 'short_answer', difficulty: 'medium',
    question: 'React 组件重新渲染通常由什么触发？怎样避免不必要的渲染？',
    answer: '组件自身 state 更新、父组件重新渲染导致 props 引用变化、context 值变化都可能触发重新渲染。优化前先用 React DevTools 或日志确认瓶颈；稳定的子组件可以使用 memo，传给它的对象和函数要避免无意义地创建新引用。不要为了优化而到处加 memo。',
    explanation: '这题重点是先理解渲染触发来源，再强调基于测量优化。',
    keywords: ['state', 'props', 'context', 'memo', '引用'],
    commonMissingPoints: ['只说 memo，没有说明 props 引用变化的影响', '没有提到先定位再优化'],
    codeExample: 'const Item = memo(function Item({ onSelect }: { onSelect: () => void }) {\n  return <button onClick={onSelect}>Select</button>\n})',
    followUps: ['memo 在哪些情况下不会生效？', 'useCallback 的取舍是什么？'], sourceName: 'React Docs memo', sourceUrl: 'https://react.dev/reference/react/memo',
  },
  {
    id: 'react-effect-01', category: 'React', type: 'short_answer', difficulty: 'hard',
    question: 'useEffect 的依赖数组应该怎样理解？请求接口时如何避免竞态问题？',
    answer: 'useEffect 用来同步组件和外部系统，依赖数组应列出 effect 中使用且会变化的响应式值。请求接口时可以用 AbortController 或在清理函数中标记过期请求，避免旧请求晚返回后覆盖新状态；组件卸载时也要取消订阅或请求。',
    explanation: '依赖数组不是“控制什么时候执行”的开关，而是 effect 使用值的声明。',
    keywords: ['外部系统', '依赖数组', 'AbortController', '清理函数', '旧请求'],
    commonMissingPoints: ['把依赖数组当成任意控制开关', '没有处理旧请求覆盖新状态或卸载后的更新'],
    codeExample: 'useEffect(() => {\n  const controller = new AbortController()\n  fetch(`/api/search?q=${query}`, { signal: controller.signal })\n  return () => controller.abort()\n}, [query])',
    followUps: ['为什么 Strict Mode 下 effect 可能执行两次？'], sourceName: 'React Docs useEffect', sourceUrl: 'https://react.dev/reference/react/useEffect',
  },
  {
    id: 'react-state-01', category: 'React', type: 'choice', difficulty: 'medium',
    question: '更新嵌套 state 时，下面哪种做法更符合 React 的不可变更新原则？',
    options: [{ label: 'A', value: '直接修改 state.user.name' }, { label: 'B', value: 'state.user.name = name 后调用 setState(state)' }, { label: 'C', value: 'setState(prev => ({ ...prev, user: { ...prev.user, name } }))' }, { label: 'D', value: '修改后只刷新 DOM' }],
    answer: 'setState(prev => ({ ...prev, user: { ...prev.user, name } }))', explanation: 'React 用引用变化判断更新。复制修改路径上的对象，既保留不可变性，也避免直接篡改旧状态。',
    keywords: ['不可变', '引用变化', '函数式更新'], commonMissingPoints: ['直接修改旧 state，导致更新行为不可预测'],
    followUps: ['状态很深时可以使用什么工具降低更新成本？'], sourceName: 'React Docs Updating Objects', sourceUrl: 'https://react.dev/learn/updating-objects-in-state',
  },
]
