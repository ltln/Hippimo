import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTransactions, type TransactionType } from '@/shared/contexts/transaction-context'

type TypeFilter = 'all' | TransactionType

const typeOptions: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'expense', label: 'Chi tiêu' },
  { key: 'transfer', label: 'Chuyển ví' },
]

export default function TransactionScreen() {
  const insets = useSafeAreaInsets()
  const { transactions } = useTransactions()
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
          <Text style={styles.headerTitle}>CHI TIẾT GIAO DỊCH</Text>
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
          <DetailCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function FilterChip({
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

function DetailCard({
  item,
}: {
  item: ReturnType<typeof useTransactions>['transactions'][number]
}) {
  const isTransfer = item.type === 'transfer'
  const transferWallets = getTransferWallets(item)

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
      </View>

      {isTransfer ? (
        <View style={styles.transferCardBody}>
          <Text style={[styles.transferAmount, { color: item.detail.amountColor }]}>
            {item.detail.amountDisplay}
          </Text>

          <View style={styles.transferIconsCentered}>
            <View style={styles.transferPill}>
              <MaterialCommunityIcons name='bank-outline' size={18} color='#0B1D17' />
              <Text style={styles.transferPillText}>{transferWallets.fromWallet}</Text>
            </View>
            <Ionicons name='arrow-forward' size={18} color='#FFFFFF' />
            <View style={styles.transferPill}>
              <MaterialCommunityIcons name='piggy-bank-outline' size={18} color='#0B1D17' />
              <Text style={styles.transferPillText}>{transferWallets.toWallet}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.detailTop}>
          <Text style={[styles.detailAmount, { color: item.detail.amountColor }]}>
            {item.detail.amountDisplay}
          </Text>

          <View style={[styles.detailIconWrap, styles.detailIconWrapDark]}>
            <View style={styles.detailRoundIcon}>
              <MaterialCommunityIcons name={item.icon} size={24} color='#D4F8E6' />
            </View>
            <Text style={styles.detailFooterTitle}>{item.detail.footer}</Text>
          </View>
        </View>
      )}

     {/* HIỂN THỊ THÔNG TIN GIAO DỊCH */}
      <View style={styles.detailInfo}>
        <DetailLine icon='calendar-outline' text={item.detail.date} />
        
        {/* Nếu là Chi tiêu -> Hiển thị thêm Tên ví trước */}
        {!isTransfer && item.detail.tags[0] && (
          <DetailLine icon='wallet-outline' text={item.detail.tags[0]} />
        )}

        {/* Ghi chú luôn xuất hiện chung 1 format cho CẢ 2 loại giao dịch */}
        <DetailLine 
          icon='chatbox-ellipses-outline' 
          text={item.detail.note || 'Không có ghi chú'} 
        />
      </View>

      {/* HIỂN THỊ GỢI Ý AI */}
      <View style={styles.tipRow}>
        <View style={styles.tipBadge}>
          <Text style={styles.tipBadgeText}>A</Text>
        </View>
        <Text style={styles.tipText}>
          {/* Lấy đúng nội dung AI, không lấy nhầm vào note nữa */}
          {(item.detail as any).aiSuggestion || 'Đang phân tích giao dịch...'}
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

function normalizeDateQuery(value: string) {
  return value.trim().replaceAll('/', '-')
}

function getTransferWallets(item: ReturnType<typeof useTransactions>['transactions'][number]) {
  const transferTag = item.detail.tags[0] ?? ''
  const [fromWallet, toWallet] = transferTag.split('->').map((value) => value.trim())

  return {
    fromWallet: fromWallet || item.detail.footer,
    toWallet: toWallet || 'TIẾT KIỆM',
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EF',
  },
  content: {
    paddingHorizontal: 10,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  headerTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '900',
    color: '#081A13',
    letterSpacing: 0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 12,
  },
  headerIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlCard: {
    backgroundColor: '#E7E0D9',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B2C20',
    textAlign: 'center',
  },
  fieldLabel: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '700',
    color: '#23473A',
  },
  fieldSpacing: {
    marginTop: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#F7F3EF',
  },
  chipActive: {
    backgroundColor: '#0A3A2A',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#164634',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  searchField: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7F3EF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0B2C20',
    paddingVertical: 0,
  },
  detailCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    marginBottom: 16,
  },
  detailCardLight: {
    backgroundColor: '#179041',
  },
  detailCardDark: {
    backgroundColor: '#08251A',
  },
  detailActions: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  editButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  detailAmount: {
    flex: 1,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
  },
  detailIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '54%',
  },
  detailIconWrapDark: {
    gap: 6,
  },
  detailRoundIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A4D2E',
  },
  detailFooterTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  transferCardBody: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  transferAmount: {
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    textAlign: 'center',
  },
  transferIconsCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  transferPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F6F2ED',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  transferPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B1D17',
  },
  detailInfo: {
    marginTop: 12,
    gap: 7,
  },
  detailLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  detailLineText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
  },
  tipBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E7FFF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  tipBadgeText: {
    color: '#E7FFF0',
    fontSize: 10,
    fontWeight: '900',
  },
  tipText: {
    flex: 1,
    color: '#ECFFF5',
    fontSize: 10,
    fontStyle: 'italic',
    lineHeight: 14,
  },
})
