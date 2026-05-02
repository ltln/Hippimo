import * as WebBrowser from 'expo-web-browser'

import { useAuth } from '@/features/auth/data/auth-context'
import { LoginForm } from '@/features/auth/presentation/components/login-form'

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const { googleOAuth, loginState, message, signInWithEmail, signInWithGoogle } = useAuth()

  return (
    <LoginForm
      isGoogleLoginAvailable={googleOAuth.isReady}
      loginState={loginState}
      message={message}
      onEmailLogin={signInWithEmail}
      onGoogleLogin={signInWithGoogle}
    />
  )
}
