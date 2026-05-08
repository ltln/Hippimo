import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { LimitCard } from '@/features/limit/presentation/limits-components'
import { styles } from '@/features/limit/presentation/limits.styles'
import { confirmDelete } from '@/features/limit/utils/limit-utils'
import { useLimits, type LimitPeriod } from '@/shared/contexts/limit-context'

// Cập nhật Filter chỉ còn 'all', 'weekly', 'monthly'
type PeriodFilter = 'all' | LimitPeriod

export default function LimitsScreen() {
  const insets = useSafeAreaInsets()
  const { limits, deleteLimit } = useLimits()

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filteredLimits = useMemo(() => {
    return limits.filter((limit) => {
      const matchesPeriod = periodFilter === 'all' || limit.period === periodFilter
      const matchesSearch =
        limit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        limit.category?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesPeriod && matchesSearch
    })
  }, [limits, periodFilter, searchQuery])

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 12, 28) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>HẠN MỨC</Text>
          <View style={styles.headerActions}>
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
              onPress={() => router.push('/add-limit')}
            >
              <Ionicons name='add' size={26} color='#081A13' />
            </Pressable>
          </View>
        </View>

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
              <Ionicons name='search' size={18} color='#49685B' />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder='VD: Ăn uống, Xăng...'
                placeholderTextColor='#7C9086'
                style={styles.searchInput}
              />
            </View>
          </View>
        )}

        {filteredLimits.map((limit) => (
          <LimitCard
            key={limit.id}
            limit={limit}
            onDelete={() => {
              const id = limit.id
              const title = limit.title
              confirmDelete(`Bạn có chắc muốn xóa ${title}?`, () => deleteLimit(id))
            }}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
