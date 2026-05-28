import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  useTransactions,
  type TransactionType,
} from '@/features/transaction/data/transaction-context'
import { useCategories } from '@/features/category/data/use-categories'
import {
  AiInsightCard,
  DetailCard,
  FilterChip,
  TransactionPageTabs,
  type TransactionPageTabKey,
} from '@/features/transaction/presentation/transaction-components'
import { styles } from '@/features/transaction/presentation/transaction.styles'
import { normalizeDateQuery } from '@/features/transaction/utils/transaction-utils'
import { confirmDelete } from '@/shared/utils/confirm-delete'

type TypeFilter = 'all' | TransactionType

const typeOptions: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'expense', label: 'Chi tiêu' },
  { key: 'transfer', label: 'Chuyển ví' },
]

export default function TransactionScreen() {
  const insets = useSafeAreaInsets()
  const { transactions, deleteTransaction } = useTransactions()
  const { categories } = useCategories({ status: 'ACTIVE' })
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateQuery, setDateQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [activePage, setActivePage] = useState<TransactionPageTabKey>('activity')

  const dateAndTypeFilteredTransactions = useMemo(() => {
    const normalizedDateQuery = normalizeDateQuery(dateQuery)

    return transactions.filter((item) => {
      const matchesType = typeFilter === 'all' || item.type === typeFilter
      const matchesDate =
        normalizedDateQuery.length === 0 ||
        item.detail.date.includes(normalizedDateQuery) ||
        item.dateISO.includes(normalizedDateQuery)

      return matchesType && matchesDate
    })
  }, [dateQuery, transactions, typeFilter])

  const categoryOptions = useMemo(() => {
    const categoryNames = categories
      .map((category) => category.name)
      .filter((name, index, names) => name && names.indexOf(name) === index)

    return ['all', ...categoryNames]
  }, [categories])

  useEffect(() => {
    if (!categoryOptions.includes(categoryFilter)) {
      setCategoryFilter('all')
    }
  }, [categoryFilter, categoryOptions])

  const filteredTransactions = useMemo(() => {
    if (categoryFilter === 'all') {
      return dateAndTypeFilteredTransactions
    }

    return dateAndTypeFilteredTransactions.filter((item) => item.title === categoryFilter)
  }, [categoryFilter, dateAndTypeFilteredTransactions])

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 12, 28) }]}>
        <Text style={styles.headerTitle}>GIAO DỊCH</Text>
        <View style={[styles.headerActions, { top: Math.max(insets.top + 12, 28) }]}>
          <Pressable
            onPress={() => setShowFilters((current) => !current)}
            hitSlop={8}
            style={styles.headerIconButton}
          >
            <Ionicons name='search' size={22} color='#081A13' />
          </Pressable>
          <Pressable
            hitSlop={8}
            style={styles.headerIconButton}
            onPress={() => router.push('/add-transaction')}
          >
            <Ionicons name='add' size={26} color='#081A13' />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 92 }]}
        showsVerticalScrollIndicator={false}
      >
        <TransactionPageTabs activeTab={activePage} onTabChange={setActivePage} />

        {activePage === 'activity' ? (
          <>
            {showFilters ? (
              <View style={styles.controlCard}>
                <View style={styles.controlHeader}>
                  <Text style={styles.controlTitle}>Bộ lọc giao dịch</Text>
                </View>

                <Text style={styles.fieldLabel}>Loại giao dịch</Text>
                <View style={styles.chipRow}>
                  {typeOptions.map((option) => (
                    <FilterChip
                      key={option.key}
                      label={option.label}
                      active={typeFilter === option.key}
                      onPress={() => setTypeFilter(option.key)}
                    />
                  ))}
                </View>

                <Text style={[styles.fieldLabel, styles.fieldSpacing]}>
                  Tìm theo ngày, tháng, năm
                </Text>
                <View style={styles.searchField}>
                  <MaterialCommunityIcons name='calendar-month-outline' size={18} color='#245442' />
                  <TextInput
                    value={dateQuery}
                    onChangeText={setDateQuery}
                    placeholder='VD: 07-04-2026, 04-2026 hoặc 2026'
                    placeholderTextColor='#245442'
                    style={styles.searchInput}
                  />
                </View>
              </View>
            ) : null}

            <AiInsightCard transactions={dateAndTypeFilteredTransactions} />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryTabsContent}
              style={styles.categoryTabs}
            >
              {categoryOptions.map((category) => {
                const active = categoryFilter === category
                const label = category === 'all' ? 'Tất cả' : category

                return (
                  <Pressable
                    key={category}
                    style={styles.categoryTab}
                    onPress={() => setCategoryFilter(category)}
                  >
                    <Text style={[styles.categoryTabText, active && styles.categoryTabTextActive]}>
                      {label}
                    </Text>
                    {active ? <View style={styles.categoryTabIndicator} /> : null}
                  </Pressable>
                )
              })}
            </ScrollView>

            {filteredTransactions.map((item) => (
              <DetailCard
                key={item.id}
                item={item}
                onDelete={() => {
                  const id = item.id
                  const title = item.title
                  confirmDelete('Xóa giao dịch', `Bạn có chắc muốn xóa ${title}?`, async () => {
                    try {
                      await deleteTransaction(id)
                    } catch (error) {
                      Alert.alert(
                        'Không xóa được giao dịch',
                        error instanceof Error ? error.message : 'Vui lòng thử lại.',
                      )
                    }
                  })
                }}
              />
            ))}
          </>
        ) : (
          <View style={styles.statisticsContent}>
            <Text style={styles.statisticsText}>Nội dung thống kê</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
