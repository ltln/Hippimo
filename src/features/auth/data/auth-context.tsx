import type { PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useRootNavigationState, useRouter, useSegments } from 'expo-router'

import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
} from '@/features/auth/data/auth-session-storage'
import {
  logoutBackendSession,
  refreshBackendToken,
  sendEmailLoginToBackend,
  sendGoogleTokenToBackend,
} from '@/features/auth/data/google-auth-api'
import {
  setAuthSessionInvalidatedHandler,
  setAuthSessionManagerSession,
} from '@/features/auth/data/auth-session-manager'
import type { GoogleLoginResponse, LoginState } from '@/features/auth/domain/google-auth.types'
import { useGoogleOAuth } from '@/features/auth/presentation/hooks/use-google-oauth'
import { getRefreshToken } from '@/features/auth/utils/auth-tokens'
import { getDeviceId } from '@/features/auth/utils/device-id'
import { decodeJwtPayload } from '@/features/auth/utils/jwt'

type AuthContextValue = {
  authResponse: GoogleLoginResponse | null
  googleOAuth: ReturnType<typeof useGoogleOAuth>
  loginState: LoginState
  message: string
  isAuthenticated: boolean
  signInWithEmail: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [authResponse, setAuthResponse] = useState<GoogleLoginResponse | null>(null)
  const [loginState, setLoginState] = useState<LoginState>('restoring')
  const [message, setMessage] = useState('Restoring login session...')
  const googleOAuth = useGoogleOAuth()

  useEffect(() => {
    setAuthSessionManagerSession(authResponse)
  }, [authResponse])

  useEffect(() => {
    setAuthSessionInvalidatedHandler(() => {
      setAuthResponse(null)
      setLoginState('idle')
      setMessage('Session expired. Please sign in again.')
    })

    return () => {
      setAuthSessionInvalidatedHandler(null)
    }
  }, [])

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
        setAuthResponse(null)
        setLoginState('idle')
        setMessage('')
      }
    }

    restoreAuthSession()

    return () => {
      isMounted = false
    }
  }, [])

  const signInWithEmail = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLocaleLowerCase()

    if (!normalizedEmail) {
      setLoginState('error')
      setMessage('Please enter your email.')
      return
    }

    try {
      setLoginState('loading')
      setMessage('')
      setAuthResponse(null)

      const loginResponse = await sendEmailLoginToBackend({ email: normalizedEmail })

      await saveAuthSession(loginResponse)

      setAuthResponse(loginResponse)
      setLoginState('success')
      setMessage(loginResponse.message)
    } catch (error) {
      setLoginState('error')
      console.error('Email login failed', error)
      setMessage(error instanceof Error ? error.message : 'Could not login with email.')
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const deviceId = getDeviceId()

    try {
      setLoginState('loading')
      setMessage('')
      setAuthResponse(null)

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

      const idTokenPayload = decodeJwtPayload(authResult.idToken)
      console.log('Google id_token payload', {
        audience: idTokenPayload?.aud,
        issuer: idTokenPayload?.iss,
        providerClientId: googleOAuth.platformClientId,
        subject: idTokenPayload?.sub,
      })

      const loginResponse = await sendGoogleTokenToBackend({
        deviceId,
        idToken: authResult.idToken,
      })

      await saveAuthSession(loginResponse)

      setAuthResponse(loginResponse)
      setLoginState('success')
      setMessage(loginResponse.message)
    } catch (error) {
      setLoginState('error')
      console.error('Google login failed', error)
      setMessage(error instanceof Error ? error.message : 'Could not login with Google.')
    }
  }, [googleOAuth])

  const signOut = useCallback(async () => {
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
  }, [authResponse?.tokens])

  const value = useMemo(
    () => ({
      authResponse,
      googleOAuth,
      isAuthenticated: Boolean(authResponse),
      loginState,
      message,
      signInWithEmail,
      signInWithGoogle,
      signOut,
    }),
    [authResponse, googleOAuth, loginState, message, signInWithEmail, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthGate({ children }: PropsWithChildren) {
  const { isAuthenticated, loginState } = useAuth()
  const rootNavigationState = useRootNavigationState()
  const router = useRouter()
  const segments = useSegments()
  const rootSegment = segments[0]

  useEffect(() => {
    if (!rootNavigationState?.key || loginState === 'restoring') {
      return
    }

    const isPublicRoute = rootSegment === 'login' || rootSegment === 'oauthredirect'

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login')
      return
    }

    if (isAuthenticated && rootSegment === 'login') {
      router.replace('/(tabs)')
    }
  }, [isAuthenticated, loginState, rootNavigationState?.key, rootSegment, router])

  if (loginState === 'restoring' && rootSegment !== 'login') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color='#12392C' />
      </View>
    )
  }

  return <>{children}</>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FBF5',
  },
})
