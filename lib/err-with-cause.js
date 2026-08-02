'use strict'

module.exports = errWithCauseSerializer

const { isErrorLike } = require('./err-helpers')
const { pinoErrProto, seenErrors } = require('./err-proto')

const { toString } = Object.prototype

function errWithCauseSerializer (err) {
  if (!isErrorLike(err)) {
    return err
  }

  seenErrors.add(err) // tag to prevent re-looking at this
  const _err = Object.create(pinoErrProto)
  _err.type = toString.call(err.constructor) === '[object Function]'
    ? err.constructor.name
    : err.name
  _err.message = err.message
  _err.stack = err.stack

  if (Array.isArray(err.errors)) {
    _err.aggregateErrors = err.errors.map(err => errWithCauseSerializer(err))
  }

  if (isErrorLike(err.cause) && !seenErrors.has(err.cause)) {
    _err.cause = errWithCauseSerializer(err.cause)
  }

  for (const key in err) {
    if (_err[key] === undefined) {
      const val = err[key]
      if (isErrorLike(val)) {
        if (!seenErrors.has(val)) {
          _err[key] = errWithCauseSerializer(val)
        }
      } else {
        _err[key] = val
      }
    }
  }

  seenErrors.delete(err) // clean up tag in case err is serialized again later
  _err.raw = err
  return _err
}
