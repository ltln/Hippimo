export type LoginState = 'idle' | 'restoring' | 'loading' | 'success' | 'error'

export type GoogleProfile = {
  sub?: string | null
  email?: string | null
  name?: string | null
  picture?: string | null
}

export type AuthTokens = {
  tokenType?: string
  accessToken: string
  refreshToken: string
}

export type GoogleLoginResponse = {
  message: string
  user: unknown
  tokens: AuthTokens
  google: GoogleProfile
}

export type GoogleMobileLoginDto = {
  idToken: string
  deviceId: string
}

export type RefreshTokenDto = {
  refreshToken: string
}

export type RefreshTokenResponse = {
  message: string
  user: unknown
  tokens: AuthTokens
}

export type LogoutResponse = {
  message: string
}
