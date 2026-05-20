import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import { getWalletTypeMeta, type WalletItem } from '@/features/wallet/data/wallet-context'
import type { TransactionItem } from '@/features/transaction/data/transaction-context'
import {
  getExpenseWallet,
  getTransferWallets,
} from '@/features/transaction/utils/transaction-utils'
import { styles } from '@/features/transaction/presentation/transaction.styles'

export function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  )
}

export function DetailCard({
  item,
  wallets,
  onDelete,
}: {
  item: TransactionItem
  wallets: WalletItem[]
  onDelete: () => void
}) {
  const isTransfer = item.type === 'transfer'
  const transferWallets = getTransferWallets(item, wallets)
  const expenseWallet = getExpenseWallet(item, wallets)

  return (
    <View style={[styles.detailCard, isTransfer ? styles.detailCardDark : styles.detailCardLight]}>
      <View style={styles.detailActions}>
        <Pressable
          hitSlop={8}
          onPress={() => router.push({ pathname: '/edit-transaction', params: { id: item.id } })}
          style={styles.editButton}
        >
          <MaterialCommunityIcons name='pencil-outline' size={18} color='#E5FFF1' />
        </Pressable>
        <Pressable hitSlop={12} onPress={onDelete}>
          <MaterialCommunityIcons name='trash-can-outline' size={19} color='#FFB0A4' />
        </Pressable>
      </View>

      {isTransfer ? (
        <View style={styles.detailTop}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.transferAmount, { color: item.detail.amountColor, textAlign: 'left' }]}
            >
              {item.detail.amountDisplay}
            </Text>

            <View
              style={[
                styles.transferIconsCentered,
                { justifyContent: 'flex-start', marginTop: 10 },
              ]}
            >
              <View style={styles.transferPill}>
                <MaterialCommunityIcons
                  name={getWalletTypeMeta(transferWallets.fromType).icon}
                  size={14}
                  color='#0B1D17'
                />
                <Text style={styles.transferPillText}>{transferWallets.fromWallet}</Text>
              </View>
              <Ionicons name='arrow-forward' size={14} color='#FFFFFF' />
              <View style={styles.transferPill}>
                <MaterialCommunityIcons
                  name={getWalletTypeMeta(transferWallets.toType).icon}
                  size={14}
                  color='#0B1D17'
                />
                <Text style={styles.transferPillText}>{transferWallets.toWallet}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.detailIconWrap, styles.detailIconWrapDark]}>
            <View
              style={[
                styles.detailRoundIcon,
                { backgroundColor: item.iconBackground ?? '#0A4D2E' },
              ]}
            >
              <MaterialCommunityIcons name='swap-horizontal' size={24} color='#D4F8E6' />
            </View>
            <Text style={styles.detailFooterTitle}>Chuyển tiền ví</Text>
          </View>
        </View>
      ) : (
        <View style={styles.detailTop}>
          <Text style={[styles.detailAmount, { color: item.detail.amountColor }]}>
            {item.detail.amountDisplay}
          </Text>

          <View style={[styles.detailIconWrap, styles.detailIconWrapDark]}>
            <View
              style={[
                styles.detailRoundIcon,
                { backgroundColor: item.iconBackground ?? '#0A4D2E' },
              ]}
            >
              <MaterialCommunityIcons name={item.icon} size={24} color='#D4F8E6' />
            </View>
            <Text style={styles.detailFooterTitle}>{item.detail.footer}</Text>
          </View>
        </View>
      )}

      <View style={styles.detailInfo}>
        <DetailLine icon='calendar-outline' text={item.detail.date} />

        {!isTransfer && expenseWallet.name && (
          <WalletDetailLine
            wallet={expenseWallet.wallet}
            walletType={expenseWallet.walletType}
            fallbackName={expenseWallet.name}
          />
        )}

        <DetailLine icon='chatbox-ellipses-outline' text={item.detail.note || 'Không có ghi chú'} />
      </View>

      <View style={styles.tipRow}>
        <View style={styles.tipBadge}>
          <Text style={styles.tipBadgeText}>A</Text>
        </View>
        <Text style={styles.tipText}>
          {item.detail.aiSuggestion || 'Đang phân tích giao dịch...'}
        </Text>
      </View>
    </View>
  )
}

function DetailLine({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.detailLine}>
      <Ionicons name={icon} size={15} color='#F5FFF8' />
      <Text style={styles.detailLineText}>{text}</Text>
    </View>
  )
}

function WalletDetailLine({
  wallet,
  fallbackName,
  walletType,
}: {
  wallet?: WalletItem
  fallbackName: string
  walletType?: WalletItem['type']
}) {
  const meta = getWalletTypeMeta(wallet?.type ?? walletType ?? 'cash')

  return (
    <View style={styles.detailLine}>
      <MaterialCommunityIcons name={meta.icon} size={15} color='#F5FFF8' />
      <Text style={styles.detailLineText}>{wallet?.name ?? fallbackName}</Text>
    </View>
  )
}
