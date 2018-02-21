'use strict'

var http = require('http')
var test = require('tap').test
var serializers = require('../lib/req')
var wrapRequestSerializer = require('../').wrapRequestSerializer

test('maps request', function (t) {
  t.plan(2)

  var server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.tearDown(() => server.close())

  function handler (req, res) {
    var serialized = serializers.mapHttpRequest(req)
    t.ok(serialized.req)
    t.ok(serialized.req.method)
    t.end()
    res.end()
  }
})

test('does not return excessively long object', function (t) {
  t.plan(1)

  var server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.tearDown(() => server.close())

  function handler (req, res) {
    var serialized = serializers.reqSerializer(req)
    t.is(Object.keys(serialized).length, 6)
    res.end()
  }
})

test('req.raw is available', function (t) {
  t.plan(2)

  var server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.tearDown(() => server.close())

  function handler (req, res) {
    req.foo = 'foo'
    var serialized = serializers.reqSerializer(req)
    t.ok(serialized.raw)
    t.is(serialized.raw.foo, 'foo')
    res.end()
  }
})

test('req.id has a non-function value', function (t) {
  t.plan(1)

  var server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.tearDown(() => server.close())

  function handler (req, res) {
    var serialized = serializers.reqSerializer(req)
    t.is(typeof serialized.id === 'function', false)
    res.end()
  }
})

test('req.id has a non-function value with custom id function', function (t) {
  t.plan(2)

  var server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.tearDown(() => server.close())

  function handler (req, res) {
    req.id = function () { return 42 }
    var serialized = serializers.reqSerializer(req)
    t.is(typeof serialized.id === 'function', false)
    t.is(serialized.id, 42)
    res.end()
  }
})

test('can wrap request serializers', function (t) {
  t.plan(3)

  var server = http.createServer(handler)
  server.unref()
  server.listen(0, () => {
    http.get(server.address(), () => {})
  })

  t.tearDown(() => server.close())

  var serailizer = wrapRequestSerializer(function (req) {
    t.ok(req.method)
    t.is(req.method, 'GET')
    delete req.method
    return req
  })

  function handler (req, res) {
    var serialized = serailizer(req)
    t.notOk(serialized.method)
    res.end()
  }
})
