import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTransactions, type TransactionItem } from '@/shared/contexts/transaction-context'
import {
  formatVnd,
  getWalletTypeMeta,
  useWallets,
  type WalletItem,
} from '@/shared/contexts/wallet-context'

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
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 12, 28) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>QUẢN LÝ VÍ</Text>
          <View style={styles.headerActions}>
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

        {filteredWallets.map((wallet) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            transactions={transactions.filter((transaction) =>
              transactionBelongsToWallet(transaction, wallet),
            )}
            onDelete={() => {
              Alert.alert('Xóa ví', `Bạn có chắc muốn xóa ${wallet.name}?`, [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Xóa', style: 'destructive', onPress: () => deleteWallet(wallet.id) },
              ])
            }}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function WalletCard({
  wallet,
  transactions,
  onDelete,
}: {
  wallet: WalletItem
  transactions: TransactionItem[]
  onDelete: () => void
}) {
  const walletType = getWalletTypeMeta(wallet.type)
  const total = wallet.balance + wallet.spent
  const percent = total > 0 ? Math.round((wallet.balance / total) * 100) : 0
  const percentColor = getPercentColor(percent)

  return (
    <View style={styles.walletCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.walletName}>{wallet.name}</Text>
        <View style={styles.cardActions}>
          <Pressable
            onPress={() => router.push({ pathname: '/edit-wallet', params: { id: wallet.id } })}
            hitSlop={8}
            style={styles.iconButton}
          >
            <MaterialCommunityIcons name='tune-variant' size={25} color='#CDECD9' />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8} style={styles.iconButton}>
            <MaterialCommunityIcons name='trash-can-outline' size={24} color='#FFB0A4' />
          </Pressable>
        </View>
      </View>

      <View style={styles.walletSummary}>
        <View style={styles.progressWrap}>
          <View style={[styles.progressRing, { borderColor: percentColor }]}>
            <Text style={[styles.progressNumber, { color: percentColor }]}>{percent}</Text>
            <Text style={[styles.progressPercent, { color: percentColor }]}>%</Text>
          </View>
        </View>

        <View style={styles.balanceBlock}>
          <View style={styles.walletTypeRow}>
            <View style={styles.walletTypeIcon}>
              <MaterialCommunityIcons name={walletType.icon} size={20} color='#BFEACD' />
            </View>
            <Text style={styles.walletTypeLabel}>{walletType.label}</Text>
          </View>
          <Text style={styles.balanceLabel}>CÒN LẠI</Text>
          <Text style={styles.balanceValue}>{formatVnd(wallet.balance)}</Text>
          <Text style={styles.spentLabel}>ĐÃ SỬ DỤNG</Text>
          <Text style={styles.spentValue}>{formatVnd(wallet.spent)}</Text>
        </View>
      </View>

      <Text style={styles.recentTitle}>Giao dịch gần đây</Text>
      {transactions.slice(0, 2).map((transaction) => (
        <RecentTransaction key={transaction.id} transaction={transaction} />
      ))}
      {transactions.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có giao dịch trong ví này.</Text>
      ) : null}
    </View>
  )
}

function RecentTransaction({ transaction }: { transaction: TransactionItem }) {
  const transferWallets = getTransferWallets(transaction)

  return (
    <View style={styles.transactionRow}>
      <View style={[styles.transactionIcon, { backgroundColor: transaction.iconBackground }]}>
        <MaterialCommunityIcons name={transaction.icon} size={24} color='#FFFFFF' />
      </View>
      <View style={styles.transactionMain}>
        <Text style={styles.transactionTitle}>{transaction.title}</Text>
        {transaction.type === 'transfer' ? (
          <Text style={styles.transferSubtitle}>
            {transferWallets.fromWallet} → {transferWallets.toWallet}
          </Text>
        ) : null}
      </View>
      <View style={styles.transactionAmountBlock}>
        <Text style={styles.transactionAmount}>{transaction.amount}</Text>
        <Text style={styles.transactionDate}>{transaction.dateLabel}</Text>
      </View>
    </View>
  )
}

function transactionBelongsToWallet(transaction: TransactionItem, wallet: WalletItem) {
  if (transaction.type === 'transfer') {
    return (
      transaction.transferFromWalletId === wallet.id ||
      transaction.transferToWalletId === wallet.id ||
      transaction.detail.tags[0]
        ?.toLocaleLowerCase('vi-VN')
        .includes(wallet.name.toLocaleLowerCase('vi-VN'))
    )
  }

  return (
    transaction.walletId === wallet.id ||
    transaction.detail.tags[0]?.trim().toLocaleLowerCase('vi-VN') ===
      wallet.name.trim().toLocaleLowerCase('vi-VN')
  )
}

function getTransferWallets(transaction: TransactionItem) {
  const transferTag = transaction.detail.tags[0] ?? ''
  const [fromWallet, toWallet] = transferTag.split('->').map((value) => value.trim())

  return {
    fromWallet: fromWallet || transaction.detail.footer,
    toWallet: toWallet || 'Ví nhận',
  }
}

function getPercentColor(percent: number) {
  if (percent >= 70) return '#79F4A6'
  if (percent >= 40) return '#FFCD24'
  if (percent >= 20) return '#FFB0A4'
  return '#FF6A5E'
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 22,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '900',
    color: '#061710',
  },
  headerActions: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: '#F0F3F1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#0B1D17',
    fontSize: 14,
    paddingVertical: 0,
  },
  walletCard: {
    backgroundColor: '#128A3D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletName: {
    flex: 1,
    fontSize: 27,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
  progressWrap: {
    width: 132,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 7,
    borderColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  progressNumber: {
    fontSize: 48,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  progressPercent: {
    fontSize: 19,
    color: '#D7F3E2',
    marginTop: 13,
  },
  balanceBlock: {
    flex: 1,
  },
  walletTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  walletTypeIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#BFEACD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTypeLabel: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: '#BFEACD',
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#9CD1AE',
  },
  balanceValue: {
    marginTop: 4,
    fontSize: 23,
    fontWeight: '900',
    color: '#FFCD24',
  },
  spentLabel: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '900',
    color: '#9CD1AE',
  },
  spentValue: {
    marginTop: 4,
    fontSize: 23,
    fontWeight: '900',
    color: '#FFB0A4',
  },
  recentTitle: {
    marginTop: 22,
    marginBottom: 8,
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  transactionRow: {
    minHeight: 72,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.48)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  transactionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionMain: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  transferSubtitle: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '800',
    color: '#C9E8D4',
  },
  transactionAmountBlock: {
    alignItems: 'flex-end',
    maxWidth: 112,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  transactionDate: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '800',
    color: '#CDECD9',
  },
  emptyText: {
    paddingVertical: 16,
    color: '#DDF5E6',
    fontSize: 13,
    fontWeight: '800',
  },
})
