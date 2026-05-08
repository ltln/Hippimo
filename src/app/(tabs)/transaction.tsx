import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  useTransactions,
  type TransactionType,
} from '@/features/transaction/data/transaction-context'
import { DetailCard, FilterChip } from '@/features/transaction/presentation/transaction-components'
import { styles } from '@/features/transaction/presentation/transaction.styles'
import { confirmDelete, normalizeDateQuery } from '@/features/transaction/utils/transaction-utils'
import { useWallets } from '@/features/wallet/data/wallet-context'

type TypeFilter = 'all' | TransactionType

const typeOptions: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'expense', label: 'Chi tiêu' },
  { key: 'transfer', label: 'Chuyển ví' },
]

export default function TransactionScreen() {
  const insets = useSafeAreaInsets()
  const { transactions, deleteTransaction } = useTransactions()
  const { wallets } = useWallets()
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [dateQuery, setDateQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filteredTransactions = useMemo(() => {
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 12, 28) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>GIAO DỊCH</Text>
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
              onPress={() => router.push('/add-transaction')}
            >
              <Ionicons name='add' size={26} color='#081A13' />
            </Pressable>
          </View>
        </View>

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

            <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Tìm theo ngày, tháng, năm</Text>
            <View style={styles.searchField}>
              <MaterialCommunityIcons name='calendar-month-outline' size={18} color='#49685B' />
              <TextInput
                value={dateQuery}
                onChangeText={setDateQuery}
                placeholder='VD: 07-04-2026, 04-2026 hoặc 2026'
                placeholderTextColor='#7C9086'
                style={styles.searchInput}
              />
            </View>
          </View>
        ) : null}

        {filteredTransactions.map((item) => (
          <DetailCard
            key={item.id}
            item={item}
            wallets={wallets}
            // ✅ FIX: Capture id rõ ràng tránh stale closure, dùng setTimeout
            // để tránh Alert bị nuốt bởi ScrollView gesture handler
            onDelete={() => {
              const id = item.id
              const title = item.title
              confirmDelete(`Bạn có chắc muốn xóa ${title}?`, () => deleteTransaction(id))
            }}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
