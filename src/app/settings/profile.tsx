import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { Typography } from '@/config/constants/theme'
import { useAuth } from '@/features/auth/data/auth-context'
import { formatValue } from '@/features/auth/utils/format-value'

type UserRecord = Record<string, unknown>

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { authResponse } = useAuth()
  const profile = getProfile(authResponse?.user)
  const google = authResponse?.google
  const name = google?.name ?? profile.name ?? 'Người dùng'
  const email = google?.email ?? profile.email ?? 'Chưa có email'
  const id = google?.sub ?? profile.id ?? 'Chưa có ID'
  const avatarUri = google?.picture ?? profile.avatarUri

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={styles.greenBand} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 30, 56) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.panel}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
            <Ionicons name='arrow-back' size={25} color='#0B1D17' />
          </Pressable>

          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
            Hồ sơ cá nhân
          </Text>

          <View style={styles.profileHeader}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name='person' size={42} color='#FFFFFF' />
              </View>
            )}
            <Text style={styles.name} numberOfLines={2} adjustsFontSizeToFit>
              {name}
            </Text>
            <Text style={styles.email} numberOfLines={1} adjustsFontSizeToFit>
              {email}
            </Text>
          </View>

          <View style={styles.infoList}>
            <InfoRow icon='identifier' label='ID' value={id} />
            <InfoRow icon='email-outline' label='Email' value={email} />
            <InfoRow icon='account-outline' label='Tên hiển thị' value={name} />
            <InfoRow
              icon='shield-check-outline'
              label='Trạng thái'
              value={authResponse ? 'Đã đăng nhập' : 'Chưa đăng nhập'}
            />
            <InfoRow
              icon='google'
              label='Google'
              value={google ? 'Đã liên kết' : 'Chưa liên kết'}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dữ liệu tài khoản</Text>
            <Text style={styles.jsonBlock}>{formatValue(authResponse?.user)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  label: string
  value: string
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons name={icon} size={22} color='#FFFFFF' />
      </View>
      <View style={styles.infoBody}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2} adjustsFontSizeToFit>
          {value}
        </Text>
      </View>
    </View>
  )
}

function getProfile(user: unknown) {
  const record = isRecord(user) ? user : {}
  const nestedUser = isRecord(record.user) ? record.user : record

  return {
    id: getString(nestedUser, ['id', 'userId', 'userID', 'sub', 'uid']),
    name: getString(nestedUser, ['name', 'fullName', 'displayName', 'username']),
    email: getString(nestedUser, ['email', 'mail']),
    avatarUri: getString(nestedUser, ['avatar', 'avatarUrl', 'picture', 'photoURL']),
  }
}

function isRecord(value: unknown): value is UserRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getString(record: UserRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string' && value.trim()) {
      return value
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value)
    }
  }

  return undefined
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  greenBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 128,
    backgroundColor: '#79C77C',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  panel: {
    minHeight: 620,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  title: {
    marginTop: 6,
    marginBottom: 28,
    textAlign: 'center',
    fontSize: Typography.screenHeaderFontSize,
    fontWeight: '900',
    color: '#0B1D17',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E9F8E2',
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#12392C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 14,
    color: '#0C3025',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  email: {
    marginTop: 5,
    color: '#245442',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: 14,
    backgroundColor: '#F1F8EE',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#79C77C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBody: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    color: '#5D6B66',
    fontSize: 12,
    fontWeight: '800',
  },
  infoValue: {
    marginTop: 3,
    color: '#0B1D17',
    fontSize: 15,
    fontWeight: '900',
  },
  section: {
    marginTop: 22,
    borderRadius: 16,
    backgroundColor: '#F7FBF5',
    padding: 14,
  },
  sectionTitle: {
    color: '#0C3025',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },
  jsonBlock: {
    color: '#245442',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
})
