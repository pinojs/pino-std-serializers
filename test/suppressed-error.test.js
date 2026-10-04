'use strict'

const assert = require('node:assert/strict')
const { test } = require('node:test')
const { err, errWithCause } = require('../')

// Node 18 and 20 do not provide SuppressedError. Match its property descriptors.
const Suppressed = globalThis.SuppressedError || class SuppressedError extends Error {
  constructor (error, suppressed, message) {
    super(message)
    Object.defineProperties(this, {
      error: { value: error, writable: true, configurable: true },
      suppressed: { value: suppressed, writable: true, configurable: true }
    })
  }
}

for (const [name, serialize] of [['err', err], ['errWithCause', errWithCause]]) {
  test(`${name} serializes non-enumerable suppressed errors`, () => {
    const error = new Error('operation failed')
    const suppressed = new Error('disposal failed')
    const original = new Suppressed(error, suppressed, 'cleanup failed')
    const result = serialize(original)

    assert.equal(result.type, 'SuppressedError')
    assert.equal(result.message, 'cleanup failed')
    assert.equal(result.error.message, error.message)
    assert.equal(result.error.stack, error.stack)
    assert.equal(result.suppressed.message, suppressed.message)
    assert.equal(result.suppressed.stack, suppressed.stack)
    assert.equal(result.raw, original)
    assert.equal(JSON.parse(JSON.stringify(result)).error.message, error.message)
  })

  test(`${name} serializes nested suppressed errors`, () => {
    const inner = new Suppressed(new Error('operation'), new Error('first disposal'), 'inner')
    const result = serialize(new Suppressed(new Error('second disposal'), inner, 'outer'))

    assert.equal(result.suppressed.type, 'SuppressedError')
    assert.equal(result.suppressed.error.message, 'operation')
    assert.equal(result.suppressed.suppressed.message, 'first disposal')
  })

  test(`${name} preserves non-error suppressed values`, () => {
    const result = serialize(new Suppressed('operation failed', null, 'cleanup'))

    assert.equal(result.error, 'operation failed')
    assert.equal(result.suppressed, null)
  })

  test(`${name} does not follow circular suppressed errors`, () => {
    const original = new Suppressed(undefined, undefined, 'circular')
    original.error = original
    original.suppressed = original
    const result = serialize(original)

    assert.equal(result.error, undefined)
    assert.equal(result.suppressed, undefined)
    assert.doesNotThrow(() => JSON.stringify(result))
  })

  test(`${name} preserves shared errors and can serialize the same error again`, () => {
    const shared = new Error('shared')
    const original = new Suppressed(shared, shared, 'cleanup')
    const result = serialize(original)

    assert.equal(result.error.message, 'shared')
    assert.equal(result.suppressed.message, 'shared')
    assert.deepEqual(serialize(original), result)
    assert.deepEqual(Object.getOwnPropertySymbols(original), [])
    assert.deepEqual(Object.getOwnPropertySymbols(shared), [])
  })

  test(`${name} keeps existing enumerable error properties`, () => {
    const original = new Error('outer')
    original.error = new Error('operation')
    original.suppressed = 42
    const result = serialize(original)

    assert.equal(result.error.message, 'operation')
    assert.equal(result.suppressed, 42)
  })
}

test('err preserves toJSON control over suppressed properties', () => {
  const original = new Suppressed(new Error('private'), new Error('also private'), 'cleanup')
  original.toJSON = () => ({ message: 'public' })
  const result = err(original)

  assert.equal(result.message, 'public')
  assert.equal(result.error, undefined)
  assert.equal(result.suppressed, undefined)
  assert.equal(Object.getOwnPropertyDescriptor(result, 'raw').enumerable, false)
})
