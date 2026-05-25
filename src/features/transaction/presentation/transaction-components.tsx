import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Pressable, Text, View, type StyleProp, type TextStyle } from 'react-native'

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
      <View style={styles.detailHeaderRow}>
        <View style={styles.detailCategoryRow}>
          {isTransfer ? (
            <View
              style={[
                styles.detailCategoryIcon,
                { backgroundColor: item.iconBackground ?? '#12392C' },
              ]}
            >
              <MaterialCommunityIcons name='swap-horizontal' size={22} color='#D4F8E6' />
            </View>
          ) : (
            <View
              style={[
                styles.detailCategoryIcon,
                { backgroundColor: item.iconBackground ?? '#12392C' },
              ]}
            >
              <MaterialCommunityIcons name={item.icon} size={22} color='#FFFFFF' />
            </View>
          )}
          <Text style={styles.detailCategoryTitle} numberOfLines={1}>
            {isTransfer ? 'Chuyển tiền ví' : item.detail.footer}
          </Text>
        </View>

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
      </View>

      <MoneyText
        value={item.detail.amountDisplay}
        valueStyle={[
          isTransfer ? styles.transferAmount : styles.detailAmount,
          { color: item.detail.amountColor },
        ]}
        currencyStyle={isTransfer ? styles.transferCurrency : styles.detailAmountCurrency}
      />

      {isTransfer ? (
        <View style={[styles.transferIconsCentered, { justifyContent: 'flex-start' }]}>
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
      ) : null}

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

function MoneyText({
  currencyStyle,
  value,
  valueStyle,
}: {
  currencyStyle: StyleProp<TextStyle>
  value: string
  valueStyle: StyleProp<TextStyle>
}) {
  const [amount, currency] = value.split(/\s+(?=VND$)/)

  return (
    <Text style={valueStyle} numberOfLines={1} adjustsFontSizeToFit>
      {amount}
      {currency ? <Text style={currencyStyle}> {currency}</Text> : null}
    </Text>
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
