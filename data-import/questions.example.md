# Questions Markdown Import Example

id: import-network-cors-01
category: HTTP / 网络
type: short_answer
difficulty: medium
question: CORS 的本质是什么？
answer: CORS 是浏览器基于同源策略实施的跨域资源访问机制。服务端通过 Access-Control-Allow-Origin 等响应头明确授权，浏览器才会把响应交给前端代码。非简单请求通常会先发送 OPTIONS 预检。
explanation: 回答要说明限制来自浏览器、安全授权在服务端，以及预检的作用。
keywords: 同源策略, 浏览器, 响应头, 服务端, OPTIONS
commonMissingPoints: 把 CORS 误解为后端跨域限制, 忽略服务端授权
followUps: 哪些请求会触发预检？
sourceName: 公开前端面试知识点整理
sourceUrl: manual
