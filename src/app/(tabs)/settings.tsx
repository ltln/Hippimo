import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

const settingItems = [
  {
    label: 'Thông tin tài khoản',
    icon: 'card-account-details-outline',
    action: () => router.push('/account-info'),
  },
  {
    label: 'Cài đặt thông báo',
    icon: 'clipboard-check-outline',
    action: () =>
      Alert.alert(
        'Cài đặt thông báo',
        'Bạn có thể bật nhắc chi tiêu, nhắc ngân sách và nhắc hóa đơn.',
      ),
  },
  {
    label: 'Thêm passcode',
    icon: 'credit-card-lock-outline',
    action: () => Alert.alert('Passcode', 'Tính năng khóa app bằng passcode sẽ được bật tại đây.'),
  },
  {
    label: 'Quản lý thiết bị',
    icon: 'cellphone-link',
    action: () =>
      Alert.alert(
        'Quản lý thiết bị',
        'Hiển thị danh sách thiết bị đã đăng nhập và phiên hoạt động.',
      ),
  },
  {
    label: 'Cài đặt đăng nhập',
    icon: 'power-plug-outline',
    action: () =>
      Alert.alert(
        'Cài đặt đăng nhập',
        'Bạn có thể đổi phương thức đăng nhập hoặc bật xác thực bổ sung.',
      ),
  },
] as const

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 18, 34) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
            <Ionicons name='arrow-back' size={27} color='#0B1D17' />
          </Pressable>
          <Text style={styles.title}>Cài đặt</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.list}>
          {settingItems.map((item) => (
            <Pressable key={item.label} style={styles.item} onPress={item.action}>
              <MaterialCommunityIcons name={item.icon} size={25} color='#E9FFF1' />
              <Text style={styles.itemText}>{item.label}</Text>
            </Pressable>
          ))}
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
  content: {
    paddingHorizontal: 31,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 34,
  },
  backButton: {
    width: 44,
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '900',
    color: '#0B1D17',
  },
  headerSpacer: {
    width: 44,
  },
  list: {
    gap: 10,
  },
  item: {
    minHeight: 62,
    borderRadius: 5,
    backgroundColor: '#128A3D',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 16,
  },
  itemText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
})
