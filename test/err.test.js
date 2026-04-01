'use strict'

const assert = require('node:assert')
const { test } = require('node:test')
const serializer = require('../lib/err')
const { wrapErrorSerializer } = require('../')

test('serializes Error objects', () => {
  const serialized = serializer(Error('foo'))
  assert.strictEqual(serialized.type, 'Error')
  assert.strictEqual(serialized.message, 'foo')
  assert.match(serialized.stack, /err\.test\.js:/)
})

test('serializes Error objects with extra properties', () => {
  const err = Error('foo')
  err.statusCode = 500
  const serialized = serializer(err)
  assert.strictEqual(serialized.type, 'Error')
  assert.strictEqual(serialized.message, 'foo')
  assert.ok(serialized.statusCode)
  assert.strictEqual(serialized.statusCode, 500)
  assert.match(serialized.stack, /err\.test\.js:/)
})

test('does not serialize inherited enumerable properties', () => {
  class ProtoError extends Error {}
  ProtoError.prototype.protoValue = 'proto'

  const err = new ProtoError('foo')
  err.ownValue = 'own'

  const serialized = serializer(err)
  assert.strictEqual(serialized.ownValue, 'own')
  assert.ok(!Object.prototype.hasOwnProperty.call(serialized, 'protoValue'))
})

test('serializes Error objects with subclass "type"', () => {
  class MyError extends Error {}
  const err = new MyError('foo')
  const serialized = serializer(err)
  assert.strictEqual(serialized.type, 'MyError')
})

test('serializes nested errors', () => {
  const err = Error('foo')
  err.inner = Error('bar')
  const serialized = serializer(err)
  assert.strictEqual(serialized.type, 'Error')
  assert.strictEqual(serialized.message, 'foo')
  assert.match(serialized.stack, /err\.test\.js:/)
  assert.strictEqual(serialized.inner.type, 'Error')
  assert.strictEqual(serialized.inner.message, 'bar')
  assert.match(serialized.inner.stack, /Error: bar/)
  assert.match(serialized.inner.stack, /err\.test\.js:/)
})

test('serializes error causes', () => {
  for (const cause of [
    Error('bar'),
    { message: 'bar', stack: 'Error: bar: err.test.js:' }
  ]) {
    const err = Error('foo')
    err.cause = cause
    err.cause.cause = Error('abc')
    const serialized = serializer(err)
    assert.strictEqual(serialized.type, 'Error')
    assert.strictEqual(serialized.message, 'foo: bar: abc')
    assert.match(serialized.stack, /err\.test\.js:/)
    assert.match(serialized.stack, /Error: foo/)
    assert.match(serialized.stack, /Error: bar/)
    assert.match(serialized.stack, /Error: abc/)
    assert.ok(!serialized.cause)
  }
})

test('serializes error causes with VError support', function (t) {
  // Fake VError-style setup
  const err = Error('foo: bar')
  err.foo = 'abc'
  err.cause = function () {
    const err = Error('bar')
    err.cause = Error(this.foo)
    return err
  }
  const serialized = serializer(err)
  assert.strictEqual(serialized.type, 'Error')
  assert.strictEqual(serialized.message, 'foo: bar: abc')
  assert.match(serialized.stack, /err\.test\.js:/)
  assert.match(serialized.stack, /Error: foo/)
  assert.match(serialized.stack, /Error: bar/)
  assert.match(serialized.stack, /Error: abc/)
})

test('keeps non-error cause', () => {
  const err = Error('foo')
  err.cause = 'abc'
  const serialized = serializer(err)
  assert.strictEqual(serialized.type, 'Error')
  assert.strictEqual(serialized.message, 'foo')
  assert.strictEqual(serialized.cause, 'abc')
})

test('prevents infinite recursion', () => {
  const err = Error('foo')
  err.inner = err
  const serialized = serializer(err)
  assert.strictEqual(serialized.type, 'Error')
  assert.strictEqual(serialized.message, 'foo')
  assert.match(serialized.stack, /err\.test\.js:/)
  assert.ok(!serialized.inner)
})

test('cleans up infinite recursion tracking', () => {
  const err = Error('foo')
  const bar = Error('bar')
  err.inner = bar
  bar.inner = err

  serializer(err)
  const serialized = serializer(err)

  assert.strictEqual(serialized.type, 'Error')
  assert.strictEqual(serialized.message, 'foo')
  assert.match(serialized.stack, /err\.test\.js:/)
  assert.ok(serialized.inner)
  assert.strictEqual(serialized.inner.type, 'Error')
  assert.strictEqual(serialized.inner.message, 'bar')
  assert.match(serialized.inner.stack, /Error: bar/)
  assert.ok(!serialized.inner.inner)
})

test('err.raw is available', () => {
  const err = Error('foo')
  const serialized = serializer(err)
  assert.strictEqual(serialized.raw, err)
})

test('redefined err.constructor doesnt crash serializer', () => {
  function check (a, name) {
    assert.strictEqual(a.type, name)
    assert.strictEqual(a.message, 'foo')
  }

  const err1 = TypeError('foo')
  err1.constructor = '10'

  const err2 = TypeError('foo')
  err2.constructor = undefined

  const err3 = Error('foo')
  err3.constructor = null

  const err4 = Error('foo')
  err4.constructor = 10

  class MyError extends Error {}
  const err5 = new MyError('foo')
  err5.constructor = undefined

  check(serializer(err1), 'TypeError')
  check(serializer(err2), 'TypeError')
  check(serializer(err3), 'Error')
  check(serializer(err4), 'Error')
  // We do not expect 'MyError' because err5.constructor has been blown away.
  // `err5.name` is 'Error' from the base class prototype.
  check(serializer(err5), 'Error')
})

test('pass through anything that does not look like an Error', () => {
  function check (a) {
    assert.strictEqual(serializer(a), a)
  }

  check('foo')
  check({ hello: 'world' })
  check([1, 2])
})

test('can wrap err serializers', () => {
  const err = Error('foo')
  err.foo = 'foo'
  const serializer = wrapErrorSerializer(function (err) {
    delete err.foo
    err.bar = 'bar'
    return err
  })
  const serialized = serializer(err)
  assert.strictEqual(serialized.type, 'Error')
  assert.strictEqual(serialized.message, 'foo')
  assert.match(serialized.stack, /err\.test\.js:/)
  assert.ok(!serialized.foo)
  assert.strictEqual(serialized.bar, 'bar')
})

test('serializes aggregate errors', { skip: !global.AggregateError }, () => {
  const foo = new Error('foo')
  const bar = new Error('bar')
  for (const aggregate of [
    new AggregateError([foo, bar], 'aggregated message'),
    { errors: [foo, bar], message: 'aggregated message', stack: 'err.test.js:' }
  ]) {
    const serialized = serializer(aggregate)
    assert.strictEqual(serialized.message, 'aggregated message')
    assert.strictEqual(serialized.aggregateErrors.length, 2)
    assert.strictEqual(serialized.aggregateErrors[0].message, 'foo')
    assert.strictEqual(serialized.aggregateErrors[1].message, 'bar')
    assert.match(serialized.aggregateErrors[0].stack, /^Error: foo/)
    assert.match(serialized.aggregateErrors[1].stack, /^Error: bar/)
    assert.match(serialized.stack, /err\.test\.js:/)
  }
})

test('uses toJSON() from class prototype', () => {
  class MyError extends Error {
    constructor (message) {
      super(message)
      this.name = 'MyError'
      this.largeData = { data: 'x'.repeat(10000) }
    }

    toJSON () {
      return { message: this.message, name: this.name }
    }
  }

  const err = new MyError('test')
  const serialized = serializer(err)

  // toJSON() should be respected, so largeData should not be present
  assert.ok(!('largeData' in serialized))
  assert.strictEqual(serialized.message, 'test')
  assert.strictEqual(serialized.name, 'MyError')
  assert.ok(serialized.stack) // stack should still be added by serializer
  assert.strictEqual(serialized.type, 'MyError') // type should be added
  assert.strictEqual(serialized.raw, err) // raw should be present
})

test('uses toJSON() with custom type when toJSON returns partial data', () => {
  class MyError extends Error {
    constructor (message) {
      super(message)
      this.name = 'MyError'
      this.customField = 'custom'
    }

    toJSON () {
      return { message: this.message } // doesn't include type
    }
  }

  const err = new MyError('test')
  const serialized = serializer(err)

  // type should be added by serializer if not present in toJSON output
  assert.strictEqual(serialized.type, 'MyError')
  assert.strictEqual(serialized.message, 'test')
  assert.ok(serialized.stack)
})

test('uses toJSON() from own property (legacy behavior)', () => {
  const err = Error('test')
  err.customField = 'value'
  err.toJSON = function () {
    return { message: this.message, customField: this.customField }
  }

  const serialized = serializer(err)

  assert.strictEqual(serialized.message, 'test')
  assert.strictEqual(serialized.customField, 'value')
  assert.ok(serialized.stack) // stack should still be added
  assert.strictEqual(serialized.type, 'Error') // type should be added
})

test('uses toJSON() with error causes', () => {
  class MyError extends Error {
    constructor (message, cause) {
      super(message, { cause })
      this.name = 'MyError'
      this.cause = cause
    }

    toJSON () {
      return { message: this.message, name: this.name }
    }
  }

  const cause = new Error('cause')
  const err = new MyError('test', cause)
  const serialized = serializer(err)

  // toJSON() should be used, cause message should be included in message via messageWithCauses
  assert.ok(!('cause' in serialized))
  assert.match(serialized.message, /test/)
  assert.strictEqual(serialized.name, 'MyError')
})

test('uses toJSON() - custom fields not added if not in toJSON output', () => {
  class MyError extends Error {
    constructor (message) {
      super(message)
      this.name = 'MyError'
      this.customField = 'value'
    }

    toJSON () {
      return { message: 'overridden' } // intentionally excludes customField
    }
  }

  const err = new MyError('test')
  const serialized = serializer(err)

  // toJSON() controls serialization - customField should NOT be added
  assert.strictEqual(serialized.message, 'overridden')
  assert.ok(!('customField' in serialized)) // intentionally excluded
  assert.ok(serialized.stack) // stack should still be added
  assert.strictEqual(serialized.type, 'MyError') // type should be added
})
