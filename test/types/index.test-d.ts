import { IncomingMessage, ServerResponse } from 'http'
import {
  err,
  errWithCause,
  req,
  res,
  nodeReq,
  nodeRes,
  whatwgReq,
  whatwgRes,
  SerializedError,
  SerializedRequest,
  wrapErrorSerializer,
  wrapRequestSerializer,
  wrapResponseSerializer,
  SerializedResponse
} from '../../'

const customErrorSerializer = (error: SerializedError) => {
  return {
    myOwnError: {
      data: `${error.type}-${error.message}\n\n${error.stack}`,
    }
  };
};

const customRequestSerializer = (req: SerializedRequest) => {
  const {
    headers,
    id,
    method,
    raw,
    remoteAddress,
    remotePort,
    url,
    query,
    params,
  } = req;
  return {
    myOwnRequest: {
      data: `${method}-${id}-${remoteAddress}-${remotePort}-${url}`,
      headers,
      raw,
    }
  };
};

const customResponseSerializer = (res: SerializedResponse) => {
  const {headers, raw, statusCode} = res;
  return {
    myOwnResponse: {
      data: statusCode,
      headers,
      raw,
    }
  };
};

const fakeError = new Error('A fake error for testing');
const serializedError: SerializedError = err(fakeError);
const mySerializer = wrapErrorSerializer(customErrorSerializer);

const fakeErrorWithCause = new Error('A fake error for testing with cause', { cause: new Error('An inner fake error') });
const serializedErrorWithCause: SerializedError = errWithCause(fakeError);

const request: IncomingMessage = {} as IncomingMessage
const serializedRequest: SerializedRequest = req(request);
const myReqSerializer = wrapRequestSerializer(customRequestSerializer);

const response: ServerResponse = {} as ServerResponse
const myResSerializer = wrapResponseSerializer(customResponseSerializer);
const serializedResponse = res(response);

myResSerializer(response)

// WHATWG Fetch API support via generic serializers
const whatwgRequest = new Request('http://localhost/test', { method: 'POST' })
req(whatwgRequest) satisfies SerializedRequest
myReqSerializer(whatwgRequest)

const whatwgResponse = new Response('OK', { status: 200 })
res(whatwgResponse) satisfies SerializedResponse
myResSerializer(whatwgResponse)

// Node.js specific serializers
nodeReq(request) satisfies SerializedRequest
nodeRes(response) satisfies SerializedResponse

// WHATWG specific serializers
whatwgReq(whatwgRequest) satisfies SerializedRequest
whatwgRes(whatwgResponse) satisfies SerializedResponse

// Test for pinojs/pino#2368 - accessing headers on raw ServerResponse
// When using wrapResponseSerializer, res.raw.headers should be accessible
// with proper type narrowing for ServerResponse vs WHATWG Response
const responseHeadersSerializer = wrapResponseSerializer((res) => {
  if ('statusCode' in res.raw) {
    // Node.js ServerResponse
    return {
      statusCode: res.raw.statusCode,
      headers: {
        'content-type': res.raw.headers?.['content-type'],
        'content-length': res.raw.headers?.['content-length'],
      },
    };
  }
  // WHATWG Response
  return {
    status: res.raw.status,
  };
});

// Also verify that serialized response headers are accessible directly
// without narrowing (they are always available on the serialized object)
const responseSerializer2 = wrapResponseSerializer((res) => {
  return {
    statusCode: res.statusCode,
    headers: {
      'content-type': res.headers['content-type'],
      'content-length': res.headers['content-length'],
    },
  };
});
