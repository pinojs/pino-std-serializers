'use strict'

module.exports = {
  mapHttpRequest,
  reqSerializer
}

var rawSymbol = Symbol('pino-raw-req-ref')
var pinoReqProto = Object.create({}, {
  id: {
    enumerable: true,
    writable: true,
    value: ''
  },
  method: {
    enumerable: true,
    writable: true,
    value: ''
  },
  url: {
    enumerable: true,
    writable: true,
    value: ''
  },
  headers: {
    enumerable: true,
    writable: true,
    value: {}
  },
  remoteAddress: {
    enumerable: true,
    writable: true,
    value: ''
  },
  remotePort: {
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
Object.defineProperty(pinoReqProto, rawSymbol, {
  writable: true,
  value: {}
})

function reqSerializer (req) {
  var connection = req.connection
  const _req = Object.create(pinoReqProto)
  _req.id = (typeof req.id === 'function' ? req.id() : (req.id || (req.info && req.info.id))) || ''
  _req.method = req.method
  _req.url = req.url.path || req.url
  _req.headers = req.headers
  _req.remoteAddress = connection && connection.remoteAddress
  _req.remotePort = connection && connection.remotePort
  _req.raw = req.raw || req
  return _req
}

function mapHttpRequest (req) {
  return {
    req: reqSerializer(req)
  }
}
