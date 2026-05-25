import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { BudgetCard } from '@/features/budget/presentation/budgets-components'
import { styles } from '@/features/budget/presentation/budgets.styles'
import { useBudgets, type BudgetPeriod } from '@/shared/contexts/budget-context'
import { confirmDelete } from '@/shared/utils/confirm-delete'

type PeriodFilter = 'all' | BudgetPeriod

export default function BudgetsScreen() {
  const insets = useSafeAreaInsets()
  const { budgets, deleteBudget } = useBudgets()

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filteredBudgets = useMemo(() => {
    return budgets.filter((budget) => {
      const matchesPeriod = periodFilter === 'all' || budget.period === periodFilter
      const matchesSearch =
        budget.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        budget.category?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesPeriod && matchesSearch
    })
  }, [budgets, periodFilter, searchQuery])

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 12, 28) }]}>
        <Text style={styles.headerTitle}>NGÂN SÁCH</Text>
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
            onPress={() => router.push('/add-budget')}
          >
            <Ionicons name='add' size={26} color='#081A13' />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 92 }]}
        showsVerticalScrollIndicator={false}
      >
        {showFilters && (
          <View style={styles.controlCard}>
            <Text style={styles.fieldLabel}>Chu kỳ</Text>
            <View style={styles.chipRow}>
              {['all', 'weekly', 'monthly'].map((period) => (
                <Pressable
                  key={period}
                  style={[styles.chip, periodFilter === period && styles.chipActive]}
                  onPress={() => setPeriodFilter(period as PeriodFilter)}
                >
                  <Text style={[styles.chipText, periodFilter === period && styles.chipTextActive]}>
                    {period === 'all' ? 'Tất cả' : period === 'weekly' ? 'Tuần' : 'Tháng'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 15 }]}>Tìm kiếm tên hoặc danh mục</Text>
            <View style={styles.searchField}>
              <Ionicons name='search' size={18} color='#245442' />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder='VD: Ăn uống, Xăng...'
                placeholderTextColor='#245442'
                style={styles.searchInput}
              />
            </View>
          </View>
        )}

        {filteredBudgets.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            onDelete={() => {
              const id = budget.id
              const title = budget.title
              confirmDelete('Xóa ngân sách', `Bạn có chắc muốn xóa ${title}?`, () =>
                deleteBudget(id),
              )
            }}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
