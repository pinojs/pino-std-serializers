'use strict'

const assert = require('node:assert')
const { tspl } = require('@matteo.collina/tspl')
const http = require('node:http')
const { test } = require('node:test')
const serializers = require('../lib/req')
const { wrapRequestSerializer } = require('../')

test('maps request', async (t) => {
  const p = tspl(t, { plan: 2 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    const serialized = serializers.mapHttpRequest(req)
    p.ok(serialized.req)
    p.ok(serialized.req.method)
    res.end()
  }

  await p.completed
})

test('does not return excessively long object', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(Object.keys(serialized).length, 6)
    res.end()
  }

  await p.completed
})

test('req.raw is available', async (t) => {
  const p = tspl(t, { plan: 2 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    req.foo = 'foo'
    const serialized = serializers.reqSerializer(req)
    p.ok(serialized.raw)
    p.strictEqual(serialized.raw.foo, 'foo')
    res.end()
  }

  await p.completed
})

test('req.raw will be obtained in from input request raw property if input request raw property is truthy', async (t) => {
  const p = tspl(t, { plan: 2 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    req.raw = { req: { foo: 'foo' }, res: {} }
    const serialized = serializers.reqSerializer(req)
    p.ok(serialized.raw)
    p.strictEqual(serialized.raw.req.foo, 'foo')
    res.end()
  }

  await p.completed
})

test('req.id defaults to undefined', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(serialized.id, undefined)
    res.end()
  }

  await p.completed
})

test('req.id has a non-function value', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(typeof serialized.id === 'function', false)
    res.end()
  }

  await p.completed
})

test('req.id will be obtained from input request info.id when input request id does not exist', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    req.info = { id: 'test' }
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(serialized.id, 'test')
    res.end()
  }

  await p.completed
})

test('req.id has a non-function value with custom id function', async (t) => {
  const p = tspl(t, { plan: 2 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    req.id = function () { return 42 }
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(typeof serialized.id === 'function', false)
    p.strictEqual(serialized.id, 42)
    res.end()
  }

  await p.completed
})

test('req.url will be obtained from input request req.path when input request url is an object', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    req.path = '/test'
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(serialized.url, '/test')
    res.end()
  }

  await p.completed
})

test('req.url will be obtained from input request url.path when input request url is an object', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    req.url = { path: '/test' }
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(serialized.url, '/test')
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

  function handler (req, res) {
    req.url = '/test'
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(serialized.url, '/test')
    res.end()
  }

  await p.completed
})

test('req.url will be empty when input request path and url are not defined', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(serialized.url, '/')
    res.end()
  }

  await p.completed
})

test('req.url will be obtained from input request originalUrl when available', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    req.originalUrl = '/test'
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(serialized.url, '/test')
    res.end()
  }

  await p.completed
})

test('req.url will be obtained from input request url when req path is a function', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    req.path = function () {
      throw new Error('unexpected invocation')
    }
    req.url = '/test'
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(serialized.url, '/test')
    res.end()
  }

  await p.completed
})

test('req.url being undefined does not throw an error', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    req.url = undefined
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(serialized.url, undefined)
    res.end()
  }

  await p.completed
})

test('can wrap request serializers', async (t) => {
  const p = tspl(t, { plan: 3 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  const serailizer = wrapRequestSerializer(function (req) {
    p.ok(req.method)
    p.strictEqual(req.method, 'GET')
    delete req.method
    return req
  })

  function handler (req, res) {
    const serialized = serailizer(req)
    p.ok(!serialized.method)
    res.end()
  }

  await p.completed
})

test('req.remoteAddress will be obtained from request socket.remoteAddress as fallback', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    req.socket = { remoteAddress: 'http://localhost' }
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(serialized.remoteAddress, 'http://localhost')
    res.end()
  }

  await p.completed
})

test('req.remoteAddress will be obtained from request info.remoteAddress if available', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    req.info = { remoteAddress: 'http://localhost' }
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(serialized.remoteAddress, 'http://localhost')
    res.end()
  }

  await p.completed
})

test('req.remotePort will be obtained from request socket.remotePort as fallback', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    req.socket = { remotePort: 3000 }
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(serialized.remotePort, 3000)
    res.end()
  }

  await p.completed
})

test('req.remotePort will be obtained from request info.remotePort if available', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    req.info = { remotePort: 3000 }
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(serialized.remotePort, 3000)
    res.end()
  }

  await p.completed
})

test('req.query is available', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    req.query = '/foo?bar=foobar&bar=foo'
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(serialized.query, '/foo?bar=foobar&bar=foo')
    res.end()
  }

  await p.completed
})

test('req.params is available', async (t) => {
  const p = tspl(t, { plan: 1 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    req.params = '/foo/bar'
    const serialized = serializers.reqSerializer(req)
    p.strictEqual(serialized.params, '/foo/bar')
    res.end()
  }

  await p.completed
})

test('serializes WHATWG Request via reqSerializer', () => {
  const req = new Request('http://localhost/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' }
  })
  const serialized = serializers.reqSerializer(req)
  assert.strictEqual(serialized.method, 'POST')
  assert.strictEqual(serialized.url, 'http://localhost/test')
  assert.strictEqual(serialized.headers['content-type'], 'application/json')
})

test('maps WHATWG Request', () => {
  const req = new Request('http://localhost/test', { method: 'GET' })
  const serialized = serializers.mapHttpRequest(req)
  assert.ok(serialized.req)
  assert.strictEqual(serialized.req.method, 'GET')
})

test('whatwgReqSerializer serializes Request', () => {
  const req = new Request('http://localhost/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' }
  })
  const serialized = serializers.whatwgReqSerializer(req)
  assert.strictEqual(serialized.method, 'POST')
  assert.strictEqual(serialized.url, 'http://localhost/test')
  assert.strictEqual(serialized.headers['content-type'], 'application/json')
})

test('whatwgReqSerializer raw is available', () => {
  const req = new Request('http://localhost/test')
  const serialized = serializers.whatwgReqSerializer(req)
  assert.ok(serialized.raw)
  assert.strictEqual(serialized.raw, req)
})

test('whatwgReqSerializer id defaults to undefined', () => {
  const req = new Request('http://localhost/test')
  const serialized = serializers.whatwgReqSerializer(req)
  assert.strictEqual(serialized.id, undefined)
})

test('whatwgReqSerializer headers are serialized correctly', () => {
  const req = new Request('http://localhost/test', {
    headers: {
      'content-type': 'application/json',
      'x-custom-header': 'custom-value'
    }
  })
  const serialized = serializers.whatwgReqSerializer(req)
  assert.strictEqual(serialized.headers['content-type'], 'application/json')
  assert.strictEqual(serialized.headers['x-custom-header'], 'custom-value')
})

test('nodeReqSerializer is exported', async (t) => {
  const p = tspl(t, { plan: 2 })

  const server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.after(() => server.close())

  function handler (req, res) {
    const serialized = serializers.nodeReqSerializer(req)
    p.ok(serialized.method)
    p.strictEqual(serialized.method, 'GET')
    res.end()
  }

  await p.completed
})
