import type { InterviewQuestion } from '../../types/interview'

export const networkQuestions: InterviewQuestion[] = [
  {
    id: 'network-cache-01', category: 'HTTP / 网络', type: 'short_answer', difficulty: 'hard',
    question: '强缓存和协商缓存有什么区别？前端发布静态资源时如何使用？',
    answer: '强缓存由 Cache-Control 的 max-age 等指令决定，在有效期内浏览器可直接使用本地副本，不发请求。过期后会走协商缓存，带上 ETag 或 Last-Modified 询问服务端是否变化。发布时通常给带内容 hash 的 JS、CSS 设置较长强缓存，HTML 设置较短缓存或 no-cache，保证入口能拿到新资源地址。',
    explanation: '要把缓存机制和带 hash 的发布策略连起来，才能体现工程落地能力。',
    keywords: ['Cache-Control', 'max-age', 'ETag', 'hash', 'HTML'],
    commonMissingPoints: ['只背强缓存和协商缓存，没有说发布策略', '遗漏 HTML 与静态资源应采用不同缓存策略'],
    codeExample: 'Cache-Control: public, max-age=31536000, immutable\n// app.4f3a1c.js 使用长缓存\nCache-Control: no-cache\n// index.html 每次验证入口是否更新',
    followUps: ['ETag 和 Last-Modified 各有什么局限？'], sourceName: 'MDN HTTP caching', sourceUrl: 'https://developer.mozilla.org/docs/Web/HTTP/Guides/Caching',
  },
  {
    id: 'network-cors-01', category: 'HTTP / 网络', type: 'choice', difficulty: 'medium',
    question: '跨域请求的预检请求通常使用哪个 HTTP 方法？',
    options: [{ label: 'A', value: 'GET' }, { label: 'B', value: 'POST' }, { label: 'C', value: 'OPTIONS' }, { label: 'D', value: 'HEAD' }],
    answer: 'OPTIONS', explanation: '浏览器在非简单跨域请求前发送 OPTIONS，确认服务端允许的方法、请求头和来源；CORS 需要服务端通过响应头授权。',
    keywords: ['OPTIONS', '预检', '服务端', '响应头'], commonMissingPoints: ['以为前端设置请求头就能独自解决 CORS'],
    followUps: ['哪些请求会触发预检？'], sourceName: 'MDN CORS', sourceUrl: 'https://developer.mozilla.org/docs/Web/HTTP/Guides/CORS',
  },
]
