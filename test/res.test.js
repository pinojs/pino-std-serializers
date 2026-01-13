'use strict'

/* eslint-disable no-prototype-builtins */

const assert = require('node:assert')
const { tspl } = require('@matteo.collina/tspl')
const http = require('node:http')
const { test } = require('node:test')
const serializers = require('../lib/res')
const { wrapResponseSerializer } = require('../')

test('res.raw is not enumerable', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (_req, res) {
    const serialized = serializers.resSerializer(res)
    p.strictEqual(serialized.propertyIsEnumerable('raw'), false)
    res.end()
  }

  await p.completed
})

test('res.raw is available', async (t) => {
  const p = tspl(t, { plan: 2 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (_req, res) {
    res.statusCode = 200
    const serialized = serializers.resSerializer(res)
    p.ok(serialized.raw)
    p.strictEqual(serialized.raw.statusCode, 200)
    res.end()
  }

  await p.completed
})

test('can wrap response serializers', async (t) => {
  const p = tspl(t, { plan: 3 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  const serializer = wrapResponseSerializer(function (res) {
    p.ok(res.statusCode)
    p.strictEqual(res.statusCode, 200)
    delete res.statusCode
    return res
  })

  function handler (_req, res) {
    res.end()
    res.statusCode = 200
    const serialized = serializer(res)
    p.ok(!serialized.statusCode)
  }

  await p.completed
})

test('res.headers is serialized', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (_req, res) {
    res.setHeader('x-custom', 'y')
    const serialized = serializers.resSerializer(res)
    p.strictEqual(serialized.headers['x-custom'], 'y')
    res.end()
  }

  await p.completed
})

test('req.url will be obtained from input request url when input request url is not an object', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (_req, res) {
    const serialized = serializers.resSerializer(res)
    p.strictEqual(serialized.statusCode, null)
    res.end()
  }

  await p.completed
})

test('serializes WHATWG Response via resSerializer', () => {
  const res = new Response('OK', {
    status: 201,
    headers: { 'content-type': 'application/json' }
  })
  const serialized = serializers.resSerializer(res)
  assert.strictEqual(serialized.statusCode, 201)
  assert.strictEqual(serialized.headers['content-type'], 'application/json')
})

test('maps WHATWG Response', () => {
  const res = new Response('OK', { status: 200 })
  const serialized = serializers.mapHttpResponse(res)
  assert.ok(serialized.res)
  assert.strictEqual(serialized.res.statusCode, 200)
})

test('whatwgResSerializer serializes Response', () => {
  const res = new Response('OK', {
    status: 201,
    headers: { 'content-type': 'application/json' }
  })
  const serialized = serializers.whatwgResSerializer(res)
  assert.strictEqual(serialized.statusCode, 201)
  assert.strictEqual(serialized.headers['content-type'], 'application/json')
})

test('whatwgResSerializer raw is available', () => {
  const res = new Response('OK', { status: 200 })
  const serialized = serializers.whatwgResSerializer(res)
  assert.ok(serialized.raw)
  assert.strictEqual(serialized.raw, res)
})

test('whatwgResSerializer headers are serialized correctly', () => {
  const res = new Response('OK', {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'x-custom-header': 'custom-value'
    }
  })
  const serialized = serializers.whatwgResSerializer(res)
  assert.strictEqual(serialized.headers['content-type'], 'application/json')
  assert.strictEqual(serialized.headers['x-custom-header'], 'custom-value')
})

test('nodeResSerializer is exported', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (_req, res) {
    res.end()
    res.statusCode = 200
    const serialized = serializers.nodeResSerializer(res)
    p.strictEqual(serialized.statusCode, 200)
  }

  await p.completed
})
