import { Feather } from '@expo/vector-icons'
import { useMemo } from 'react'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { GoogleLoginResponse } from '@/features/auth/domain/google-auth.types'
import { colors, styles } from '@/features/auth/presentation/components/auth.styles'
import { formatValue, getObjectKeys } from '@/features/auth/utils/format-value'

type AuthHomeProps = {
  authResponse: GoogleLoginResponse
  onSignOut: () => void
}

export function AuthHome({ authResponse, onSignOut }: AuthHomeProps) {
  const tokenKeys = useMemo(() => getObjectKeys(authResponse.tokens), [authResponse.tokens])
  const googleName = authResponse.google.name ?? 'Google user'
  const googleEmail = authResponse.google.email ?? 'Không có email'

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
        <View style={styles.homeHeader}>
          {authResponse.google.picture ? (
            <Image source={{ uri: authResponse.google.picture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Feather name='user' size={32} color={colors.green} />
            </View>
          )}

          <View style={styles.homeTitleGroup}>
            <Text style={styles.welcomeLabel}>Xin chào</Text>
            <Text style={styles.homeTitle}>{googleName}</Text>
            <Text style={styles.homeSubtitle}>{googleEmail}</Text>
          </View>
        </View>

        <View style={styles.statusPanel}>
          <Feather name='check-circle' size={22} color={colors.success} />
          <Text style={styles.statusText}>{authResponse.message}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Google</Text>
          <DetailRow label='Sub' value={authResponse.google.sub} />
          <DetailRow label='Email' value={authResponse.google.email} />
          <DetailRow label='Name' value={authResponse.google.name} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User</Text>
          <Text style={styles.jsonBlock}>{formatValue(authResponse.user)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session</Text>
          <Text style={styles.tokenSummary}>
            {tokenKeys.length > 0
              ? `Đã nhận tokens: ${tokenKeys.join(', ')}`
              : 'Backend không trả về token key nào.'}
          </Text>
        </View>

        <Pressable
          accessibilityRole='button'
          onPress={onSignOut}
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
        >
          <Feather name='log-out' size={20} color='#ffffff' />
          <Text style={styles.signOutButtonText}>Đăng xuất</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{formatValue(value)}</Text>
    </View>
  )
}
