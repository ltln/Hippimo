import type {
  EmailLoginDto,
  GoogleLoginResponse,
  GoogleMobileLoginDto,
  LogoutResponse,
  RefreshTokenDto,
  RefreshTokenResponse,
} from '@/features/auth/domain/google-auth.types'
import { getAuthTokens } from '@/features/auth/utils/auth-tokens'
import { formatValue } from '@/features/auth/utils/format-value'
import { logBackendRequest, logBackendResponse } from '@/shared/utils/http-debug'

export const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
export const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
export const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
export const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.example.com'

const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, '')

export const googleLoginEndpoint = `${normalizedApiBaseUrl}/auth/google/login`
export const emailLoginEndpoint = `${normalizedApiBaseUrl}/auth/email/login`
export const refreshTokenEndpoint = `${normalizedApiBaseUrl}/auth/refresh-token`
export const logoutEndpoint = `${normalizedApiBaseUrl}/auth/logout`

class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

const parseResponseBody = (responseText: string) => {
  if (!responseText) {
    return null
  }

  try {
    return JSON.parse(responseText) as unknown
  } catch {
    return responseText
  }
}

const getErrorMessage = (responseBody: unknown, responseText: string) => {
  if (responseBody && typeof responseBody === 'object' && 'message' in responseBody) {
    return formatValue((responseBody as { message?: unknown }).message)
  }

  return responseText
}

const readResponseBody = async (response: Response) => {
  const responseText = await response.text()
  const responseBody = parseResponseBody(responseText)

  if (!response.ok) {
    throw new AuthApiError(
      getErrorMessage(responseBody, responseText) || `Backend returned HTTP ${response.status}`,
      response.status,
    )
  }

  return responseBody
}

const validateLoginResponse = (responseBody: unknown, providerLabel: string) => {
  if (!responseBody || typeof responseBody !== 'object' || !('tokens' in responseBody)) {
    throw new Error(`Backend did not return a valid ${providerLabel} login response.`)
  }

  const loginResponse = responseBody as Partial<GoogleLoginResponse>
  const tokens = getAuthTokens(loginResponse.tokens)

  if (!tokens) {
    throw new Error('Backend did not return valid accessToken/refreshToken values.')
  }

  return {
    ...loginResponse,
    message:
      typeof loginResponse.message === 'string' && loginResponse.message
        ? loginResponse.message
        : 'Login successful',
    tokens,
    user: loginResponse.user ?? null,
  } satisfies GoogleLoginResponse
}

export const sendEmailLoginToBackend = async (payload: EmailLoginDto) => {
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }

  logBackendRequest('POST', emailLoginEndpoint, {
    body: payload,
    headers: requestInit.headers,
  })

  const response = await fetch(emailLoginEndpoint, requestInit)

  logBackendResponse('POST', emailLoginEndpoint, response)

  return validateLoginResponse(await readResponseBody(response), 'email')
}

export const sendGoogleTokenToBackend = async (payload: GoogleMobileLoginDto) => {
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }

  logBackendRequest('POST', googleLoginEndpoint, {
    body: {
      ...payload,
      idToken: payload.idToken ? '[redacted]' : '',
    },
    headers: requestInit.headers,
  })

  const response = await fetch(googleLoginEndpoint, requestInit)

  logBackendResponse('POST', googleLoginEndpoint, response)

  return validateLoginResponse(await readResponseBody(response), 'Google')
}

export const refreshBackendToken = async (payload: RefreshTokenDto) => {
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }

  logBackendRequest('POST', refreshTokenEndpoint, {
    body: {
      refreshToken: payload.refreshToken ? '[redacted]' : '',
    },
    headers: requestInit.headers,
  })

  const response = await fetch(refreshTokenEndpoint, requestInit)

  logBackendResponse('POST', refreshTokenEndpoint, response)

  const responseBody = await readResponseBody(response)

  if (!responseBody || typeof responseBody !== 'object' || !('tokens' in responseBody)) {
    throw new Error('Backend did not return a valid refresh token response.')
  }

  const refreshResponse = responseBody as RefreshTokenResponse

  if (!getAuthTokens(refreshResponse.tokens)) {
    throw new Error('Backend did not return valid accessToken/refreshToken values.')
  }

  return refreshResponse
}

export const logoutBackendSession = async (payload: RefreshTokenDto) => {
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }

  logBackendRequest('POST', logoutEndpoint, {
    body: {
      refreshToken: payload.refreshToken ? '[redacted]' : '',
    },
    headers: requestInit.headers,
  })

  const response = await fetch(logoutEndpoint, requestInit)

  logBackendResponse('POST', logoutEndpoint, response)

  const responseBody = await readResponseBody(response)

  if (!responseBody || typeof responseBody !== 'object') {
    return { message: 'Logout successful' } satisfies LogoutResponse
  }

  return responseBody as LogoutResponse
}
