import { router, useLocalSearchParams } from 'expo-router'
import { Alert, StyleSheet, Text, View } from 'react-native'

import { WalletForm } from '@/shared/components/wallet-form'
import { useWallets } from '@/shared/contexts/wallet-context'

export default function EditWalletScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { wallets, updateWallet } = useWallets()
  const wallet = wallets.find((item) => item.id === id)

  if (!wallet || !id) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Không tìm thấy ví để chỉnh sửa.</Text>
      </View>
    )
  }

  return (
    <WalletForm
      title='CHỈNH SỬA VÍ'
      submitLabel='CẬP NHẬT VÍ'
      initialWallet={wallet}
      onSubmit={(updatedWallet) => {
        updateWallet(updatedWallet)
        Alert.alert('Đã cập nhật', 'Thông tin ví đã được cập nhật.', [
          { text: 'OK', onPress: () => router.back() },
        ])
      }}
    />
  )
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B1D17',
    textAlign: 'center',
  },
})
