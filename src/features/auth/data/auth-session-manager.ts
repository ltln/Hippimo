import type { GoogleLoginResponse } from '@/features/auth/domain/google-auth.types'
import { clearAuthSession, saveAuthSession } from '@/features/auth/data/auth-session-storage'
import { refreshBackendToken } from '@/features/auth/data/google-auth-api'
import { getRefreshToken } from '@/features/auth/utils/auth-tokens'
import { decodeJwtPayload } from '@/features/auth/utils/jwt'

let currentAuthSession: GoogleLoginResponse | null = null
let refreshInFlight: Promise<GoogleLoginResponse | null> | null = null
let onSessionInvalidated: (() => void) | null = null

export function setAuthSessionManagerSession(session: GoogleLoginResponse | null) {
  currentAuthSession = session
}

export function setAuthSessionInvalidatedHandler(handler: (() => void) | null) {
  onSessionInvalidated = handler
}

export function getCurrentAccessToken() {
  return currentAuthSession?.tokens.accessToken ?? null
}

function isAccessTokenExpiringSoon(accessToken: string, leewaySeconds = 60) {
  const payload = decodeJwtPayload(accessToken)
  const exp = payload?.exp

  if (typeof exp !== 'number') {
    return false
  }

  return exp * 1000 <= Date.now() + leewaySeconds * 1000
}

export async function getFreshAccessToken() {
  const accessToken = getCurrentAccessToken()

  if (!accessToken) {
    return null
  }

  if (!isAccessTokenExpiringSoon(accessToken)) {
    return accessToken
  }

  const refreshedSession = await refreshAuthSession()
  return refreshedSession?.tokens.accessToken ?? null
}

async function invalidateSession() {
  currentAuthSession = null

  try {
    await clearAuthSession()
  } catch (error) {
    console.error('Clear auth session after refresh failure failed', error)
  }

  onSessionInvalidated?.()
}

export async function refreshAuthSession() {
  if (refreshInFlight) {
    return refreshInFlight
  }

  refreshInFlight = (async () => {
    const session = currentAuthSession
    const refreshToken = getRefreshToken(session?.tokens)

    if (!session || !refreshToken) {
      await invalidateSession()
      return null
    }

    try {
      const refreshResponse = await refreshBackendToken({ refreshToken })
      const refreshedSession: GoogleLoginResponse = {
        ...session,
        message: refreshResponse.message,
        tokens: refreshResponse.tokens,
        user: refreshResponse.user,
      }

      currentAuthSession = refreshedSession
      await saveAuthSession(refreshedSession)
      return refreshedSession
    } catch (error) {
      console.error('Refresh auth session failed', error)
      await invalidateSession()
      return null
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}
