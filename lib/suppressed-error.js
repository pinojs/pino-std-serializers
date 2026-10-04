'use strict'

const { isErrorLike } = require('./err-helpers')
const { pinoErrorSymbols } = require('./err-proto')
const { seen } = pinoErrorSymbols

function maybeSerializeSuppressedError (err, target, serialize) {
  // SuppressedError stores these properties as non-enumerable own properties.
  for (const key of ['error', 'suppressed']) {
    if (!Object.prototype.hasOwnProperty.call(err, key) || Object.prototype.propertyIsEnumerable.call(err, key)) {
      continue
    }
    const val = err[key]
    if (isErrorLike(val)) {
      if (!Object.prototype.hasOwnProperty.call(val, seen)) {
        target[key] = serialize(val)
      }
    } else {
      target[key] = val
    }
  }
}

module.exports = { maybeSerializeSuppressedError }
