'use strict'

module.exports = {
  mapHttpResponse,
  resSerializer
}

const fastRedact = require('fast-redact')

const headerRedact = fastRedact({
  paths: [
    'location',
    '["x-real-ip"]',
    '["x-forwarded-for"]'
  ]
})

const rawSymbol = Symbol('pino-raw-res-ref')
const pinoResProto = Object.create({}, {
  statusCode: {
    enumerable: true,
    writable: true,
    value: 0
  },
  headers: {
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
  _res.statusCode = res.headersSent ? res.statusCode : null

  const _headers = res.getHeaders ? res.getHeaders() : res._headers
  _res.headers = _headers && typeof _headers === 'object' ? headerRedact(_headers) : _headers

  _res.raw = res
  return _res
}

function mapHttpResponse (res) {
  return {
    res: resSerializer(res)
  }
}
