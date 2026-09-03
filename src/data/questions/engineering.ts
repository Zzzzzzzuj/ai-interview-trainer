import type { InterviewQuestion } from '../../types/interview'

export const engineeringQuestions: InterviewQuestion[] = [
  {
    id: 'engineering-vite-01', category: '前端工程化', type: 'short_answer', difficulty: 'medium',
    question: 'Vite 开发环境为什么启动快？它和传统打包工具的思路有什么差别？',
    answer: 'Vite 在开发时基于浏览器原生 ES Module 按需提供源码，不需要一开始把整个应用打包完；依赖会预构建，代码改动时只精确更新受影响模块，所以冷启动和热更新更快。生产构建仍会做打包、压缩和优化。',
    explanation: '区分“开发服务按需模块化”和“生产构建打包优化”即可。',
    keywords: ['ES Module', '按需', '依赖预构建', '热更新', '生产构建'],
    commonMissingPoints: ['误认为 Vite 生产环境完全不打包', '没有说明按需模块服务带来的启动收益'],
    codeExample: '// 开发时浏览器按需请求\nimport { createApp } from \'vue\'\nimport App from \'./App.vue\'\n\ncreateApp(App).mount(\'#app\')',
    followUps: ['依赖预构建主要解决什么问题？'], sourceName: 'Vite Guide', sourceUrl: 'https://vite.dev/guide/why.html',
  },
  {
    id: 'engineering-env-01', category: '前端工程化', type: 'choice', difficulty: 'easy',
    question: '在 Vite 项目中，希望某个环境变量能安全地暴露给浏览器端代码，它的命名前缀应是什么？',
    options: [{ label: 'A', value: 'NODE_' }, { label: 'B', value: 'VITE_' }, { label: 'C', value: 'PUBLIC_' }, { label: 'D', value: 'CLIENT_' }],
    answer: 'VITE_', explanation: '只有以 VITE_ 开头的变量会通过 import.meta.env 暴露给客户端，因此不要把密钥放在其中。',
    keywords: ['VITE_', 'import.meta.env', '密钥'], commonMissingPoints: ['把服务端密钥放进会暴露给浏览器的变量中'],
    followUps: ['前端环境变量为什么不能存放 API 密钥？'], sourceName: 'Vite Env Variables', sourceUrl: 'https://vite.dev/guide/env-and-mode.html',
  },
]
