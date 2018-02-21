'use strict'

module.exports = {
  mapHttpResponse,
  resSerializer
}

var rawSymbol = Symbol('pino-raw-res-ref')
var pinoResProto = Object.create({}, {
  statusCode: {
    enumerable: true,
    writable: true,
    value: 0
  },
  header: {
    enumerable: true,
    writable: true,
    value: ''
  },
  raw: {
    enumerable: false,
    get: function () {
      return this[rawSymbol]
    },
    set: function (val) {
      this[rawSymbol] = val
    }
  }
})
Object.defineProperty(pinoResProto, rawSymbol, {
  writable: true,
  value: {}
})

function resSerializer (res) {
  const _res = Object.create(pinoResProto)
  _res.statusCode = res.statusCode
  _res.header = res._header
  _res.raw = res
  return _res
}

function mapHttpResponse (res) {
  return {
    res: resSerializer(res)
  }
}
