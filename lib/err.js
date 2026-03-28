'use strict'

module.exports = errSerializer

const { messageWithCauses, stackWithCauses, isErrorLike } = require('./err-helpers')
const { pinoErrProto, pinoErrorSymbols } = require('./err-proto')
const { seen } = pinoErrorSymbols

const { toString } = Object.prototype

function errSerializer (err) {
  if (!isErrorLike(err)) {
    return err
  }

  // Check if error has a toJSON method and use it if available
  if (typeof err.toJSON === 'function') {
    const json = err.toJSON()

    // Ensure essential fields are present
    if (json.type === undefined) {
      json.type = toString.call(err.constructor) === '[object Function]'
        ? err.constructor.name
        : err.name
    }
    if (json.message === undefined) {
      json.message = messageWithCauses(err)
    }
    if (json.stack === undefined) {
      json.stack = stackWithCauses(err)
    }

    // When toJSON() is defined, trust it to control serialization.
    // However, we still want to include nested errors (like err.errors array).
    // Only add properties that the error author explicitly included in toJSON output
    // OR are necessary for error structure (like errors array for AggregateError).

    // If the error has an errors array (AggregateError pattern), serialize it
    if (Array.isArray(err.errors)) {
      json.aggregateErrors = err.errors.map(e => errSerializer(e))
    }

    json.raw = err
    return json
  }

  err[seen] = undefined // tag to prevent re-looking at this
  const _err = Object.create(pinoErrProto)
  _err.type = toString.call(err.constructor) === '[object Function]'
    ? err.constructor.name
    : err.name
  _err.message = messageWithCauses(err)
  _err.stack = stackWithCauses(err)

  if (Array.isArray(err.errors)) {
    _err.aggregateErrors = err.errors.map(err => errSerializer(err))
  }

  for (const key in err) {
    if (_err[key] === undefined) {
      const val = err[key]
      if (isErrorLike(val)) {
        // We append cause messages and stacks to _err, therefore skipping causes here
        if (key !== 'cause' && !Object.prototype.hasOwnProperty.call(val, seen)) {
          _err[key] = errSerializer(val)
        }
      } else {
        _err[key] = val
      }
    }
  }

  delete err[seen] // clean up tag in case err is serialized again later
  _err.raw = err
  return _err
}
