import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
  onGoogleLogin: () => void
}

export function LoginForm({
  loginState,
  message,
  isGoogleLoginAvailable = true,
  onGoogleLogin,
}: LoginFormProps) {
  const [email, setEmail] = useState('')
  const isGoogleLoginBusy = loginState === 'loading' || loginState === 'restoring'
  const isGoogleLoginDisabled = isGoogleLoginBusy

  const handleEmailLogin = () => {
    Alert.alert('Đăng nhập', 'Luồng đăng nhập bằng email chưa được cấu hình.')
  }

  const handleAppleLogin = () => {
    Alert.alert('Đăng nhập Apple', 'Apple Sign In chưa được cấu hình cho Android.')
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
            onPress={handleEmailLogin}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>ĐĂNG NHẬP</Text>
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
              (isGoogleLoginDisabled || !isGoogleLoginAvailable) && styles.disabledButton,
            ]}
          >
            {isGoogleLoginBusy ? (
              <ActivityIndicator color={colors.green} />
            ) : (
              <MaterialCommunityIcons name='google' size={28} color='#4285F4' />
            )}
            <Text style={styles.socialButtonText}>Đăng nhập với Google</Text>
          </Pressable>

          <Pressable
            accessibilityRole='button'
            onPress={handleAppleLogin}
            style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
          >
            <FontAwesome name='apple' size={30} color={colors.dark} />
            <Text style={styles.socialButtonText}>Đăng nhập với Apple</Text>
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
