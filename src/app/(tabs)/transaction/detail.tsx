import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTransactions } from '@/features/transaction/data/transaction-context'
import {
  getExpenseWallet,
  getTransferWallets,
} from '@/features/transaction/utils/transaction-utils'
import {
  getWalletTypeMeta,
  type WalletType,
  useWallets,
} from '@/features/wallet/data/wallet-context'
import { confirmDelete } from '@/shared/utils/confirm-delete'

import { styles } from '@/features/transaction/presentation/transaction.styles'

export default function TransactionDetailScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { transactions, deleteTransaction } = useTransactions()
  const { wallets } = useWallets()
  const item = useMemo(
    () => transactions.find((transaction) => transaction.id === id),
    [id, transactions],
  )

  if (!item) {
    return (
      <SafeAreaView style={styles.detailScreen} edges={['left', 'right', 'bottom']}>
        <View style={[styles.detailHeader, { paddingTop: Math.max(insets.top + 18, 34) }]}>
          <HeaderBackButton />
          <Text style={styles.detailHeaderTitle}>Chi Tiết Giao Dịch</Text>
        </View>
        <View style={styles.detailMissingWrap}>
          <Text style={styles.detailMissingText}>Không tìm thấy giao dịch</Text>
        </View>
      </SafeAreaView>
    )
  }

  const isTransfer = item.type === 'transfer'
  const expenseWallet = getExpenseWallet(item, wallets)
  const transferWallets = getTransferWallets(item, wallets)
  const expenseWalletMeta = getWalletTypeMeta(
    expenseWallet.wallet?.type ?? expenseWallet.walletType ?? 'cash',
  )
  const fromWalletMeta = getWalletTypeMeta(transferWallets.fromType)
  const toWalletMeta = getWalletTypeMeta(transferWallets.toType)
  const iconBackgroundColor = item.iconBackground || '#245442'

  const handleDelete = () => {
    confirmDelete('Xóa giao dịch', `Bạn có chắc muốn xóa ${item.title}?`, async () => {
      try {
        await deleteTransaction(item.id)
        router.back()
      } catch (error) {
        Alert.alert(
          'Không xóa được giao dịch',
          error instanceof Error ? error.message : 'Vui lòng thử lại.',
        )
      }
    })
  }

  return (
    <SafeAreaView style={styles.detailScreen} edges={['left', 'right', 'bottom']}>
      <View style={[styles.detailHeader, { paddingTop: Math.max(insets.top + 18, 34) }]}>
        <HeaderBackButton />
        <Text style={styles.detailHeaderTitle}>Chi Tiết Giao Dịch</Text>
        <View style={styles.detailHeaderActions}>
          <Pressable
            hitSlop={8}
            onPress={() => router.push({ pathname: '/edit-transaction', params: { id: item.id } })}
            style={styles.detailHeaderActionButton}
          >
            <MaterialCommunityIcons name='pencil-outline' size={16} color='#2A2D31' />
          </Pressable>
          <View style={styles.detailHeaderDivider} />
          <Pressable hitSlop={8} onPress={handleDelete} style={styles.detailHeaderActionButton}>
            <MaterialCommunityIcons name='trash-can-outline' size={16} color='#2A2D31' />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.detailScrollContent, { paddingBottom: insets.bottom + 92 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.transactionDetailPanel}>
          <View style={styles.detailHero}>
            <View style={[styles.detailHeroIcon, { backgroundColor: iconBackgroundColor }]}>
              <MaterialCommunityIcons
                name={isTransfer ? 'swap-horizontal' : item.icon}
                size={38}
                color='#FFFFFF'
              />
            </View>
            <View style={styles.detailHeroText}>
              <Text style={styles.detailHeroNote} numberOfLines={2}>
                {item.detail.note || 'Không có ghi chú'}
              </Text>
              <DetailAmount
                value={item.detail.amountDisplay}
                tone={
                  item.type === 'expense' ? 'expense' : item.amountValue >= 0 ? 'income' : 'neutral'
                }
              />
            </View>
          </View>

          <DetailInfoRow
            label='Thời gian'
            value={`${item.timeLabel ?? '00:00'} - ${item.detail.date.replaceAll('-', '/')}`}
          />

          {isTransfer ? (
            <>
              <DetailWalletRow
                label='Ví gửi'
                name={transferWallets.fromWallet}
                type={transferWallets.fromType}
              />
              <DetailWalletRow
                label='Ví nhận'
                name={transferWallets.toWallet}
                type={transferWallets.toType}
              />
            </>
          ) : (
            <DetailWalletRow
              label='Ví'
              name={expenseWallet.name}
              type={expenseWallet.wallet?.type ?? expenseWallet.walletType ?? 'cash'}
              fallbackMeta={expenseWalletMeta}
            />
          )}

          <DetailInfoRow label='Danh mục' value={isTransfer ? 'Chuyển tiền ví' : item.title} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function HeaderBackButton() {
  return (
    <Pressable hitSlop={8} onPress={() => router.back()} style={styles.detailBackButton}>
      <MaterialCommunityIcons name='arrow-left' size={28} color='#2A2D31' />
    </Pressable>
  )
}

function DetailAmount({ tone, value }: { tone: 'expense' | 'income' | 'neutral'; value: string }) {
  const [amount, currency] = value.split(/\s+(?=VND$)/)
  const color = tone === 'expense' ? '#B3261E' : tone === 'income' ? '#25B568' : '#2A2D31'

  return (
    <Text style={[styles.detailHeroAmount, { color }]} numberOfLines={1} adjustsFontSizeToFit>
      {amount}
      <Text style={styles.detailHeroCurrency}>{currency === 'VND' ? 'đ' : currency}</Text>
    </Text>
  )
}

function DetailInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.transactionDetailRow}>
      <Text style={styles.transactionDetailLabel}>{label}</Text>
      <Text style={styles.transactionDetailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  )
}

function DetailWalletRow({
  fallbackMeta,
  label,
  name,
  type,
}: {
  fallbackMeta?: ReturnType<typeof getWalletTypeMeta>
  label: string
  name: string
  type: WalletType
}) {
  const meta = fallbackMeta ?? getWalletTypeMeta(type)

  return (
    <View style={styles.transactionDetailRow}>
      <Text style={styles.transactionDetailLabel}>{label}</Text>
      <View style={styles.transactionDetailWalletValue}>
        <MaterialCommunityIcons name={meta.icon} size={18} color='#245442' />
        <Text style={styles.transactionDetailWalletText} numberOfLines={1} adjustsFontSizeToFit>
          {name}
        </Text>
      </View>
    </View>
  )
}
