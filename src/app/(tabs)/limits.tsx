import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { useLimits, type LimitItem, type LimitPeriod } from '@/shared/contexts/limit-context'

// Cập nhật Filter chỉ còn 'all', 'weekly', 'monthly'[cite: 1, 5]
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
              {/* Chỉ hiển thị bộ lọc cho Tuần và Tháng */}
              {['all', 'weekly', 'monthly'].map((p) => (
                <Pressable
                  key={p}
                  style={[styles.chip, periodFilter === p && styles.chipActive]}
                  onPress={() => setPeriodFilter(p as PeriodFilter)}
                >
                  <Text style={[styles.chipText, periodFilter === p && styles.chipTextActive]}>
                    {p === 'all' ? 'Tất cả' : p === 'weekly' ? 'Tuần' : 'Tháng'}
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
              Alert.alert('Xóa hạn mức', `Bạn có chắc muốn xóa ${limit.title}?`, [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Xóa', style: 'destructive', onPress: () => deleteLimit(limit.id) },
              ])
            }}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function LimitCard({ limit, onDelete }: { limit: LimitItem; onDelete: () => void }) {
  const percent = Math.min(1, limit.spent / limit.amount)
  const isOver = limit.spent > limit.amount

  // Hàm định dạng hiển thị thời gian thay cho "Tất cả ví"
  const renderPeriodInfo = () => {
    if (limit.period === 'weekly' && limit.startDate && limit.endDate) {
      const start = new Date(limit.startDate).toLocaleDateString('vi-VN')
      const end = new Date(limit.endDate).toLocaleDateString('vi-VN')
      return `${start} - ${end}`
    } else if (limit.period === 'monthly' && limit.startDate) {
      const date = new Date(limit.startDate)
      return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`
    }
    return ''
  }

  return (
    <View style={styles.limitCard}>
      <View style={styles.limitHeader}>
        <View style={styles.limitIconBg}>
          <MaterialCommunityIcons name={limit.icon as any} size={24} color='#FFFFFF' />
        </View>
        <View style={styles.limitTitleArea}>
          <Text style={styles.limitTitle}>{limit.title}</Text>
          {/* Cập nhật hiển thị: Danh mục • Khoảng thời gian[cite: 5] */}
          <Text style={styles.limitSub}>
            {limit.category || 'Tất cả danh mục'} • {renderPeriodInfo()}
          </Text>
        </View>
        <View style={styles.limitActions}>
          <Pressable
            onPress={() => router.push({ pathname: '/edit-limit', params: { id: limit.id } })}
          >
            <MaterialCommunityIcons name='pencil-outline' size={20} color='#0B1D17' />
          </Pressable>
          <Pressable onPress={onDelete}>
            <MaterialCommunityIcons name='trash-can-outline' size={20} color='#FF5252' />
          </Pressable>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${percent * 100}%`, backgroundColor: isOver ? '#FF5252' : '#179041' },
            ]}
          />
        </View>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressText}>
            Đã dùng:{' '}
            <Text style={{ fontWeight: '800' }}>
              {new Intl.NumberFormat('vi-VN').format(limit.spent)}đ
            </Text>
          </Text>
          <Text style={styles.progressText}>
            Hạn mức:{' '}
            <Text style={{ fontWeight: '800' }}>
              {new Intl.NumberFormat('vi-VN').format(limit.amount)}đ
            </Text>
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F1EF' },
  content: { paddingHorizontal: 16, paddingBottom: 30 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 22,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 24, fontWeight: '900', color: '#081A13' },
  headerActions: { position: 'absolute', right: 0, flexDirection: 'row', gap: 12 },
  headerIconButton: { padding: 4 },
  controlCard: { backgroundColor: '#E7E0D9', borderRadius: 16, padding: 16, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#23473A', marginBottom: 10 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F7F3EF' },
  chipActive: { backgroundColor: '#0A3A2A' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#164634' },
  chipTextActive: { color: '#FFFFFF' },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7F3EF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0B2C20' },
  limitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  limitHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  limitIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#198B3F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitTitleArea: { flex: 1, marginLeft: 12 },
  limitTitle: { fontSize: 16, fontWeight: '800', color: '#0B1D17' },
  limitSub: { fontSize: 12, color: '#666', marginTop: 2 },
  limitActions: { flexDirection: 'row', gap: 12 },
  progressContainer: { marginTop: 4 },
  progressBarBg: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressText: { fontSize: 12, color: '#444' },
})
