import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

const accountRows = [
  { icon: 'email', text: '23521142@gm.uit.edu.vn' },
  { icon: 'calendar-text', text: '23/04/2026' },
  { icon: 'shield', text: 'Đã xác thực' },
  { icon: 'logout', text: 'Đăng xuất' },
] as const

export default function AccountInfoScreen() {
  const insets = useSafeAreaInsets()

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

          <Text style={styles.title}>Thông tin tài khoản</Text>

          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Ionicons name='person' size={42} color='#FFFFFF' />
            </View>
            <View style={styles.profileText}>
              <Text style={styles.name}>LÊ THÀNH PHÁT</Text>
              <Text style={styles.id}>ID: 23521142</Text>
            </View>
          </View>

          <View style={styles.infoList}>
            {accountRows.map((row) => (
              <Pressable key={row.text} style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <MaterialCommunityIcons name={row.icon} size={24} color='#FFFFFF' />
                </View>
                <Text style={styles.infoText}>{row.text}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
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
    height: 120,
    backgroundColor: '#067B35',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  panel: {
    minHeight: 560,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingTop: 30,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  title: {
    marginTop: 6,
    marginBottom: 54,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '900',
    color: '#0B1D17',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginBottom: 62,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#063629',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: '#16734E',
  },
  id: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '900',
    color: '#128A3D',
  },
  infoList: {
    gap: 24,
  },
  infoRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  infoIcon: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: '#128A3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    color: '#444444',
  },
})
