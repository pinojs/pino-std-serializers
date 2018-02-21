'use strict'

var test = require('tap').test
const serializer = require('../lib/err')

test('serializes Error objects', function (t) {
  t.plan(3)
  var serialized = serializer(Error('foo'))
  t.is(serialized.type, 'Error')
  t.is(serialized.message, 'foo')
  t.match(serialized.stack, /err\.test\.js:/)
})

test('serializes Error objects with extra properties', function (t) {
  t.plan(5)
  var err = Error('foo')
  err.statusCode = 500
  var serialized = serializer(err)
  t.is(serialized.type, 'Error')
  t.is(serialized.message, 'foo')
  t.ok(serialized.statusCode)
  t.is(serialized.statusCode, 500)
  t.match(serialized.stack, /err\.test\.js:/)
})
