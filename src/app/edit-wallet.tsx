import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'

import { WalletForm } from '@/features/wallet/presentation/components/wallet-form'
import { useWallets } from '@/features/wallet/data/wallet-context'

export default function EditWalletScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { wallets, updateWallet, refreshWallets } = useWallets()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const hasAttemptedRefresh = useRef(false)
  const wallet = wallets.find((item) => item.id === id)

  useEffect(() => {
    if (!id || wallet || isRefreshing || hasAttemptedRefresh.current) {
      return
    }

    let isMounted = true
    hasAttemptedRefresh.current = true
    setIsRefreshing(true)
    refreshWallets()
      .catch((error) => console.error('Refresh wallets before edit failed', error))
      .finally(() => {
        if (isMounted) {
          setIsRefreshing(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [id, isRefreshing, refreshWallets, wallet])

  if (id && isRefreshing) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Äang táº£i dá»¯ liá»‡u vÃ­...</Text>
      </View>
    )
  }

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
      onSubmit={async (updatedWallet) => {
        try {
          await updateWallet(updatedWallet)
          router.replace('/(tabs)/wallet')
        } catch (error) {
          Alert.alert(
            'Không cập nhật được ví',
            error instanceof Error ? error.message : 'Vui lòng thử lại.',
          )
        }
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
