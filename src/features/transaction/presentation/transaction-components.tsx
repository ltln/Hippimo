import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import {
  Dimensions,
  StyleSheet,
  Pressable,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  ScrollView,
} from 'react-native'
import { useState, useMemo } from 'react'

import type { TransactionItem } from '@/features/transaction/data/transaction-context'
import { styles as transactionStyles } from '@/features/transaction/presentation/transaction.styles'
import { PieChart } from 'react-native-chart-kit'

interface CustomPieChartProps {
  data: Array<{ name: string; total: number }>
  colors: string[]
}

interface ChartItem {
  name: string
  population: number
  color: string
  legendFontColor: string
  legendFontSize: number
}

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
    <View style={transactionStyles.pageTabs}>
      {transactionPageTabs.map((tab) => {
        const active = activeTab === tab.key

        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={[transactionStyles.pageTab, active && transactionStyles.pageTabActive]}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={20}
              color={active ? '#245442' : '#5D6B66'}
            />
            <Text
              style={[transactionStyles.pageTabText, active && transactionStyles.pageTabTextActive]}
            >
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export function StatisticsComponent({ transactions }: { transactions: TransactionItem[] }) {
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense')
  const [activePeriod, setActivePeriod] = useState<'week' | 'month' | 'year'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  const categoryData = useMemo(() => {
    // Fix: Create new Date objects properly, using currentDate as base
    const startOfPeriod = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
    )
    const endOfPeriod = new Date(startOfPeriod)

    if (activePeriod === 'week') {
      const day = startOfPeriod.getDay()
      const diff = startOfPeriod.getDate() - day + (day === 0 ? -6 : 1)
      startOfPeriod.setDate(diff)
      startOfPeriod.setHours(0, 0, 0, 0)
      endOfPeriod.setDate(diff + 6)
      endOfPeriod.setHours(23, 59, 59, 999)
    } else if (activePeriod === 'month') {
      startOfPeriod.setDate(1)
      startOfPeriod.setHours(0, 0, 0, 0)
      endOfPeriod.setMonth(startOfPeriod.getMonth() + 1)
      endOfPeriod.setDate(0)
      endOfPeriod.setHours(23, 59, 59, 999)
    } else if (activePeriod === 'year') {
      startOfPeriod.setMonth(0, 1)
      startOfPeriod.setHours(0, 0, 0, 0)
      endOfPeriod.setMonth(11, 31)
      endOfPeriod.setHours(23, 59, 59, 999)
    }

    const filtered = transactions.filter((t) => {
      if (t.type !== activeType) return false
      const transDate = new Date(t.dateISO)
      return transDate >= startOfPeriod && transDate <= endOfPeriod
    })

    const categoryTotals = new Map<string, { total: number; icon: string; iconBg: string }>()

    filtered.forEach((item) => {
      const current = categoryTotals.get(item.title) || {
        total: 0,
        icon: item.icon,
        iconBg: item.iconBackground,
      }
      categoryTotals.set(item.title, {
        total: current.total + Math.abs(item.amountValue),
        icon: item.icon,
        iconBg: item.iconBackground,
      })
    })

    const total = Array.from(categoryTotals.values()).reduce((sum, cat) => sum + cat.total, 0)

    return {
      total,
      categories: Array.from(categoryTotals.entries())
        .map(([name, data]) => ({
          name,
          ...data,
          percentage: total > 0 ? (data.total / total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total),
    }
  }, [transactions, activeType, activePeriod, currentDate])

  const chartColors = [
    '#79C77C',
    '#245442',
    '#12392C',
    '#3C805A',
    '#549972',
    '#8CC48D',
    '#B3D9B4',
    '#D0E7D2',
  ]

  const formatPeriodLabel = () => {
    if (activePeriod === 'week') {
      const startOfWeek = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
      )
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(diff + 6)
      return `Tuần ${startOfWeek.getDate()}-${endOfWeek.getDate()}/${endOfWeek.getMonth() + 1}`
    } else if (activePeriod === 'month') {
      return `Tháng ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`
    } else {
      return `Năm ${currentDate.getFullYear()}`
    }
  }

  return (
    <View style={transactionStyles.statisticsContainer}>
      {/* Period Filter */}
      <View style={transactionStyles.periodFilterContainer}>
        <Pressable
          style={[
            transactionStyles.periodFilterButton,
            activePeriod === 'week' && transactionStyles.periodFilterButtonActive,
          ]}
          onPress={() => setActivePeriod('week')}
        >
          <Text
            style={[
              transactionStyles.periodFilterText,
              activePeriod === 'week' && transactionStyles.periodFilterTextActive,
            ]}
          >
            Tuần
          </Text>
        </Pressable>
        <Pressable
          style={[
            transactionStyles.periodFilterButton,
            activePeriod === 'month' && transactionStyles.periodFilterButtonActive,
          ]}
          onPress={() => setActivePeriod('month')}
        >
          <Text
            style={[
              transactionStyles.periodFilterText,
              activePeriod === 'month' && transactionStyles.periodFilterTextActive,
            ]}
          >
            Tháng
          </Text>
        </Pressable>
        <Pressable
          style={[
            transactionStyles.periodFilterButton,
            activePeriod === 'year' && transactionStyles.periodFilterButtonActive,
          ]}
          onPress={() => setActivePeriod('year')}
        >
          <Text
            style={[
              transactionStyles.periodFilterText,
              activePeriod === 'year' && transactionStyles.periodFilterTextActive,
            ]}
          >
            Năm
          </Text>
        </Pressable>
      </View>

      {/* Period Navigation */}
      <View style={transactionStyles.periodNavigationContainer}>
        <Pressable
          style={transactionStyles.periodNavButton}
          onPress={() => {
            const newDate = new Date(currentDate)
            if (activePeriod === 'week') newDate.setDate(newDate.getDate() - 7)
            else if (activePeriod === 'month') newDate.setMonth(newDate.getMonth() - 1)
            else newDate.setFullYear(newDate.getFullYear() - 1)
            setCurrentDate(newDate)
          }}
        >
          <MaterialCommunityIcons name='chevron-left' size={24} color='#245442' />
        </Pressable>
        <Text style={transactionStyles.periodLabel}>{formatPeriodLabel()}</Text>
        <Pressable
          style={transactionStyles.periodNavButton}
          onPress={() => {
            const newDate = new Date(currentDate)
            if (activePeriod === 'week') newDate.setDate(newDate.getDate() + 7)
            else if (activePeriod === 'month') newDate.setMonth(newDate.getMonth() + 1)
            else newDate.setFullYear(newDate.getFullYear() + 1)
            setCurrentDate(newDate)
          }}
        >
          <MaterialCommunityIcons name='chevron-right' size={24} color='#245442' />
        </Pressable>
      </View>

      <View style={transactionStyles.typeToggleContainer}>
        <Pressable
          style={[
            transactionStyles.typeToggleButton,
            activeType === 'expense' && transactionStyles.typeToggleButtonActive,
          ]}
          onPress={() => setActiveType('expense')}
        >
          <MaterialCommunityIcons
            name='cash-minus'
            size={20}
            color={activeType === 'expense' ? '#FFFFFF' : '#245442'}
          />
          <Text
            style={[
              transactionStyles.typeToggleText,
              activeType === 'expense' && transactionStyles.typeToggleTextActive,
            ]}
          >
            Chi tiêu
          </Text>
        </Pressable>
        <Pressable
          style={[
            transactionStyles.typeToggleButton,
            activeType === 'income' && transactionStyles.typeToggleButtonActive,
          ]}
          onPress={() => setActiveType('income')}
        >
          <MaterialCommunityIcons
            name='cash-plus'
            size={20}
            color={activeType === 'income' ? '#FFFFFF' : '#245442'}
          />
          <Text
            style={[
              transactionStyles.typeToggleText,
              activeType === 'income' && transactionStyles.typeToggleTextActive,
            ]}
          >
            Thu nhập
          </Text>
        </Pressable>
      </View>

      {/* Total Amount */}
      <View style={transactionStyles.totalAmountContainer}>
        <Text style={transactionStyles.totalAmountValue}>
          {new Intl.NumberFormat('vi-VN').format(categoryData.total)}đ
        </Text>
      </View>

      {/* Pie Chart */}
      <View style={transactionStyles.chartContainer}>
        <CustomPieChart data={categoryData.categories} colors={chartColors} />
      </View>

      {/* Category List */}
      <View style={transactionStyles.categoryListContainer}>
        <Text style={transactionStyles.categoryListTitle}>Danh mục</Text>
        <ScrollView
          style={transactionStyles.categoryListScroll}
          showsVerticalScrollIndicator={false}
        >
          {categoryData.categories.map((category, index) => {
            return (
              <View key={category.name} style={transactionStyles.categoryListItem}>
                <View
                  style={[transactionStyles.categoryListIcon, { backgroundColor: category.iconBg }]}
                >
                  <MaterialCommunityIcons name={category.icon as any} size={24} color='#FFFFFF' />
                </View>
                <View style={transactionStyles.categoryListInfo}>
                  <Text style={transactionStyles.categoryListName}>{category.name}</Text>
                  <Text style={transactionStyles.categoryListPercentage}>
                    {category.percentage.toFixed(0)}%
                  </Text>
                </View>
                <Text style={transactionStyles.categoryListAmount}>
                  {new Intl.NumberFormat('vi-VN').format(category.total)}đ
                </Text>
              </View>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )
}

function CustomPieChart({ data, colors }: CustomPieChartProps) {
  const screenWidth = Dimensions.get('window').width

  const chartData: ChartItem[] = data.map((item, index) => ({
    name: item.name,
    population: item.total,
    color: colors[index % colors.length],
    legendFontColor: '#333',
    legendFontSize: 14,
  }))

  return (
    <View style={styles.container}>
      <PieChart
        data={chartData}
        hasLegend={false}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          color: (opacity: number = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor={'population'}
        backgroundColor={'transparent'}
        paddingLeft={'0'}
        absolute
      />
      <View style={transactionStyles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={transactionStyles.legendItem}>
            <View
              style={[transactionStyles.dot, { backgroundColor: colors[index % colors.length] }]}
            />
            <Text style={transactionStyles.legendText}>{item.name.replace(/^\d+\s*/, '')}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
})

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
    <Pressable
      onPress={onPress}
      style={[transactionStyles.chip, active && transactionStyles.chipActive]}
    >
      <Text style={[transactionStyles.chipText, active && transactionStyles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  )
}

export function AiInsightCard({ transactions }: { transactions: TransactionItem[] }) {
  const monthStats = getMonthlyExpenseStats(transactions)

  return (
    <View style={transactionStyles.aiCard}>
      <View style={transactionStyles.aiHeader}>
        <View style={transactionStyles.aiTitleRow}>
          <View style={transactionStyles.aiIconBox}>
            <MaterialCommunityIcons name='chart-box-outline' size={17} color='#1EBAC2' />
          </View>
          <Text style={transactionStyles.aiTitle}>Quản lý chi tiêu</Text>
        </View>
      </View>

      <View style={transactionStyles.aiContent}>
        <View style={transactionStyles.aiChart}>
          {monthStats.months.map((month) => (
            <View key={month.label} style={transactionStyles.aiBarColumn}>
              <View
                style={[
                  transactionStyles.aiBar,
                  { height: month.height, backgroundColor: month.color },
                ]}
              />
              <Text style={transactionStyles.aiMonthLabel}>{month.label}</Text>
            </View>
          ))}
        </View>

        <View style={transactionStyles.aiSummary}>
          <View style={transactionStyles.aiCategoryRow}>
            <MaterialCommunityIcons name={monthStats.icon} size={22} color={monthStats.iconColor} />
            <Text style={transactionStyles.aiCategoryText} numberOfLines={1}>
              Chi tiêu {monthStats.category}
            </Text>
          </View>
          <Text style={transactionStyles.aiDescription}>{monthStats.monthText} của bạn là</Text>
          <Text style={transactionStyles.aiAmount}>{monthStats.amount}</Text>
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
      style={[
        transactionStyles.detailCard,
        isTransfer ? transactionStyles.detailCardDark : transactionStyles.detailCardLight,
      ]}
    >
      <View
        style={[
          transactionStyles.detailCategoryIcon,
          { backgroundColor: isTransfer ? '#EAF7FF' : item.iconBackground },
        ]}
      >
        <MaterialCommunityIcons
          name={isTransfer ? 'swap-horizontal' : item.icon}
          size={28}
          color={isTransfer ? '#31A8D8' : '#FFFFFF'}
        />
      </View>

      <View style={transactionStyles.detailBody}>
        <Text
          style={[transactionStyles.detailNote, isTransfer && transactionStyles.detailTextOnDark]}
          numberOfLines={2}
        >
          {note}
        </Text>
        <Text
          style={[
            transactionStyles.detailDate,
            isTransfer && transactionStyles.detailSecondaryTextOnDark,
          ]}
          numberOfLines={1}
        >
          {time} - {date}
        </Text>
        <View style={transactionStyles.detailCategoryBadge}>
          <Text
            style={[
              transactionStyles.detailCategoryText,
              isTransfer && transactionStyles.detailTextOnDark,
            ]}
            numberOfLines={1}
          >
            {isTransfer ? 'Chuyển tiền ví' : item.title}
          </Text>
        </View>
      </View>

      <View style={transactionStyles.detailSide}>
        <MoneyText
          value={item.detail.amountDisplay}
          mutedColor={item.amountValue < 0 ? '#B3261E99' : '#25B56899'}
          valueStyle={[
            transactionStyles.detailAmount,
            { color: item.amountValue < 0 ? '#B3261E' : '#25B568' },
          ]}
          currencyStyle={transactionStyles.detailAmountCurrency}
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
