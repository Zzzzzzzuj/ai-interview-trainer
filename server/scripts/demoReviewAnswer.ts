const apiBaseUrl = process.env.DEMO_API_BASE_URL ?? 'http://localhost:3001/api'

async function postReview(body: unknown) {
  const response = await fetch(`${apiBaseUrl}/review-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return {
    status: response.status,
    body: await response.json(),
  }
}

async function main() {
  const validResult = await postReview({
    questionId: 'demo-closure',
    question: '闭包是什么？',
    referenceAnswer: '闭包是函数和其词法作用域的组合，函数即使在外层函数执行结束后，仍然可以访问外层作用域中的变量。',
    keywords: ['闭包', '词法作用域', '变量'],
    commonMissingPoints: ['没有说明词法作用域', '没有说明外层函数结束后仍可访问变量'],
    userAnswer: '闭包就是函数可以记住并访问外部变量。',
  })

  const invalidResult = await postReview({
    questionId: 'demo-invalid',
    question: '闭包是什么？',
    referenceAnswer: '闭包是函数和词法作用域的组合。',
    keywords: '闭包',
    commonMissingPoints: [],
    userAnswer: '闭包是函数能访问外部变量。',
  })

  const longResult = await postReview({
    questionId: 'demo-long-answer',
    question: 'Promise 的作用是什么？'.repeat(100),
    referenceAnswer: 'Promise 用来表示异步操作最终完成或失败的结果。'.repeat(200),
    keywords: ['Promise', '异步', '状态'],
    commonMissingPoints: ['没有说明状态不可逆'],
    userAnswer: 'Promise 是异步方案。'.repeat(1000),
  })

  console.log(JSON.stringify({
    validFallback: {
      status: validResult.status,
      source: validResult.body.source,
      fields: Object.keys(validResult.body),
    },
    invalidPayload: {
      status: invalidResult.status,
      message: invalidResult.body.message,
    },
    longInput: {
      status: longResult.status,
      source: longResult.body.source,
      score: longResult.body.score,
    },
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
