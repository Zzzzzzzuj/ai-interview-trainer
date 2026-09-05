import fs from 'node:fs'
import path from 'node:path'
import { prisma } from '../src/services/questionService'

interface ImportQuestion {
  id: string
  category: string
  type: string
  difficulty: string
  question: string
  answer: string
  explanation: string
  keywords: string[]
  commonMissingPoints: string[]
  codeExample?: string
  followUps?: string[]
  sourceName?: string
  sourceUrl?: string
  quality?: string
  priority?: string | number
}

const jsonPath = path.resolve(__dirname, '../../data-import/questions.json')
const badAnswerPattern =
  /我会先解释|我会从|这题要|面试回答要|回答时要|可以从几个方面|先说明概念|再说明|最后补充|我会把|我会围绕|口述时我会|这题可以|标准答案应|标准答案需要/
const outputQuestionPattern = /输出是什么|输出结果|代码输出|执行结果|打印结果|console\.log/

function cleanTopic(question: string) {
  return question
    .replace(/^请说说/, '')
    .replace(/^代码输出题：/, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/[?？]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanQuestionText(question: string) {
  return question
    .replace(/^请说说\s*/, '')
    .replace(/^\d+[.、]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanFollowUpText(followUp: string) {
  return followUp
    .replace(/^\d+[.、]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isBlank(value: unknown) {
  return typeof value !== 'string' || value.trim().length === 0
}

function isCodeOutputQuestion(question: Pick<ImportQuestion, 'category' | 'question' | 'codeExample'>) {
  return question.category === '代码输出' || outputQuestionPattern.test(question.question)
}

function isInvalidCodeOutputQuestion(question: Pick<ImportQuestion, 'category' | 'question' | 'codeExample'>) {
  return isCodeOutputQuestion(question) && isBlank(question.codeExample)
}

function stringifyArray(value: unknown) {
  return JSON.stringify(Array.isArray(value) ? value.map(String).filter(Boolean) : [])
}

function hasSameText(answer: string, explanation: string) {
  return answer.trim() === explanation.trim()
}

function splitWords(topic: string) {
  return topic
    .split(/[\s、，,/()（）?？:：；;“”"'.]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1)
}

function keywordsFor(question: ImportQuestion, topic: string) {
  const words = new Set([...(Array.isArray(question.keywords) ? question.keywords : []), ...splitWords(topic)])
  if (question.category === 'HTML') ['HTML', '语义化', '浏览器'].forEach((word) => words.add(word))
  if (question.category === 'CSS') ['CSS', '布局', '样式'].forEach((word) => words.add(word))
  if (question.category === 'HTTP / 网络') ['HTTP', '请求响应', '缓存', '连接'].forEach((word) => words.add(word))
  if (question.category === '浏览器原理') ['浏览器', '渲染', '安全', '存储'].forEach((word) => words.add(word))
  if (question.category === '代码输出') ['代码输出', '执行顺序', '输出结果'].forEach((word) => words.add(word))
  return [...words].slice(0, 10)
}

function missingPointsFor(category: string) {
  if (category === '代码输出') {
    return ['只写结论，没有解释执行过程', '忽略同步代码和异步任务的顺序', '没有结合 this、作用域或原型链规则分析']
  }
  if (category === 'HTML') return ['只列标签或属性，没有说明语义和浏览器行为', '遗漏可访问性、SEO 或资源加载影响']
  if (category === 'CSS') return ['只背属性名，没有说明布局规则', '遗漏兼容性、性能或适用场景']
  if (category === 'HTTP / 网络') return ['只说概念，没有串起请求响应链路', '遗漏缓存、安全或连接层影响']
  if (category === '浏览器原理') return ['只给定义，没有说明浏览器处理流程', '遗漏性能、安全或兼容性影响']
  return ['只背结论，没有解释机制', '没有结合项目场景', '遗漏边界情况']
}

function answerForHtml(topic: string) {
  if (/src和href/.test(topic)) return 'src 用于把外部资源嵌入当前文档，例如 script、img、iframe，浏览器会下载并把资源作为页面内容的一部分；href 用于建立当前文档和外部资源的关联，例如 a、link。简单说，src 偏“替换或嵌入内容”，href 偏“引用或跳转关系”。'
  if (/语义化/.test(topic)) return 'HTML 语义化是用合适的标签表达内容含义，例如 header、nav、main、article、section、footer。它能提升代码可读性、SEO 和无障碍体验，也方便浏览器、搜索引擎和辅助设备理解页面结构。'
  if (/文档声明|DOCTYPE|Doctype/.test(topic)) return 'DOCTYPE 是文档类型声明，用来告诉浏览器按照哪种 HTML 标准解析页面。HTML5 中使用 <!DOCTYPE html>，可以让浏览器进入标准模式；如果缺失或写法不正确，浏览器可能进入混杂模式，导致盒模型、样式解析和布局表现与标准模式不一致。'
  if (/defer和async/.test(topic)) return 'defer 和 async 都会异步下载脚本。defer 会等 HTML 解析完成后按文档顺序执行，适合依赖 DOM 或有顺序依赖的脚本；async 下载完成后立即执行，顺序不保证，适合统计、广告等独立脚本。'
  if (/meta/.test(topic)) return '常见 meta 包括 charset 指定编码，viewport 适配移动端，description 提供页面描述，keywords 记录关键词，http-equiv 设置兼容或缓存相关信息。实际开发最常见的是 charset 和 viewport。'
  if (/srcset/.test(topic)) return 'img 的 srcset 用来为不同屏幕密度或视口宽度提供不同图片资源，浏览器会结合 sizes、设备像素比和布局宽度选择最合适的一张，常用于响应式图片和高清屏适配。'
  if (/行内元素|块级元素|void/.test(topic)) return '块级元素默认独占一行，例如 div、p、h1；行内元素不独占一行，例如 span、a、strong；空元素没有闭合内容，例如 img、input、br、hr、meta、link。区分它们有助于判断布局和内容模型。'
  if (/web worker/i.test(topic)) return 'Web Worker 可以把耗时 JS 放到独立线程执行，避免阻塞主线程渲染和交互。它不能直接操作 DOM，主线程和 Worker 之间通过 postMessage 通信，适合大计算、文件处理或复杂数据解析。'
  if (/离线储存|离线存储/.test(topic)) return 'HTML5 离线能力主要依赖 localStorage、IndexedDB、Cache Storage 和 Service Worker。Service Worker 可以拦截网络请求并缓存资源，让页面在弱网或离线时仍能展示关键内容。旧的 Application Cache 已不推荐使用。'
  if (/离线储存资源进行管理和加载/.test(topic)) return '在线时，浏览器会检查页面声明的离线资源清单或 Service Worker 缓存策略，首次访问会下载并缓存资源；再次访问会优先使用本地缓存，同时对比资源是否更新。离线时，浏览器直接读取已缓存资源展示页面。现代项目更推荐 Service Worker 和 Cache Storage 管理离线资源。'
  if (/title与h1/.test(topic)) return 'title 是文档标题，显示在浏览器标签页和搜索结果中；h1 是页面主体最高级标题，表达页面内容主题。两者可以接近但职责不同，title 面向浏览器和搜索引擎，h1 面向页面结构和用户阅读。'
  if (/iframe/.test(topic)) return 'iframe 可以在页面中嵌入另一个页面，常用于第三方内容、沙箱隔离或老系统嵌入。缺点是加载和通信成本高、SEO 不友好，并且可能带来安全风险，因此要结合 sandbox、CSP 和 postMessage 做限制。'
  if (/label/.test(topic)) return 'label 用来为表单控件提供文本说明。通过 for 关联控件 id，或把控件包在 label 内，可以扩大点击区域，也能提升无障碍体验，让读屏器正确读出控件含义。'
  if (/Canvas和SVG/.test(topic)) return 'Canvas 是位图绘制，适合频繁重绘的大量图形、游戏和图表；SVG 是矢量图形，节点可被 DOM 管理，适合图标、简单图形和需要缩放不失真的场景。Canvas 性能偏绘制，SVG 可操作性更强。'
  if (/head 标签/.test(topic)) return 'head 标签用于存放文档元信息和资源声明，例如 title、meta、link、style、script、base 等。它不会作为主体内容直接显示给用户，但会影响标题、编码、SEO、样式加载和脚本加载。其中 title 是 head 中必不可少的元素。'
  if (/乱码/.test(topic)) return '浏览器乱码通常是页面实际编码、HTML 声明编码、服务器响应头编码或数据库内容编码不一致导致的。解决方式是统一使用 UTF-8，在 HTML 中声明 <meta charset="UTF-8">，服务端响应头也设置正确 charset，后端读写数据库时保持同一编码。'
  if (/渐进增强|优雅降级/.test(topic)) return '渐进增强是先保证低版本或能力较弱环境下的基础功能可用，再为现代浏览器增强体验；优雅降级是先面向现代浏览器实现完整能力，再为旧环境做兼容退化。前者更关注基础可用性，后者更关注高级体验向下兼容。'
  if (/drag API/i.test(topic)) return 'HTML5 Drag API 用于实现原生拖拽交互。被拖拽元素会触发 dragstart、drag、dragend，目标元素会触发 dragenter、dragover、dragleave、drop。实际使用时通常在 dragstart 设置 dataTransfer，在 dragover 阻止默认行为，并在 drop 中读取数据完成放置。'
  if (/HTML5/.test(topic)) return 'HTML5 增加了语义化标签、音视频标签、Canvas、SVG 支持、表单增强、本地存储、Web Worker、拖拽、地理位置等能力。它让浏览器能承载更多应用能力，而不只是展示静态文档。'
  return `${topic} 属于 HTML 基础能力，核心是理解标签、属性或浏览器能力的语义和使用边界。它通常影响页面结构、资源加载、可访问性、SEO 或浏览器兼容性，实际开发中应选择语义正确、行为稳定的写法。`
}

function answerForCss(topic: string) {
  if (/盒模型/.test(topic)) return 'CSS 盒模型由 content、padding、border、margin 组成。标准盒模型中 width 只包含 content，IE 盒模型或 border-box 中 width 包含 content、padding 和 border。实际布局常用 box-sizing: border-box 让尺寸更可控。'
  if (/BFC/.test(topic)) return 'BFC 是块级格式化上下文，是一块独立的布局区域。它内部元素布局不会影响外部，常用于清除浮动、阻止 margin 折叠、实现两栏布局。常见触发方式包括 overflow 非 visible、display: flow-root、float、position absolute/fixed。'
  if (/flex:1/.test(topic)) return 'flex: 1 通常等价于 flex: 1 1 0%，表示项目可以放大、可以缩小，基础尺寸按 0 计算，然后按剩余空间分配。它常用于让多个 flex 子项均分容器空间。'
  if (/Flex/.test(topic)) return 'Flex 是一维布局模型，主轴和交叉轴由 flex-direction 决定。容器通过 justify-content、align-items 控制对齐，子项通过 flex-grow、flex-shrink、flex-basis 分配空间。它适合导航、居中、等分和自适应布局。'
  if (/px、em、rem/.test(topic)) return 'px 是固定 CSS 像素；em 相对于当前元素或父级字体大小，容易层层叠加；rem 相对于根元素字体大小，更适合统一移动端适配。实际项目里固定边框常用 px，字号和间距可结合 rem 或响应式单位。'
  if (/水平垂直居中/.test(topic)) return '水平垂直居中常用 flex、grid、绝对定位加 transform、表格布局等。现代项目最推荐 flex 或 grid，例如 display:flex; justify-content:center; align-items:center，语义清晰且适应未知宽高。'
  if (/清除浮动/.test(topic)) return '清除浮动是为了解决子元素浮动后脱离普通文档流，父元素高度塌陷的问题。常见方式有 clearfix 伪元素、触发 BFC、额外 clear 元素。现代布局优先使用 flex/grid，减少浮动布局。'
  if (/margin重叠/.test(topic)) return 'margin 重叠通常发生在普通流块级元素的垂直方向，比如相邻兄弟、父子首尾 margin。解决方式包括触发 BFC、给父元素加 border/padding、使用 flex/grid 布局或改用 padding 管理间距。'
  if (/z-index/.test(topic)) return 'z-index 只有在元素参与层叠上下文时才有意义，通常需要定位或 flex/grid 子项等条件。它还受父级层叠上下文限制，子元素 z-index 再大也不能跳出父级层级。排查时要先找层叠上下文。'
  if (/position/.test(topic)) return 'position 常见值有 static、relative、absolute、fixed、sticky。relative 保留原位置并相对自身偏移；absolute 相对最近定位祖先；fixed 相对视口；sticky 在滚动阈值内表现为 relative，超过阈值后类似 fixed。'
  if (/三角形/.test(topic)) return 'CSS 三角形常用宽高为 0 的元素配合 border 实现：四个边框交汇形成三角区域，只保留一个方向的边框颜色，其他边框设为 transparent。它适合小箭头、气泡尖角等场景。'
  if (/0\\.5px|1px/.test(topic)) return '移动端细线问题来自设备像素比，1 个 CSS 像素可能对应多个物理像素。常见方案有 transform: scaleY(.5)、伪元素缩放、border-image 或使用 viewport 适配。要结合 DPR 和设计要求选择。'
  return `${topic} 属于 CSS 布局和样式基础，核心是理解相关属性或布局模型如何影响元素尺寸、位置、层叠和渲染。它通常用于解决页面排版、响应式适配或视觉还原问题，使用时需要注意兼容性、回流重绘和适用场景。`
}

function answerForNetwork(topic: string) {
  if (/HTTP.*状态码|状态码/.test(topic)) return 'HTTP 状态码表示请求处理结果。2xx 表示成功，3xx 表示重定向，4xx 表示客户端错误，5xx 表示服务端错误。常见的有 200 成功、301/302 重定向、304 协商缓存命中、400 参数错误、401 未认证、403 无权限、404 不存在、500 服务端错误。'
  if (/GET.*POST/.test(topic)) return 'GET 通常用于获取资源，参数常放 URL，天然可缓存、可收藏；POST 通常用于提交数据，参数放请求体，更适合创建或提交操作。两者本质都是 HTTP 方法，安全性不取决于方法本身，敏感信息应使用 HTTPS 并避免放 URL。'
  if (/HTTP2|HTTP\/2/.test(topic)) return 'HTTP/2 在一个 TCP 连接上支持多路复用，用二进制帧传输，并支持头部压缩和服务端推送，解决了 HTTP/1.1 队头阻塞和连接数量压力的一部分问题。但它仍基于 TCP，丢包时连接层仍可能影响所有流。'
  if (/HTTPS/.test(topic)) return 'HTTPS 是 HTTP over TLS，在 HTTP 和 TCP 之间增加 TLS 加密层。它通过证书验证服务器身份，协商密钥后加密传输内容，能防窃听、防篡改和一定程度防中间人攻击。实际项目中登录、支付和接口都应使用 HTTPS。'
  if (/DNS/.test(topic)) return 'DNS 的作用是把域名解析成 IP。浏览器会先查缓存，再查系统缓存、本地域名服务器，必要时递归或迭代查询根域、顶级域和权威 DNS。DNS 解析耗时会影响首屏，所以可以用缓存、预解析和稳定 DNS 服务优化。'
  if (/TCP.*三次握手|三次握手/.test(topic)) return 'TCP 三次握手用于建立可靠连接：客户端发 SYN，服务端回 SYN+ACK，客户端再回 ACK。三次的目的是确认双方收发能力正常，并同步初始序列号，避免历史连接请求造成错误连接。'
  if (/四次挥手/.test(topic)) return 'TCP 四次挥手用于关闭连接，因为双方都可能还有数据要发。主动方发 FIN，接收方回 ACK；接收方数据发完后再发 FIN，主动方回 ACK，并进入 TIME_WAIT，确保最后 ACK 可重传且旧报文不会污染新连接。'
  if (/WebSocket/.test(topic)) return 'WebSocket 是基于 TCP 的全双工通信协议，先通过 HTTP Upgrade 完成握手，之后客户端和服务端都可以主动发送消息。它适合聊天室、实时通知、协同编辑等实时场景，相比轮询更低延迟、更少无效请求。'
  return `${topic} 属于网络基础，核心是理解协议或机制的定义、工作流程和前端影响。它通常关联请求响应、缓存、连接复用、安全、跨域和性能排查，实际项目中常用于接口联调、资源加载优化和线上问题定位。`
}

function answerForBrowser(topic: string) {
  if (/XSS/.test(topic)) return 'XSS 是攻击者把恶意脚本注入页面并在用户浏览器中执行。常见类型有存储型、反射型和 DOM 型。防御方式包括输入校验、输出转义、避免直接使用 innerHTML、开启 CSP、Cookie 设置 HttpOnly 和 SameSite。'
  if (/CSRF/.test(topic)) return 'CSRF 是攻击者诱导已登录用户在不知情情况下向目标站点发起请求，利用浏览器自动携带 Cookie 的特性完成操作。防御方式包括 CSRF Token、SameSite Cookie、校验 Origin/Referer，以及对敏感操作使用二次确认。'
  if (/缓存机制|强缓存|协商缓存/.test(topic)) return '浏览器缓存分为强缓存和协商缓存。强缓存命中时不发请求，主要看 Cache-Control、Expires；协商缓存会向服务器确认资源是否变化，主要用 ETag/If-None-Match 和 Last-Modified/If-Modified-Since，命中返回 304。'
  if (/渲染过程/.test(topic)) return '浏览器渲染大致包括解析 HTML 生成 DOM，解析 CSS 生成 CSSOM，合成渲染树，布局计算位置尺寸，绘制并合成图层。JS 可能阻塞解析，CSS 会影响渲染树，所以关键资源大小和加载顺序会影响首屏。'
  if (/同源策略/.test(topic)) return '同源策略要求协议、域名、端口都相同，浏览器才允许脚本自由读取资源。它是浏览器安全基础，限制跨站读取 Cookie、DOM 和接口响应。跨域访问通常通过 CORS、代理、JSONP 或 postMessage 等方式处理。'
  if (/事件循环/.test(topic)) return '事件循环负责协调同步代码、宏任务和微任务。主线程先执行当前同步任务，执行栈清空后处理微任务队列，再进入下一轮宏任务。Promise.then、queueMicrotask 属于微任务，setTimeout、事件回调通常属于宏任务。'
  if (/垃圾回收/.test(topic)) return 'V8 垃圾回收主要基于可达性分析，从根对象出发仍能访问到的对象会保留，不可达对象会被回收。V8 还采用分代回收，新生代回收频繁，老生代回收成本更高。开发中要避免无用引用长期存在。'
  return `${topic} 属于浏览器基础，核心是理解浏览器中的定义、工作流程和影响。它通常关联渲染、安全、缓存、事件、存储或内存管理，实际项目中需要能说清浏览器做了什么，以及如何排查和优化。`
}

function answerForGeneric(topic: string, category: string) {
  if (category === 'HTML') return answerForHtml(topic)
  if (category === 'CSS') return answerForCss(topic)
  if (category === 'HTTP / 网络') return answerForNetwork(topic)
  if (category === '浏览器原理') return answerForBrowser(topic)
  if (category === 'JavaScript 基础') {
    return `${topic} 属于 JavaScript 基础能力，核心包括语言概念、执行机制和边界行为。它通常会关联类型转换、作用域、this、原型、异步或内存管理等规则，实际开发中需要用清晰的写法减少隐式行为，避免因为运行时规则理解不清导致 bug。`
  }
  return `${topic} 是前端面试中的常见基础点，核心包括概念定义、工作机制、使用场景和注意事项。它通常用于解决具体工程问题，使用时需要理解它的作用、设计原因和项目落地边界。`
}

function codeOutputAnswer(answer: string) {
  const match = answer.match(/输出顺序是[:：]\s*([^。]+)/)
  if (match) return `输出结果是：${match[1].trim()}。`
  return answer.replace(/。口述时[\s\S]*$/, '。').replace(/口述时我会[\s\S]*$/, '').trim()
}

function explanationFor(question: ImportQuestion, topic: string, previousExplanation: string) {
  if (question.category === '代码输出') {
    return `这题的题解重点是按代码执行过程拆解：先执行同步语句，再清空微任务队列，然后进入下一轮宏任务；如果代码涉及 this、作用域、变量提升或原型链，需要结合调用点和属性查找顺序解释每一步输出。`
  }
  if (!previousExplanation || hasSameText(question.answer, previousExplanation) || !/这题|重点|常见|角度|容易|可以/.test(previousExplanation)) {
    return `这题可以从概念定义、核心机制、典型场景和常见坑四个角度回答。先给直接结论，再补充为什么会这样，最后联系项目里的使用边界。`
  }
  return previousExplanation
}

async function main() {
  const originalItems = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as ImportQuestion[]
  const removed: ImportQuestion[] = []
  let cleanedAnswers = 0
  let cleanedExplanations = 0
  let cleanedOtherFields = 0

  const items = originalItems.filter((question) => {
    if (isInvalidCodeOutputQuestion(question)) removed.push(question)
    return !isInvalidCodeOutputQuestion(question)
  })

  for (const question of items) {
    let topic = cleanTopic(question.question)
    const originalAnswer = question.answer
    const originalExplanation = question.explanation
    const originalQuestion = question.question
    const originalFollowUps = JSON.stringify(question.followUps ?? [])
    const shouldTreatAsCodeOutput = isCodeOutputQuestion(question)

    if (!shouldTreatAsCodeOutput) {
      question.question = cleanQuestionText(question.question)
      topic = cleanTopic(question.question)
    }

    if (Array.isArray(question.followUps)) {
      question.followUps = question.followUps.map(cleanFollowUpText).filter(Boolean)
    }

    if (shouldTreatAsCodeOutput) {
      question.answer = codeOutputAnswer(question.answer)
    } else if (badAnswerPattern.test(question.answer) || question.answer.includes('我会')) {
      question.answer = answerForGeneric(topic, question.category)
    }

    question.explanation = explanationFor(question, topic, originalExplanation)
    question.keywords = keywordsFor(question, topic)
    question.commonMissingPoints = Array.isArray(question.commonMissingPoints) && question.commonMissingPoints.length
      ? question.commonMissingPoints
      : missingPointsFor(question.category)

    if (question.answer !== originalAnswer) cleanedAnswers += 1
    if (question.explanation !== originalExplanation) cleanedExplanations += 1
    if (question.question !== originalQuestion || JSON.stringify(question.followUps ?? []) !== originalFollowUps) cleanedOtherFields += 1
  }

  fs.writeFileSync(jsonPath, `${JSON.stringify(items, null, 2)}\n`, 'utf8')

  if (removed.length) {
    await prisma.question.deleteMany({ where: { id: { in: removed.map((question) => question.id) } } })
  }

  const databaseQuestions = await prisma.question.findMany({
    select: { id: true, category: true, question: true, codeExample: true },
  })
  const invalidDatabaseQuestions = databaseQuestions.filter(isInvalidCodeOutputQuestion)
  if (invalidDatabaseQuestions.length) {
    await prisma.question.deleteMany({ where: { id: { in: invalidDatabaseQuestions.map((question) => question.id) } } })
  }

  for (const question of items) {
    await prisma.question.update({
      where: { id: question.id },
      data: {
        category: question.category,
        type: question.type,
        difficulty: question.difficulty,
        question: question.question,
        answer: question.answer,
        explanation: question.explanation,
        keywords: stringifyArray(question.keywords),
        commonMissingPoints: stringifyArray(question.commonMissingPoints),
        codeExample: isBlank(question.codeExample) ? null : question.codeExample,
        followUps: Array.isArray(question.followUps) ? stringifyArray(question.followUps) : null,
        sourceName: question.sourceName,
        sourceUrl: question.sourceUrl,
        quality: question.quality,
        priority: typeof question.priority === 'number' ? question.priority : null,
      },
    }).catch(async () => {
      await prisma.question.create({
        data: {
          id: question.id,
          category: question.category,
          type: question.type,
          difficulty: question.difficulty,
          question: question.question,
          answer: question.answer,
          explanation: question.explanation,
          keywords: stringifyArray(question.keywords),
          commonMissingPoints: stringifyArray(question.commonMissingPoints),
          codeExample: isBlank(question.codeExample) ? null : question.codeExample,
          followUps: Array.isArray(question.followUps) ? stringifyArray(question.followUps) : null,
          sourceName: question.sourceName,
          sourceUrl: question.sourceUrl,
          quality: question.quality,
          priority: typeof question.priority === 'number' ? question.priority : null,
        },
      })
    })
  }

  const total = await prisma.question.count()
  const removedCount = new Set([...removed.map((question) => question.id), ...invalidDatabaseQuestions.map((question) => question.id)]).size
  console.log(`原始题目数量: ${originalItems.length}`)
  console.log(`清洗 answer 的题目数量: ${cleanedAnswers}`)
  console.log(`清洗 explanation 的题目数量: ${cleanedExplanations}`)
  console.log(`清洗题干/追问的题目数量: ${cleanedOtherFields}`)
  console.log(`删除无效代码输出题数量: ${removedCount}`)
  console.log(`data-import/questions.json 当前题目数量: ${items.length}`)
  console.log(`数据库最终题目数量: ${total}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
