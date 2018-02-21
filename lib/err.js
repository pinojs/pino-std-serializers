'use strict'

module.exports = errSerializer

function errSerializer (err) {
  var obj = {
    type: err.constructor.name,
    message: err.message,
    stack: err.stack
  }
  for (var key in err) {
    if (obj[key] === undefined) {
      obj[key] = err[key]
    }
  }
  return obj
}
