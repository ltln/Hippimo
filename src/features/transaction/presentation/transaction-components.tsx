import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Pressable, Text, View, type StyleProp, type TextStyle } from 'react-native'

import type { TransactionItem } from '@/features/transaction/data/transaction-context'
import { styles } from '@/features/transaction/presentation/transaction.styles'

export type TransactionPageTabKey = 'activity' | 'statistics'

const transactionPageTabs: {
  key: TransactionPageTabKey
  label: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
}[] = [
  { key: 'activity', label: 'Hoạt động', icon: 'history' },
  {
    key: 'statistics',
    label: 'Thống kê',
    icon: 'chart-box-outline',
  },
]

export function TransactionPageTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: TransactionPageTabKey
  onTabChange: (tab: TransactionPageTabKey) => void
}) {
  return (
    <View style={styles.pageTabs}>
      {transactionPageTabs.map((tab) => {
        const active = activeTab === tab.key

        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={[styles.pageTab, active && styles.pageTabActive]}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={20}
              color={active ? '#245442' : '#5D6B66'}
            />
            <Text style={[styles.pageTabText, active && styles.pageTabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

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

export function AiInsightCard({ transactions }: { transactions: TransactionItem[] }) {
  const monthStats = getMonthlyExpenseStats(transactions)

  return (
    <View style={styles.aiCard}>
      <View style={styles.aiHeader}>
        <View style={styles.aiTitleRow}>
          <View style={styles.aiIconBox}>
            <MaterialCommunityIcons name='chart-box-outline' size={17} color='#1EBAC2' />
          </View>
          <Text style={styles.aiTitle}>Quản lý chi tiêu</Text>
        </View>
      </View>

      <View style={styles.aiContent}>
        <View style={styles.aiChart}>
          {monthStats.months.map((month) => (
            <View key={month.label} style={styles.aiBarColumn}>
              <View
                style={[styles.aiBar, { height: month.height, backgroundColor: month.color }]}
              />
              <Text style={styles.aiMonthLabel}>{month.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.aiSummary}>
          <View style={styles.aiCategoryRow}>
            <MaterialCommunityIcons name={monthStats.icon} size={22} color={monthStats.iconColor} />
            <Text style={styles.aiCategoryText} numberOfLines={1}>
              Chi tiêu {monthStats.category}
            </Text>
          </View>
          <Text style={styles.aiDescription}>{monthStats.monthText} của bạn là</Text>
          <Text style={styles.aiAmount}>{monthStats.amount}</Text>
        </View>
      </View>
    </View>
  )
}

export function DetailCard({ item, onDelete }: { item: TransactionItem; onDelete: () => void }) {
  const isTransfer = item.type === 'transfer'
  const note = item.detail.note || 'Không có ghi chú'
  const time = item.timeLabel ?? item.detail.time ?? '00:00'
  const date = item.detail.date.replaceAll('-', '/')

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/transaction/detail', params: { id: item.id } })}
      onLongPress={onDelete}
      style={[styles.detailCard, isTransfer ? styles.detailCardDark : styles.detailCardLight]}
    >
      <View
        style={[
          styles.detailCategoryIcon,
          { backgroundColor: isTransfer ? '#EAF7FF' : item.iconBackground },
        ]}
      >
        <MaterialCommunityIcons
          name={isTransfer ? 'swap-horizontal' : item.icon}
          size={28}
          color={isTransfer ? '#31A8D8' : '#FFFFFF'}
        />
      </View>

      <View style={styles.detailBody}>
        <Text style={[styles.detailNote, isTransfer && styles.detailTextOnDark]} numberOfLines={2}>
          {note}
        </Text>
        <Text
          style={[styles.detailDate, isTransfer && styles.detailSecondaryTextOnDark]}
          numberOfLines={1}
        >
          {time} - {date}
        </Text>
        <View style={styles.detailCategoryBadge}>
          <Text
            style={[styles.detailCategoryText, isTransfer && styles.detailTextOnDark]}
            numberOfLines={1}
          >
            {isTransfer ? 'Chuyển tiền ví' : item.title}
          </Text>
        </View>
      </View>

      <View style={styles.detailSide}>
        <MoneyText
          value={item.detail.amountDisplay}
          mutedColor={item.amountValue < 0 ? '#B3261E99' : '#25B56899'}
          valueStyle={[
            styles.detailAmount,
            { color: item.amountValue < 0 ? '#B3261E' : '#25B568' },
          ]}
          currencyStyle={styles.detailAmountCurrency}
        />
      </View>
    </Pressable>
  )
}

function MoneyText({
  currencyStyle,
  mutedColor,
  value,
  valueStyle,
}: {
  currencyStyle: StyleProp<TextStyle>
  mutedColor: string
  value: string
  valueStyle: StyleProp<TextStyle>
}) {
  const [amount, currency] = value.split(/\s+(?=VND$)/)
  const displayCurrency = currency === 'VND' ? 'đ' : currency

  return (
    <Text style={valueStyle} numberOfLines={1} adjustsFontSizeToFit>
      {amount}
      {displayCurrency ? (
        <Text style={[currencyStyle, { color: mutedColor }]}>{displayCurrency}</Text>
      ) : null}
    </Text>
  )
}

function getMonthlyExpenseStats(transactions: TransactionItem[]) {
  const now = new Date()
  const monthKeys = Array.from({ length: 3 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 2 + index, 1)

    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: `T${date.getMonth() + 1}`,
    }
  })
  const monthlyTotals = monthKeys.map((month) => {
    const total = transactions
      .filter((item) => item.type === 'expense' && item.dateISO.startsWith(month.key))
      .reduce((sum, item) => sum + Math.abs(item.amountValue), 0)

    return { ...month, total }
  })
  const maxTotal = Math.max(...monthlyTotals.map((month) => month.total), 1)
  const currentMonthKey = monthKeys[2]?.key ?? ''
  const currentMonthLabel = monthKeys[2]?.label ?? 'T'
  const currentExpenses = transactions.filter(
    (item) => item.type === 'expense' && item.dateISO.startsWith(currentMonthKey),
  )
  const categoryTotals = currentExpenses.reduce<
    Map<string, { total: number; item: TransactionItem }>
  >((map, item) => {
    const current = map.get(item.title)
    map.set(item.title, {
      total: (current?.total ?? 0) + Math.abs(item.amountValue),
      item,
    })
    return map
  }, new Map())
  const topCategory =
    Array.from(categoryTotals.values()).sort((first, second) => second.total - first.total)[0] ??
    null

  return {
    months: monthlyTotals.map((month, index) => ({
      label: month.label,
      height: Math.max(12, Math.round((month.total / maxTotal) * 58)),
      color: index === 2 ? '#2288E8' : '#BFE1F8',
    })),
    category: topCategory?.item.title ?? currentMonthLabel,
    monthLabel: currentMonthLabel,
    monthText: `tháng ${currentMonthLabel.replace('T', '')}`,
    amount: `${new Intl.NumberFormat('vi-VN').format(topCategory?.total ?? 0)}đ`,
    icon: topCategory?.item.icon ?? 'chart-line',
    iconColor: topCategory?.item.iconBackground ?? '#2288E8',
  }
}
