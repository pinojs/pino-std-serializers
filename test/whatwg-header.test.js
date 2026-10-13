'use strict'

const assert = require('node:assert/strict')
const { test } = require('node:test')
const { req, res } = require('..')

test('WHATWG request preserves __proto__ header', () => {
  const request = new Request('https://example.com', {
    headers: [['__proto__', 'present'], ['x-example', 'ok']]
  })
  const headers = req(request).headers

  assert.strictEqual(Object.hasOwn(headers, '__proto__'), true)
  assert.strictEqual(headers['__proto__'], 'present')
  assert.strictEqual(headers['x-example'], 'ok')
  assert.strictEqual(JSON.parse(JSON.stringify(headers))['__proto__'], 'present')
})

test('WHATWG response preserves __proto__ header', () => {
  const response = new Response(null, {
    headers: [['__proto__', 'present'], ['x-example', 'ok']]
  })
  const headers = res(response).headers

  assert.strictEqual(Object.hasOwn(headers, '__proto__'), true)
  assert.strictEqual(headers['__proto__'], 'present')
  assert.strictEqual(headers['x-example'], 'ok')
  assert.strictEqual(JSON.parse(JSON.stringify(headers))['__proto__'], 'present')
})
