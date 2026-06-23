type RequestLogContext = {
  body?: unknown
  headers?: HeadersInit
}

const maskBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader) {
    return null
  }

  const tokenMatch = authorizationHeader.match(/^Bearer\s+(.+)$/i)
  const token = tokenMatch?.[1] ?? authorizationHeader

  return {
    hasAuthHeader: true,
    scheme: tokenMatch ? 'Bearer' : 'custom',
    tokenLength: token.length,
    tokenPreview: token.length <= 10 ? token : `${token.slice(0, 6)}...${token.slice(-4)}`,
  }
}

const normalizeHeaders = (headers?: HeadersInit) => {
  if (!headers) {
    return {}
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries())
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers)
  }

  return { ...headers }
}

export const logBackendRequest = (method: string, url: string, context: RequestLogContext = {}) => {
  const normalizedHeaders = normalizeHeaders(context.headers)
  const authorizationHeader =
    typeof normalizedHeaders.Authorization === 'string'
      ? normalizedHeaders.Authorization
      : typeof normalizedHeaders.authorization === 'string'
        ? normalizedHeaders.authorization
        : undefined

  console.log('[backend:req]', {
    method,
    url,
    body: context.body ?? null,
    auth: maskBearerToken(authorizationHeader) ?? { hasAuthHeader: false },
    headers: {
      ...normalizedHeaders,
      Authorization: authorizationHeader ? '[redacted]' : undefined,
      authorization: undefined,
    },
  })
}

export const logBackendResponse = (method: string, url: string, response: Response) => {
  console.log('[backend:res]', {
    method,
    url,
    ok: response.ok,
    status: response.status,
  })
}
