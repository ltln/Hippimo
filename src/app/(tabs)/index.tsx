import type { ComponentProps } from 'react'
import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { Typography } from '@/config/constants/theme'
import { useTransactions } from '@/features/transaction/data/transaction-context'
import {
  formatVnd,
  getWalletTypeMeta,
  type WalletItem,
  useWallets,
} from '@/features/wallet/data/wallet-context'

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name']

const chartBars = [64, 94, 42, 118, 74, 98, 56]
const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export default function DashboardScreen() {
  const insets = useSafeAreaInsets()
  const { wallets } = useWallets()
  const { transactions } = useTransactions()

  const totalBalance = useMemo(
    () => wallets.reduce((total, wallet) => total + wallet.balance, 0),
    [wallets],
  )
  const recentTransactions = transactions.slice(0, 4)
  const visibleWallets = wallets.slice(0, 4)

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 18, 34) }]}>
        <View style={[styles.headerLeftAction, { top: Math.max(insets.top + 18, 34) + 2 }]}>
          <Pressable
            style={styles.headerIconButton}
            accessibilityLabel='Danh mục'
            hitSlop={8}
            onPress={() => router.push('/(tabs)/categories')}
          >
            <MaterialCommunityIcons name='tag-outline' size={21} color='#12392C' />
          </Pressable>
        </View>
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
          TỔNG QUAN
        </Text>
        <View style={[styles.headerActions, { top: Math.max(insets.top + 18, 34) + 2 }]}>
          <Pressable
            style={styles.headerIconButton}
            accessibilityLabel='Chat AI'
            hitSlop={8}
            onPress={() => router.push('/(tabs)/chat_ai')}
          >
            <Ionicons name='sparkles-outline' size={22} color='#12392C' />
          </Pressable>

          <Pressable
            style={styles.headerIconButton}
            accessibilityLabel='Cài đặt'
            hitSlop={8}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Ionicons name='settings-outline' size={22} color='#12392C' />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 92 }]}
      >
        <SectionHeader title='CHI TIÊU' />

        <View style={styles.chartCard}>
          <View>
            <Text style={styles.chartMonth}>Tháng 07 / 2026</Text>
            <Text style={styles.chartAmount}>{formatVnd(totalBalance || 3000000)}</Text>
          </View>

          <View style={styles.chartArea}>
            {chartBars.map((height, index) => (
              <View key={weekDays[index]} style={styles.barColumn}>
                <View style={[styles.bar, { height }]}>
                  <View
                    style={[
                      styles.barSegment,
                      index % 2 === 0 ? styles.barSegmentFood : styles.barSegmentShop,
                    ]}
                  />
                </View>
                <Text style={styles.dayLabel}>{weekDays[index]}</Text>
              </View>
            ))}
          </View>

          <View style={styles.legendRow}>
            <LegendPill color='#11382B' label='Ăn uống' />
            <LegendPill color='#E9695F' label='Mua sắm' />
          </View>
        </View>

        <SectionHeader
          title='DANH SÁCH VÍ'
          action='XEM TẤT CẢ >'
          onActionPress={() => router.push('/(tabs)/wallet')}
        />
        <View style={styles.walletList}>
          {visibleWallets.map((wallet, index) => (
            <WalletRow key={wallet.id} wallet={wallet} fallbackIndex={index} />
          ))}
        </View>

        <SectionHeader
          title='GIAO DỊCH GẦN ĐÂY'
          action='XEM TẤT CẢ >'
          onActionPress={() => router.push('/(tabs)/transaction')}
        />
        <View style={styles.transactionsCard}>
          {recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionRow}>
              <View
                style={[styles.transactionIcon, { backgroundColor: transaction.iconBackground }]}
              >
                <MaterialCommunityIcons name={transaction.icon} size={20} color='#FFFFFF' />
              </View>
              <View style={styles.transactionBody}>
                <Text style={styles.transactionTitle}>{transaction.title}</Text>
                <Text style={styles.transactionDate}>{transaction.dateLabel}</Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  transaction.amountValue < 0
                    ? styles.transactionExpense
                    : styles.transactionIncome,
                ]}
              >
                {transaction.amount}
              </Text>
            </View>
          ))}
        </View>

        <SectionHeader
          title='AI & NGÂN SÁCH'
          action='MỞ CHAT AI >'
          onActionPress={() => router.push('/(tabs)/chat_ai')}
        />
        <View style={styles.aiCard}>
          <View style={styles.budgetRow}>
            <View style={styles.aiIconBubble}>
              <MaterialCommunityIcons name='chart-donut' size={23} color='#0E372B' />
            </View>
            <View style={styles.budgetBody}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetTitle}>Ngân sách tháng</Text>
                <Text style={styles.budgetPercent}>68%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
              </View>
            </View>
          </View>

          <View style={styles.insightRow}>
            <View style={styles.aiIconBubble}>
              <Ionicons name='sparkles-outline' size={22} color='#0E372B' />
            </View>
            <View style={styles.insightBody}>
              <Text style={styles.insightTitle}>AI gợi ý</Text>
              <Text style={styles.insightText}>
                Chi tiêu ăn uống đang ổn định. Bạn có thể giữ thêm 300.000 VND cho cuối tuần.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function SectionHeader({
  action,
  onActionPress,
  title,
}: {
  action?: string
  onActionPress?: () => void
  title: string
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendPill}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  )
}

function WalletRow({ fallbackIndex, wallet }: { fallbackIndex: number; wallet: WalletItem }) {
  const meta = getWalletTypeMeta(wallet.type)
  const displayName = wallet.name || `Ví ${fallbackIndex + 1}`

  return (
    <View style={styles.walletRow}>
      <View style={styles.walletIcon}>
        <MaterialCommunityIcons name={meta.icon as MaterialIconName} size={22} color='#0C3025' />
      </View>
      <Text style={styles.walletName}>{displayName}</Text>
      <Text style={styles.walletAmount}>{formatVnd(wallet.balance)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FBF5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 22,
    paddingBottom: 18,
    backgroundColor: '#F7FBF5',
    position: 'relative',
  },
  headerActions: {
    position: 'absolute',
    right: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 2,
    elevation: 2,
  },
  headerLeftAction: {
    position: 'absolute',
    left: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 2,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#081A13',
    fontSize: Typography.screenHeaderFontSize,
    fontWeight: '900',
    pointerEvents: 'none',
    textAlign: 'center',
    zIndex: 0,
  },
  content: {
    paddingHorizontal: 22,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#12392C',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  sectionAction: {
    color: '#12392C',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  chartCard: {
    borderRadius: 26,
    backgroundColor: '#79C77C',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 16,
  },
  chartMonth: {
    color: '#E9F8E2',
    fontSize: 14,
    fontWeight: '700',
  },
  chartAmount: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  chartArea: {
    height: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderRadius: 18,
    backgroundColor: '#8DD590',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 8,
  },
  barColumn: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 7,
  },
  bar: {
    width: 18,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 10,
    backgroundColor: '#CFECC2',
  },
  barSegment: {
    width: '100%',
    height: '42%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  barSegmentFood: {
    backgroundColor: '#12392C',
  },
  barSegmentShop: {
    backgroundColor: '#E9695F',
  },
  dayLabel: {
    color: '#E9F8E2',
    fontSize: 10,
    fontWeight: '800',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 10,
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 14,
    backgroundColor: '#E9F8E2',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendLabel: {
    color: '#12392C',
    fontSize: 12,
    fontWeight: '800',
  },
  walletList: {
    gap: 10,
  },
  walletRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    backgroundColor: '#79C77C',
    paddingHorizontal: 14,
  },
  walletIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#DDF2D2',
  },
  walletName: {
    flex: 1,
    marginLeft: 12,
    color: '#0C3025',
    fontSize: 15,
    fontWeight: '900',
  },
  walletAmount: {
    color: '#0C3025',
    fontSize: 14,
    fontWeight: '900',
  },
  transactionsCard: {
    borderRadius: 22,
    backgroundColor: '#79C77C',
    paddingVertical: 6,
  },
  transactionRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  transactionIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  transactionBody: {
    flex: 1,
    marginLeft: 12,
  },
  transactionTitle: {
    color: '#0C3025',
    fontSize: 14,
    fontWeight: '900',
  },
  transactionDate: {
    marginTop: 3,
    color: '#245442',
    fontSize: 11,
    fontWeight: '700',
  },
  transactionAmount: {
    maxWidth: 112,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '900',
  },
  transactionExpense: {
    color: '#B3261E',
  },
  transactionIncome: {
    color: '#0C3025',
  },
  aiCard: {
    borderRadius: 22,
    backgroundColor: '#79C77C',
    padding: 16,
    gap: 16,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIconBubble: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#DDF2D2',
  },
  budgetBody: {
    flex: 1,
    marginLeft: 12,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetTitle: {
    color: '#0C3025',
    fontSize: 14,
    fontWeight: '900',
  },
  budgetPercent: {
    color: '#0C3025',
    fontSize: 14,
    fontWeight: '900',
  },
  progressTrack: {
    height: 9,
    overflow: 'hidden',
    borderRadius: 5,
    backgroundColor: '#DDF2D2',
    marginTop: 9,
  },
  progressFill: {
    width: '68%',
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#12392C',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightBody: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    color: '#0C3025',
    fontSize: 14,
    fontWeight: '900',
  },
  insightText: {
    marginTop: 4,
    color: '#245442',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
})
