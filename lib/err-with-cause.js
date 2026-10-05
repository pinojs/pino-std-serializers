'use strict'

module.exports = errWithCauseSerializer

const { isErrorLike } = require('./err-helpers')
const { pinoErrProto } = require('./err-proto')

const { toString } = Object.prototype

function errWithCauseSerializer (err) {
  return serializeError(err, new Set())
}

// `seen` holds the errors currently being serialized, so that circular
// references terminate. It is local to one serialization pass, and lives
// outside the error itself so that frozen, sealed, and otherwise
// non-extensible errors can be serialized.
function serializeError (err, seen) {
  if (!isErrorLike(err)) {
    return err
  }

  seen.add(err) // tag to prevent re-looking at this
  const _err = Object.create(pinoErrProto)
  _err.type = toString.call(err.constructor) === '[object Function]'
    ? err.constructor.name
    : err.name
  _err.message = err.message
  _err.stack = err.stack

  if (Array.isArray(err.errors)) {
    _err.aggregateErrors = err.errors.map(err => serializeError(err, seen))
  }

  if (isErrorLike(err.cause) && !seen.has(err.cause)) {
    _err.cause = serializeError(err.cause, seen)
  }

  for (const key in err) {
    if (_err[key] === undefined) {
      const val = err[key]
      if (isErrorLike(val)) {
        if (!seen.has(val)) {
          _err[key] = serializeError(val, seen)
        }
      } else {
        _err[key] = val
      }
    }
  }

  seen.delete(err) // clean up tag in case err is serialized again later
  _err.raw = err
  return _err
}
