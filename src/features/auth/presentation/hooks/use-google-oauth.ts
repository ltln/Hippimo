import { useCallback, useMemo } from 'react'
import { Platform } from 'react-native'

import {
  googleAndroidClientId,
  googleIosClientId,
  googleWebClientId,
} from '@/features/auth/data/google-auth-api'

const googleScopes = ['openid', 'profile', 'email']
const androidPackageName = 'work.hippi.hippimo'

const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
}

type GoogleOAuthResult =
  | {
      type: 'success'
      idToken: string
      redirectUri: string
    }
  | {
      type: 'cancel' | 'dismiss' | 'opened' | 'locked'
    }

type GoogleOAuthStatus = {
  isReady: boolean
  platformClientId: string
  redirectUri: string
  signIn: () => Promise<GoogleOAuthResult>
}

const getPlatformGoogleClientId = () => {
  if (Platform.OS === 'android') {
    return googleAndroidClientId ?? ''
  }

  if (Platform.OS === 'ios') {
    return googleIosClientId ?? ''
  }

  return googleWebClientId ?? ''
}

const getNativeModuleErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('ExpoCrypto') || message.includes('expo-crypto')) {
    return 'ExpoCrypto is missing from this dev client. Rebuild and reinstall the Expo Dev Client so Google OAuth can use PKCE.'
  }

  return message
}

const getMissingClientIdMessage = () => {
  if (Platform.OS === 'android') {
    return 'Missing EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in environment config.'
  }

  if (Platform.OS === 'ios') {
    return 'Missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in environment config.'
  }

  return 'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in environment config.'
}

const getRedirectUri = (AuthSession: typeof import('expo-auth-session')) => {
  if (Platform.OS === 'android') {
    return AuthSession.makeRedirectUri({
      native: `${androidPackageName}:/oauthredirect`,
    })
  }

  return AuthSession.makeRedirectUri({
    path: 'oauthredirect',
    scheme: 'hippimo',
  })
}

export function useGoogleOAuth() {
  const platformClientId = useMemo(getPlatformGoogleClientId, [])
  const missingClientIdMessage = useMemo(getMissingClientIdMessage, [])
  const nativeRedirectUri = useMemo(() => {
    if (Platform.OS === 'android') {
      return `${androidPackageName}:/oauthredirect`
    }

    return 'hippimo://oauthredirect'
  }, [])

  const exchangeCodeForIdToken = useCallback(
    async (
      AuthSession: typeof import('expo-auth-session'),
      code: string,
      codeVerifier: string,
      redirectUri: string,
    ) => {
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: platformClientId,
          code,
          extraParams: {
            code_verifier: codeVerifier,
          },
          redirectUri,
          scopes: googleScopes,
        },
        googleDiscovery,
      )

      if (!tokenResponse.idToken) {
        throw new Error('Google token exchange did not return an id_token.')
      }

      return tokenResponse.idToken
    },
    [platformClientId],
  )

  const signIn = useCallback(async (): Promise<GoogleOAuthResult> => {
    if (!platformClientId) {
      throw new Error(missingClientIdMessage)
    }

    try {
      const AuthSession = await import('expo-auth-session')
      const redirectUri = getRedirectUri(AuthSession)
      const request = new AuthSession.AuthRequest({
        clientId: platformClientId,
        prompt: AuthSession.Prompt.SelectAccount,
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        scopes: googleScopes,
      })

      const result = await request.promptAsync(googleDiscovery)

      if (
        result.type === 'cancel' ||
        result.type === 'dismiss' ||
        result.type === 'locked' ||
        result.type === 'opened'
      ) {
        return { type: result.type }
      }

      if (result.type === 'error') {
        throw new Error(result.error?.message ?? 'Google OAuth failed.')
      }

      if (result.type !== 'success') {
        throw new Error(`Google OAuth returned unexpected result: ${result.type}`)
      }

      const idToken = result.params.id_token || result.authentication?.idToken

      if (!idToken && !result.params.code) {
        throw new Error('Google did not return an id_token or authorization code.')
      }

      return {
        type: 'success',
        idToken:
          idToken ||
          (await exchangeCodeForIdToken(
            AuthSession,
            result.params.code,
            request.codeVerifier ?? '',
            redirectUri,
          )),
        redirectUri,
      }
    } catch (error) {
      throw new Error(getNativeModuleErrorMessage(error))
    }
  }, [exchangeCodeForIdToken, missingClientIdMessage, platformClientId])

  return {
    isReady: Boolean(platformClientId),
    platformClientId,
    redirectUri: nativeRedirectUri,
    signIn,
  } satisfies GoogleOAuthStatus
}
