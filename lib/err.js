'use strict'

module.exports = errSerializer

var seen = Symbol('circular-ref-tag')

function errSerializer (err) {
  if (!(err instanceof Error)) {
    return err
  }

  err[seen] = undefined // tag to prevent re-looking at this

  var obj = {
    type: err.constructor.name,
    message: err.message,
    stack: err.stack
  }
  for (var key in err) {
    if (obj[key] === undefined) {
      var val = err[key]
      if (val instanceof Error) {
        if (!val.hasOwnProperty(seen)) {
          obj[key] = errSerializer(val)
        }
      } else {
        obj[key] = val
      }
    }
  }

  delete err[seen] // clean up tag in case err is serialized again later
  return obj
}
