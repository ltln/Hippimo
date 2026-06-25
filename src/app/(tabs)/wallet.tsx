import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTransactions } from '@/features/transaction/data/transaction-context'
import { useWallets } from '@/features/wallet/data/wallet-context'
import { WalletCard } from '@/features/wallet/presentation/wallet-components'
import { styles } from '@/features/wallet/presentation/wallet.styles'
import { transactionBelongsToWallet } from '@/features/wallet/utils/wallet-utils'
import { confirmDelete } from '@/shared/utils/confirm-delete'

export default function WalletScreen() {
  const insets = useSafeAreaInsets()
  const { wallets, deleteWallet } = useWallets()
  const { transactions } = useTransactions()
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')

  const filteredWallets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi-VN')

    if (!normalizedQuery) {
      return wallets
    }

    return wallets.filter((wallet) =>
      wallet.name.trim().toLocaleLowerCase('vi-VN').includes(normalizedQuery),
    )
  }, [query, wallets])

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 12, 28) }]}>
        <Text style={styles.headerTitle}>QUẢN LÝ VÍ</Text>
        <View style={[styles.headerActions, { top: Math.max(insets.top + 12, 28) }]}>
          <Pressable
            onPress={() => setShowSearch((current) => !current)}
            hitSlop={8}
            style={styles.headerIconButton}
          >
            <Ionicons name='search' size={28} color='#050505' />
          </Pressable>
          <Pressable
            onPress={() => router.push('/add-wallet')}
            hitSlop={8}
            style={styles.headerIconButton}
          >
            <Ionicons name='add' size={34} color='#050505' />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 92 }]}
        showsVerticalScrollIndicator={false}
      >
        {showSearch ? (
          <View style={styles.searchField}>
            <Ionicons name='search' size={18} color='#466456' />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder='Tìm theo tên ví'
              placeholderTextColor='#74887E'
              style={styles.searchInput}
            />
          </View>
        ) : null}

        {filteredWallets.length === 0 ? (
          <Text style={styles.emptyText}>Bạn chưa thêm ví nào</Text>
        ) : null}

        {filteredWallets.map((wallet) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            transactions={transactions.filter((transaction) =>
              transactionBelongsToWallet(transaction, wallet),
            )}
            onDelete={() => {
              const id = wallet.id
              const name = wallet.name
              confirmDelete('Xóa ví', `Bạn có chắc muốn xóa ${name}?`, async () => {
                try {
                  await deleteWallet(id)
                } catch (error) {
                  Alert.alert(
                    'Không xóa được ví',
                    error instanceof Error ? error.message : 'Vui lòng thử lại.',
                  )
                }
              })
            }}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
