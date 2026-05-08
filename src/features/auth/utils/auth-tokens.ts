import type { AuthTokens } from '@/features/auth/domain/google-auth.types'

export function getAuthTokens(value: unknown): AuthTokens | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<Record<keyof AuthTokens, unknown>>

  if (typeof candidate.accessToken !== 'string' || typeof candidate.refreshToken !== 'string') {
    return null
  }

  return {
    accessToken: candidate.accessToken,
    refreshToken: candidate.refreshToken,
    tokenType: typeof candidate.tokenType === 'string' ? candidate.tokenType : 'Bearer',
  }
}

export function getRefreshToken(value: unknown) {
  return getAuthTokens(value)?.refreshToken ?? null
}
