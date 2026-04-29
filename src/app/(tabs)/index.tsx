import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

import {
  apiBaseUrl,
  googleLoginEndpoint,
  logoutBackendSession,
  refreshBackendToken,
  sendGoogleTokenToBackend,
} from '@/features/auth/data/google-auth-api'
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
} from '@/features/auth/data/auth-session-storage'
import type { GoogleLoginResponse, LoginState } from '@/features/auth/domain/google-auth.types'
import { AuthHome } from '@/features/auth/presentation/components/auth-home'
import { LoginForm } from '@/features/auth/presentation/components/login-form'
import { useGoogleOAuth } from '@/features/auth/presentation/hooks/use-google-oauth'
import { getRefreshToken } from '@/features/auth/utils/auth-tokens'
import { getDeviceId } from '@/features/auth/utils/device-id'

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const [authResponse, setAuthResponse] = useState<GoogleLoginResponse | null>(null)
  const [loginState, setLoginState] = useState<LoginState>('idle')
  const [message, setMessage] = useState('')
  const googleOAuth = useGoogleOAuth()

  useEffect(() => {
    let isMounted = true

    const restoreAuthSession = async () => {
      setLoginState('restoring')
      setMessage('Restoring login session...')

      try {
        const storedAuthResponse = await loadAuthSession()

        if (!isMounted) {
          return
        }

        if (storedAuthResponse) {
          const refreshToken = getRefreshToken(storedAuthResponse.tokens)

          if (!refreshToken) {
            throw new Error('Stored auth session is missing a refresh token.')
          }

          const refreshResponse = await refreshBackendToken({ refreshToken })
          const refreshedAuthResponse: GoogleLoginResponse = {
            ...storedAuthResponse,
            message: refreshResponse.message,
            tokens: refreshResponse.tokens,
            user: refreshResponse.user,
          }

          await saveAuthSession(refreshedAuthResponse)

          if (!isMounted) {
            return
          }

          setAuthResponse(refreshedAuthResponse)
          setLoginState('success')
          setMessage(refreshResponse.message)
          return
        }
      } catch (error) {
        console.error('Restore login failed', error)

        try {
          await clearAuthSession()
        } catch (clearError) {
          console.error('Clear stored auth session failed', clearError)
        }
      }

      if (isMounted) {
        setLoginState('idle')
        setMessage('')
      }
    }

    restoreAuthSession()

    return () => {
      isMounted = false
    }
  }, [])

  const handleGoogleLogin = async () => {
    const deviceId = getDeviceId()

    try {
      setLoginState('loading')
      setMessage('')
      setAuthResponse(null)
      console.log('Google login config', {
        apiBaseUrl,
        deviceId,
        endpoint: googleLoginEndpoint,
        platform: Platform.OS,
        providerClientId: googleOAuth.platformClientId,
        redirectUri: googleOAuth.redirectUri,
      })

      const authResult = await googleOAuth.signIn()

      if (authResult.type === 'cancel' || authResult.type === 'dismiss') {
        setLoginState('idle')
        setMessage('Google login was cancelled.')
        return
      }

      if (authResult.type === 'locked' || authResult.type === 'opened') {
        setLoginState('idle')
        setMessage('Google login is already in progress.')
        return
      }

      if (authResult.type !== 'success') {
        throw new Error(`Google OAuth returned unexpected result: ${authResult.type}`)
      }

      const loginResponse = await sendGoogleTokenToBackend({
        deviceId,
        idToken: authResult.idToken,
      })

      try {
        await saveAuthSession(loginResponse)
      } catch (error) {
        console.error('Persist login failed', error)
      }

      setAuthResponse(loginResponse)
      setLoginState('success')
      setMessage(loginResponse.message)
    } catch (error) {
      setLoginState('error')
      console.error('Google login failed', error)
      setMessage(error instanceof Error ? error.message : 'Could not login with Google.')
    }
  }

  const handleSignOut = async () => {
    const refreshToken = getRefreshToken(authResponse?.tokens)

    setAuthResponse(null)
    setLoginState('idle')
    setMessage('')

    if (refreshToken) {
      try {
        await logoutBackendSession({ refreshToken })
      } catch (error) {
        console.error('Backend logout failed', error)
      }
    }

    try {
      await clearAuthSession()
    } catch (error) {
      console.error('Clear stored auth session failed', error)
    }
  }

  if (loginState === 'success' && authResponse) {
    return <AuthHome authResponse={authResponse} onSignOut={handleSignOut} />
  }

  return (
    <LoginForm
      isGoogleLoginAvailable={googleOAuth.isReady}
      loginState={loginState}
      message={message}
      onGoogleLogin={handleGoogleLogin}
    />
  )
}
