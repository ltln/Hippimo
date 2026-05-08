import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import {
  formatVnd,
  getWalletTypeMeta,
  type WalletItem,
} from '@/features/wallet/data/wallet-context'
import type { TransactionItem } from '@/features/transaction/data/transaction-context'
import { getPercentColor, getTransferWallets } from '@/features/wallet/utils/wallet-utils'
import { styles } from '@/features/wallet/presentation/wallet.styles'

export function WalletCard({
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
