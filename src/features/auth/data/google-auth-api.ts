import type {
  GoogleLoginResponse,
  GoogleMobileLoginDto,
  LogoutResponse,
  RefreshTokenDto,
  RefreshTokenResponse,
} from '@/features/auth/domain/google-auth.types'
import { getAuthTokens } from '@/features/auth/utils/auth-tokens'
import { formatValue } from '@/features/auth/utils/format-value'

export const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
export const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
export const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
export const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.example.com'

const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, '')

export const googleLoginEndpoint = `${normalizedApiBaseUrl}/auth/google/login`
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

export const sendGoogleTokenToBackend = async (payload: GoogleMobileLoginDto) => {
  console.log('Sending Google login request', {
    deviceId: payload.deviceId,
    endpoint: googleLoginEndpoint,
    hasIdToken: Boolean(payload.idToken),
  })

  const response = await fetch(googleLoginEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  console.log('Google login backend response', {
    endpoint: googleLoginEndpoint,
    ok: response.ok,
    status: response.status,
  })

  const responseBody = await readResponseBody(response)

  if (!responseBody || typeof responseBody !== 'object' || !('google' in responseBody)) {
    throw new Error('Backend không trả về thông tin đăng nhập Google hợp lệ.')
  }

  const loginResponse = responseBody as GoogleLoginResponse

  if (!getAuthTokens(loginResponse.tokens)) {
    throw new Error('Backend không trả về accessToken/refreshToken hợp lệ.')
  }

  return loginResponse
}

export const refreshBackendToken = async (payload: RefreshTokenDto) => {
  console.log('Sending refresh token request', {
    endpoint: refreshTokenEndpoint,
    hasRefreshToken: Boolean(payload.refreshToken),
  })

  const response = await fetch(refreshTokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  console.log('Refresh token backend response', {
    endpoint: refreshTokenEndpoint,
    ok: response.ok,
    status: response.status,
  })

  const responseBody = await readResponseBody(response)

  if (!responseBody || typeof responseBody !== 'object' || !('tokens' in responseBody)) {
    throw new Error('Backend không trả về refresh token response hợp lệ.')
  }

  const refreshResponse = responseBody as RefreshTokenResponse

  if (!getAuthTokens(refreshResponse.tokens)) {
    throw new Error('Backend không trả về accessToken/refreshToken hợp lệ.')
  }

  return refreshResponse
}

export const logoutBackendSession = async (payload: RefreshTokenDto) => {
  console.log('Sending logout request', {
    endpoint: logoutEndpoint,
    hasRefreshToken: Boolean(payload.refreshToken),
  })

  const response = await fetch(logoutEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  console.log('Logout backend response', {
    endpoint: logoutEndpoint,
    ok: response.ok,
    status: response.status,
  })

  const responseBody = await readResponseBody(response)

  if (!responseBody || typeof responseBody !== 'object') {
    return { message: 'Logout successful' } satisfies LogoutResponse
  }

  return responseBody as LogoutResponse
}
