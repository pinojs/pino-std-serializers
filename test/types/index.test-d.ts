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

// Test for issue https://github.com/pinojs/pino/issues/2368
// The raw property should allow accessing headers which may exist at runtime
const responseWithHeadersSerializer: (res: SerializedResponse) => Record<string, unknown> = (res) => {
  // Only ServerResponse has statusCode property
  if ('statusCode' in res.raw) {
    const rawHeaders = (res.raw as ServerResponse & { headers?: Record<string, string | string[] | undefined> }).headers;
    if (rawHeaders) {
      return {
        statusCode: res.raw.statusCode,
        'content-type': rawHeaders['content-type'],
        'content-length': rawHeaders['content-length'],
      };
    }
    return { statusCode: res.raw.statusCode };
  }
  // Handle WHATWG Response
  return {
    status: (res.raw as Response).status,
  };
};

// Test with optional chaining
const responseWithOptionalChaining: (res: SerializedResponse) => Record<string, unknown> = (res) => {
  if ('statusCode' in res.raw) {
    return {
      statusCode: res.raw.statusCode,
      'content-type': (res.raw as ServerResponse & { headers?: Record<string, string | string[] | undefined> }).headers?.['content-type'],
    };
  }
  return {
    status: (res.raw as Response).status,
  };
};

