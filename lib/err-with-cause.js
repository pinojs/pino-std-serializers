'use strict'

module.exports = errWithCauseSerializer

const { isErrorLike, getErrorCause } = require('./err-helpers')
const { pinoErrProto, pinoErrorSymbols } = require('./err-proto')
const { seen } = pinoErrorSymbols

const { toString } = Object.prototype

const skippedOwnProps = new Set([
  'constructor',
  'cause', // Serialised on demand as `cause` property set via constructor is non-enumerable.
])

function errWithCauseSerializer (err) {
  if (!isErrorLike(err)) {
    return err
  }

  err[seen] = undefined // tag to prevent re-looking at this
  const _err = Object.create(pinoErrProto)
  _err.type = toString.call(err.constructor) === '[object Function]'
    ? err.constructor.name
    : err.name
  _err.message = err.message
  _err.stack = err.stack

  if (Array.isArray(err.errors)) {
    _err.aggregateErrors = err.errors.map(err => errWithCauseSerializer(err))
  }

  for (const key in err) {
    const val = err[key]
    if (val === undefined || val === null || Object.prototype.hasOwnProperty.call(val, seen) || skippedOwnProps.has(key)) {
      continue
    }
    _err[key] = errWithCauseSerializer(val)
  }

  const cause = getErrorCause(err)
  if (cause !== undefined || Object.prototype.hasOwnProperty.call(err, seen)) {
    _err.cause = errWithCauseSerializer(cause)
  }

  delete err[seen] // clean up tag in case err is serialized again later
  _err.raw = err
  return _err
}
