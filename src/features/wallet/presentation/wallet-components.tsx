import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import {
  formatVnd,
  getWalletTypeMeta,
  type WalletItem,
} from '@/features/wallet/data/wallet-context'
import type { TransactionItem } from '@/features/transaction/data/transaction-context'
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
  const totals = getWalletTransactionTotals(transactions, wallet.id)

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
        <View style={styles.balanceHighlight}>
          <Text style={styles.balanceLabel}>SỐ DƯ HIỆN TẠI</Text>
          <Text style={styles.balanceValue}>{formatVnd(wallet.balance)}</Text>
        </View>

        <View style={styles.walletMetaBlock}>
          <View style={styles.walletTypeRow}>
            <View style={styles.walletTypeIcon}>
              <MaterialCommunityIcons name={walletType.icon} size={20} color='#BFEACD' />
            </View>
            <Text style={styles.walletTypeLabel}>{walletType.label}</Text>
          </View>

          <View style={styles.walletMetric}>
            <Text style={styles.incomeLabel}>TỔNG THU</Text>
            <Text style={styles.incomeValue}>{formatVnd(totals.income)}</Text>
          </View>
          <View style={styles.walletMetric}>
            <Text style={styles.spentLabel}>TỔNG CHI</Text>
            <Text style={styles.spentValue}>{formatVnd(totals.expense)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.recentTitle}>Giao dịch gần đây</Text>
      {transactions.slice(0, 2).map((transaction) => (
        <RecentTransaction key={transaction.id} transaction={transaction} walletId={wallet.id} />
      ))}
      {transactions.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có giao dịch trong ví này.</Text>
      ) : null}
    </View>
  )
}

function getWalletTransactionTotals(transactions: TransactionItem[], walletId: string) {
  return transactions.reduce(
    (totals, transaction) => {
      const amount = Math.abs(transaction.amountValue)

      if (transaction.type === 'transfer') {
        if (transaction.transferToWalletId === walletId) {
          totals.income += amount
        }
        if (transaction.transferFromWalletId === walletId) {
          totals.expense += amount
        }
        return totals
      }

      if (transaction.type === 'income') {
        totals.income += amount
        return totals
      }

      totals.expense += amount
      return totals
    },
    { income: 0, expense: 0 },
  )
}

function RecentTransaction({
  transaction,
  walletId,
}: {
  transaction: TransactionItem
  walletId: string
}) {
  const amount =
    transaction.type === 'transfer'
      ? `${transaction.transferFromWalletId === walletId ? '-' : '+'}${transaction.amount}`
      : transaction.amount

  return (
    <View style={styles.transactionRow}>
      <View style={[styles.transactionIcon, { backgroundColor: transaction.iconBackground }]}>
        <MaterialCommunityIcons name={transaction.icon} size={24} color='#FFFFFF' />
      </View>
      <View style={styles.transactionMain}>
        <Text style={styles.transactionTitle}>{transaction.title}</Text>
      </View>
      <View style={styles.transactionAmountBlock}>
        <Text style={styles.transactionAmount}>{amount}</Text>
        <Text style={styles.transactionDate}>{transaction.dateLabel}</Text>
      </View>
    </View>
  )
}
