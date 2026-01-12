'use strict'

module.exports = {
  mapHttpResponse,
  resSerializer,
  nodeResSerializer,
  whatwgResSerializer
}

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

function isWhatwgResponse (res) {
  return typeof res.headers?.forEach === 'function' && typeof res.status === 'number'
}

function whatwgResSerializer (res) {
  const _res = Object.create(pinoResProto)
  _res.statusCode = res.status

  const headers = {}
  if (res.headers) {
    res.headers.forEach((value, key) => {
      headers[key] = value
    })
  }
  _res.headers = headers

  _res.raw = res
  return _res
}

function nodeResSerializer (res) {
  const _res = Object.create(pinoResProto)
  _res.statusCode = res.headersSent ? res.statusCode : null
  _res.headers = res.getHeaders ? res.getHeaders() : res._headers
  _res.raw = res
  return _res
}

function resSerializer (res) {
  if (isWhatwgResponse(res)) {
    return whatwgResSerializer(res)
  }
  return nodeResSerializer(res)
}

function mapHttpResponse (res) {
  return {
    res: resSerializer(res)
  }
}
