import { requireOptionalNativeModule } from 'expo-modules-core'

import type { GoogleLoginResponse } from '@/features/auth/domain/google-auth.types'
import { getAuthTokens } from '@/features/auth/utils/auth-tokens'

const AUTH_SESSION_KEY = 'hippimo.auth.session.v1'

type SecureStoreModule = {
  deleteValueWithKeyAsync: (key: string, options: Record<string, never>) => Promise<void>
  getValueWithKeyAsync: (key: string, options: Record<string, never>) => Promise<string | null>
  setValueWithKeyAsync: (
    value: string,
    key: string,
    options: Record<string, never>,
  ) => Promise<void>
}

const memorySessionStore = new Map<string, string>()

let hasWarnedAboutMissingSecureStore = false

function getSecureStore() {
  const secureStore = requireOptionalNativeModule<SecureStoreModule>('ExpoSecureStore')

  if (secureStore?.getValueWithKeyAsync) {
    return secureStore
  }

  if (!hasWarnedAboutMissingSecureStore) {
    hasWarnedAboutMissingSecureStore = true
    console.warn(
      'Expo SecureStore native module is unavailable. Auth session persistence is disabled until the dev client is rebuilt.',
    )
  }

  return null
}

async function setSessionValue(value: string) {
  const secureStore = getSecureStore()

  if (secureStore) {
    await secureStore.setValueWithKeyAsync(value, AUTH_SESSION_KEY, {})
    return
  }

  memorySessionStore.set(AUTH_SESSION_KEY, value)
}

async function getSessionValue() {
  const secureStore = getSecureStore()

  if (secureStore) {
    return secureStore.getValueWithKeyAsync(AUTH_SESSION_KEY, {})
  }

  return memorySessionStore.get(AUTH_SESSION_KEY) ?? null
}

async function deleteSessionValue() {
  const secureStore = getSecureStore()

  if (secureStore) {
    await secureStore.deleteValueWithKeyAsync(AUTH_SESSION_KEY, {})
    return
  }

  memorySessionStore.delete(AUTH_SESSION_KEY)
}

function isGoogleLoginResponse(value: unknown): value is GoogleLoginResponse {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<GoogleLoginResponse>

  return (
    typeof candidate.message === 'string' &&
    Boolean(getAuthTokens(candidate.tokens)) &&
    typeof candidate.google === 'object' &&
    candidate.google !== null
  )
}

export async function saveAuthSession(authResponse: GoogleLoginResponse) {
  await setSessionValue(JSON.stringify(authResponse))
}

export async function loadAuthSession() {
  const storedSession = await getSessionValue()

  if (!storedSession) {
    return null
  }

  try {
    const parsedSession: unknown = JSON.parse(storedSession)

    if (isGoogleLoginResponse(parsedSession)) {
      return parsedSession
    }
  } catch (error) {
    console.error('Failed to parse stored auth session', error)
  }

  await clearAuthSession()
  return null
}

export async function clearAuthSession() {
  await deleteSessionValue()
}
