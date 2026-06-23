import {
  getCurrentAccessToken,
  getFreshAccessToken,
  refreshAuthSession,
} from '@/features/auth/data/auth-session-manager'

function getAccessTokenFromHeaders(headers: HeadersInit | undefined) {
  if (!headers) {
    return null
  }

  const normalizedHeaders = new Headers(headers)
  const authorizationHeader = normalizedHeaders.get('Authorization')

  if (!authorizationHeader) {
    return null
  }

  const tokenMatch = authorizationHeader.match(/^Bearer\s+(.+)$/i)
  return tokenMatch?.[1] ?? authorizationHeader
}

function buildAuthorizedHeaders(headers: HeadersInit | undefined, accessToken: string) {
  const normalizedHeaders = new Headers(headers)
  normalizedHeaders.set('Authorization', `Bearer ${accessToken}`)
  return normalizedHeaders
}

export async function fetchWithAuthRetry(input: RequestInfo | URL, init: RequestInit = {}) {
  const headerToken = getAccessTokenFromHeaders(init.headers)
  const accessToken = headerToken
    ? ((await getFreshAccessToken()) ?? headerToken)
    : getCurrentAccessToken()

  if (!accessToken) {
    throw new Error('Authentication required.')
  }

  const execute = async (token: string, attempt: 'initial' | 'retry') => {
    const startedAt = Date.now()
    const response = await fetch(input, {
      ...init,
      headers: buildAuthorizedHeaders(init.headers, token),
    })

    console.log('[AuthenticatedFetchTiming]', {
      attempt,
      durationMs: Date.now() - startedAt,
      status: response.status,
      method: init.method ?? 'GET',
    })

    return response
  }

  let response = await execute(accessToken, 'initial')

  if (response.status !== 401) {
    return response
  }

  const refreshedSession = await refreshAuthSession()

  if (!refreshedSession?.tokens.accessToken) {
    return response
  }

  response = await execute(refreshedSession.tokens.accessToken, 'retry')
  return response
}
