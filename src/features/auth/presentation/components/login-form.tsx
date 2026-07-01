import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { LoginState } from '@/features/auth/domain/google-auth.types'
import { colors, styles } from '@/features/auth/presentation/components/auth.styles'

type LoginFormProps = {
  loginState: LoginState
  message: string
  isGoogleLoginAvailable?: boolean
  onEmailLogin: (email: string) => void
  onGoogleLogin: () => void
}

export function LoginForm({
  loginState,
  message,
  isGoogleLoginAvailable = true,
  onEmailLogin,
  onGoogleLogin,
}: LoginFormProps) {
  const [email, setEmail] = useState('')
  const isLoginBusy = loginState === 'loading' || loginState === 'restoring'
  const isGoogleLoginDisabled = isLoginBusy || !isGoogleLoginAvailable

  const handleEmailLogin = () => {
    onEmailLogin(email)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>ĐĂNG NHẬP</Text>

          <View style={styles.emailField}>
            <Feather name='mail' size={20} color={colors.muted} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder='Email'
              placeholderTextColor={colors.placeholder}
              keyboardType='email-address'
              autoCapitalize='none'
              autoCorrect={false}
              style={styles.emailInput}
            />
          </View>

          <Pressable
            accessibilityRole='button'
            disabled={isLoginBusy}
            onPress={handleEmailLogin}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && !isLoginBusy && styles.pressed,
              isLoginBusy && styles.disabledButton,
            ]}
          >
            {isLoginBusy ? (
              <ActivityIndicator color='#FFFFFF' />
            ) : (
              <Text style={styles.primaryButtonText}>ĐĂNG NHẬP</Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            accessibilityRole='button'
            disabled={isGoogleLoginDisabled}
            onPress={onGoogleLogin}
            style={({ pressed }) => [
              styles.socialButton,
              pressed && !isGoogleLoginDisabled && styles.pressed,
              isGoogleLoginDisabled && styles.disabledButton,
            ]}
          >
            {isLoginBusy ? (
              <ActivityIndicator color={colors.green} />
            ) : (
              <MaterialCommunityIcons name='google' size={28} color='#4285F4' />
            )}
            <Text style={styles.socialButtonText}>Đăng nhập với Google</Text>
          </Pressable>

          {message ? (
            <Text
              style={[
                styles.message,
                loginState === 'error' ? styles.errorText : styles.successText,
              ]}
            >
              {message}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
