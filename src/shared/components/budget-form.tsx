import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { Typography } from '@/config/constants/theme'
import { mapCategoriesToOptions, useCategories } from '@/features/category/data/use-categories'
import { useAuth } from '@/features/auth/data/auth-context'
import {
  getCategoryColor,
  getCategoryIcon,
  normalizeDate,
} from '@/features/transaction/utils/transaction-form'
import type { BudgetItem, BudgetPeriod } from '@/shared/contexts/budget-context'

const periodOptions = [
  { value: 'weekly', label: 'Tuần' },
  { value: 'monthly', label: 'Tháng' },
]

const buildDefaultTitle = (categoryName: string, period: BudgetPeriod) => {
  if (period === 'weekly') return `${categoryName} hàng tuần`
  return `${categoryName} hàng tháng`
}

const isValidDateOnly = (value: string) => {
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

const normalizeBudgetStartDate = (value: string, period: BudgetPeriod) => {
  const trimmed = value.trim()
  if (!trimmed) return null

  const normalized = normalizeDate(trimmed)
  if (normalized) {
    if (period === 'monthly') return `${normalized.iso.slice(0, 7)}-01`
    return normalized.iso
  }

  const match = /^([0-9]{4})-([0-9]{2})(?:-([0-9]{2}))?$/.exec(trimmed)
  if (!match) return null

  const year = match[1]
  const month = match[2]
  const day = match[3] ?? ''
  if (period === 'weekly') {
    if (!day) return null
    const iso = `${year}-${month}-${day}`
    return isValidDateOnly(iso) ? iso : null
  }

  const iso = `${year}-${month}-01`
  return isValidDateOnly(iso) ? iso : null
}

const buildWeekEndDate = (start: string) => {
  const date = new Date(start)
  if (Number.isNaN(date.getTime())) return ''
  const end = new Date(date)
  end.setDate(date.getDate() + 6)
  return end.toISOString().split('T')[0]
}

const padDatePart = (value: number) => String(value).padStart(2, '0')

const getDateParts = (value: string) => {
  const normalized =
    normalizeBudgetStartDate(value, 'weekly') ?? new Date().toISOString().split('T')[0]
  const [year, month, day] = normalized.split('-').map(Number)

  return { year, month, day }
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate()

const buildStartDate = (year: number, month: number, day: number) => {
  const maxDay = getDaysInMonth(year, month)
  const safeDay = Math.min(day, maxDay)
  return `${year}-${padDatePart(month)}-${padDatePart(safeDay)}`
}

const formatBudgetDate = (value: string, period: BudgetPeriod) => {
  const { year, month, day } = getDateParts(value)
  if (period === 'weekly') return `${padDatePart(day)}/${padDatePart(month)}/${year}`
  return `Tháng ${padDatePart(month)}/${year}`
}

const monthLabels = Array.from({ length: 12 }, (_, index) => `Tháng ${padDatePart(index + 1)}`)
const weekDayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

type BudgetFormProps = {
  title: string
  submitLabel: string
  initialValues?: Partial<BudgetItem>
  budgetId?: string
  onSubmit: (budget: BudgetItem) => Promise<void> | void
}

export function BudgetForm({
  title,
  submitLabel,
  initialValues,
  budgetId,
  onSubmit,
}: BudgetFormProps) {
  const insets = useSafeAreaInsets()
  const { authResponse } = useAuth()
  const accessToken = authResponse?.tokens.accessToken
  const {
    categories,
    isLoading: isLoadingCategories,
    refresh,
  } = useCategories({
    type: 'EXPENSE',
    status: 'ACTIVE',
  })

  const [budgetTitle, setBudgetTitle] = useState(initialValues?.title || '')
  const [amount, setAmount] = useState(String(initialValues?.amount || '0'))
  const [period, setPeriod] = useState<BudgetPeriod>(initialValues?.period || 'weekly')
  const [category, setCategory] = useState(initialValues?.category || '')
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialValues?.categoryId)
  const [startDate, setStartDate] = useState(
    initialValues?.startDate || new Date().toISOString().split('T')[0],
  )
  const [openDropdown, setOpenDropdown] = useState<null | 'period' | 'category'>(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categoryOptions = useMemo(() => mapCategoriesToOptions(categories), [categories])

  const selectedCategory = useMemo(() => {
    if (!categoryOptions.length) {
      return undefined
    }

    return (
      categoryOptions.find((option) => option.id && option.id === selectedCategoryId) ??
      categoryOptions.find((option) => option.value === category) ??
      categoryOptions[0]
    )
  }, [category, categoryOptions, selectedCategoryId])

  useEffect(() => {
    if (!initialValues?.category && categoryOptions.length) {
      const hasCategory = categoryOptions.some((option) => option.value === category)
      if (!hasCategory) {
        setCategory(categoryOptions[0].value)
        setSelectedCategoryId(categoryOptions[0].id || undefined)
      }
    }
  }, [category, categoryOptions, initialValues?.category])

  useEffect(() => {
    if (!selectedCategory) {
      return
    }

    if (selectedCategory.value !== category) {
      setCategory(selectedCategory.value)
    }
    if (selectedCategory.id && selectedCategory.id !== selectedCategoryId) {
      setSelectedCategoryId(selectedCategory.id)
    }
  }, [category, selectedCategory, selectedCategoryId])

  const autoEndDate = useMemo(() => {
    if (period !== 'weekly') return ''
    const normalizedStart = normalizeBudgetStartDate(startDate, period)
    if (!normalizedStart) return ''
    return buildWeekEndDate(normalizedStart)
  }, [startDate, period])

  const handleSave = async () => {
    if (isSubmitting) {
      return
    }

    setFormError(null)

    if (!budgetTitle.trim()) {
      const message = 'Vui lòng nhập tên ngân sách'
      setFormError(message)
      Alert.alert('Thông báo', message)
      return
    }

    const numericAmount = parseInt(amount, 10)
    if (!numericAmount || numericAmount <= 0) {
      const message = 'Vui lòng nhập số tiền hợp lệ'
      setFormError(message)
      Alert.alert('Thông báo', message)
      return
    }

    const normalizedStartDate = normalizeBudgetStartDate(startDate, period)
    if (!normalizedStartDate) {
      const message = 'Ngày bắt đầu chưa hợp lệ. Dạng hợp lệ: dd/mm/yyyy hoặc yyyy-mm-dd.'
      setFormError(message)
      Alert.alert('Thông báo', message)
      return
    }

    let resolvedCategoryId =
      selectedCategoryId ||
      selectedCategory?.id ||
      categories.find((item) => item.name === category)?.categoryId ||
      initialValues?.categoryId

    if (accessToken && !resolvedCategoryId && refresh) {
      try {
        const refreshedCategories = await refresh()
        let refreshedCategory =
          refreshedCategories.find((item) => item.name === category) ?? refreshedCategories[0]

        if (refreshedCategory) {
          setCategory(refreshedCategory.name)
          setSelectedCategoryId(refreshedCategory.categoryId)
        }

        resolvedCategoryId =
          selectedCategoryId ||
          selectedCategory?.id ||
          refreshedCategory?.categoryId ||
          initialValues?.categoryId
      } catch (error) {
        console.error('Refresh categories before saving budget failed', error)
      }
    }

    if (accessToken && !resolvedCategoryId) {
      const message = 'Vui lòng chọn danh mục hợp lệ trước khi lưu ngân sách'
      setFormError(message)
      Alert.alert('Thông báo', message)
      return
    }

    const resolvedIcon =
      (selectedCategory?.icon as BudgetItem['icon'] | undefined) ?? getCategoryIcon(category)
    const resolvedColor = selectedCategory?.color ?? getCategoryColor(category)
    const resolvedTitle = budgetTitle.trim() || buildDefaultTitle(category, period)
    const resolvedEndDate = period === 'weekly' ? buildWeekEndDate(normalizedStartDate) : undefined

    const budget: BudgetItem = {
      id: budgetId || `budget-${Date.now()}`,
      title: resolvedTitle,
      amount: numericAmount,
      spent: initialValues?.spent || 0,
      period,
      category,
      categoryId: resolvedCategoryId,
      startDate: normalizedStartDate,
      endDate: resolvedEndDate,
      icon: resolvedIcon,
      iconColor: resolvedColor,
    }
    try {
      setIsSubmitting(true)
      await onSubmit(budget)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Vui lòng thử lại sau.'
      setFormError(message)
      Alert.alert('Không thể lưu ngân sách', message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name='arrow-back' size={24} color='#0B1D17' />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
            {title}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>THÔNG TIN NGÂN SÁCH</Text>
          <TextInput
            value={budgetTitle}
            onChangeText={setBudgetTitle}
            placeholder='Tên ngân sách'
            placeholderTextColor='rgba(255,255,255,0.4)'
            style={styles.input}
          />
          <View style={{ height: 12 }} />
          <TextInput
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
            keyboardType='numeric'
            placeholder='Số tiền (VND)'
            placeholderTextColor='rgba(255,255,255,0.4)'
            style={styles.input}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>DANH MỤC ÁP DỤNG</Text>
          <View style={styles.categoryRow}>
            <TextInput value={category} editable={false} style={[styles.input, { flex: 1 }]} />
            <Pressable
              style={styles.categoryListButton}
              onPress={() => setOpenDropdown('category')}
            >
              <Ionicons name='list' size={22} color='#FFFFFF' />
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>CHU KỲ & THỜI GIAN</Text>
          <View style={styles.row}>
            <Pressable style={styles.periodSelector} onPress={() => setOpenDropdown('period')}>
              <Text style={styles.selectorValue}>{period === 'weekly' ? 'Tuần' : 'Tháng'}</Text>
              <Ionicons name='chevron-down' size={16} color='#FFF' />
            </Pressable>

            <View style={styles.dateDisplayGroup}>
              <Text style={styles.dateDisplayText}>{formatBudgetDate(startDate, period)}</Text>
              {period === 'weekly' ? (
                <Text style={styles.endDateText}>Đến {autoEndDate}</Text>
              ) : null}
            </View>

            <Pressable style={styles.calendarButton} onPress={() => setIsCalendarOpen(true)}>
              <Ionicons name='calendar-outline' size={22} color='#FFFFFF' />
            </Pressable>
          </View>
        </View>

        {formError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        ) : null}

        <Pressable
          disabled={Boolean(isSubmitting || (accessToken && isLoadingCategories))}
          style={[
            styles.saveButton,
            isSubmitting || (accessToken && isLoadingCategories) ? { opacity: 0.6 } : null,
          ]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>{isSubmitting ? 'ĐANG LƯU...' : submitLabel}</Text>
        </Pressable>
      </ScrollView>

      <SelectionModal
        visible={openDropdown === 'period'}
        title='Chọn chu kỳ'
        options={periodOptions}
        onClose={() => setOpenDropdown(null)}
        onSelect={(v: any) => {
          setPeriod(v)
          setOpenDropdown(null)
        }}
      />

      <SelectionModal
        visible={openDropdown === 'category'}
        title='Chọn danh mục'
        options={categoryOptions}
        onClose={() => setOpenDropdown(null)}
        onSelect={(v: any) => {
          const selectedOption = categoryOptions.find((option) => option.value === v)
          setCategory(selectedOption?.value ?? v)
          setSelectedCategoryId(selectedOption?.id || undefined)
          setOpenDropdown(null)
        }}
      />

      <BudgetCalendarModal
        visible={isCalendarOpen}
        period={period}
        selectedDate={startDate}
        onClose={() => setIsCalendarOpen(false)}
        onSelect={(date) => {
          setStartDate(date)
          setIsCalendarOpen(false)
        }}
      />
    </SafeAreaView>
  )
}

function BudgetCalendarModal({
  visible,
  period,
  selectedDate,
  onClose,
  onSelect,
}: {
  visible: boolean
  period: BudgetPeriod
  selectedDate: string
  onClose: () => void
  onSelect: (date: string) => void
}) {
  const selectedParts = getDateParts(selectedDate)
  const [viewYear, setViewYear] = useState(selectedParts.year)
  const [viewMonth, setViewMonth] = useState(selectedParts.month)

  useEffect(() => {
    if (!visible) return
    const nextParts = getDateParts(selectedDate)
    setViewYear(nextParts.year)
    setViewMonth(nextParts.month)
  }, [selectedDate, visible])

  const moveMonth = (offset: number) => {
    const nextDate = new Date(viewYear, viewMonth - 1 + offset, 1)
    setViewYear(nextDate.getFullYear())
    setViewMonth(nextDate.getMonth() + 1)
  }

  const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay()
  const leadingBlankDays = firstDay === 0 ? 6 : firstDay - 1
  const dayCells: { key: string; day?: number }[] = [
    ...Array.from({ length: leadingBlankDays }, (_, index) => ({ key: `empty-${index}` })),
    ...Array.from({ length: getDaysInMonth(viewYear, viewMonth) }, (_, index) => ({
      key: `day-${index + 1}`,
      day: index + 1,
    })),
  ]
  return (
    <Modal visible={visible} transparent animationType='fade'>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable
              style={styles.calendarNavButton}
              onPress={() => (period === 'weekly' ? moveMonth(-1) : setViewYear(viewYear - 1))}
            >
              <Ionicons name='chevron-back' size={20} color='#0B1D17' />
            </Pressable>
            <Text style={styles.calendarTitle}>
              {period === 'weekly' ? `Tháng ${padDatePart(viewMonth)}/${viewYear}` : viewYear}
            </Text>
            <Pressable
              style={styles.calendarNavButton}
              onPress={() => (period === 'weekly' ? moveMonth(1) : setViewYear(viewYear + 1))}
            >
              <Ionicons name='chevron-forward' size={20} color='#0B1D17' />
            </Pressable>
          </View>

          {period === 'weekly' ? (
            <>
              <View style={styles.weekDayRow}>
                {weekDayLabels.map((label) => (
                  <Text key={label} style={styles.weekDayText}>
                    {label}
                  </Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {dayCells.map((cell) =>
                  typeof cell.day === 'number' ? (
                    <Pressable
                      key={cell.key}
                      style={[
                        styles.dayCell,
                        cell.day === selectedParts.day &&
                        viewMonth === selectedParts.month &&
                        viewYear === selectedParts.year
                          ? styles.calendarCellActive
                          : null,
                      ]}
                      onPress={() => onSelect(buildStartDate(viewYear, viewMonth, cell.day ?? 1))}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          cell.day === selectedParts.day &&
                          viewMonth === selectedParts.month &&
                          viewYear === selectedParts.year
                            ? styles.calendarCellTextActive
                            : null,
                        ]}
                      >
                        {cell.day}
                      </Text>
                    </Pressable>
                  ) : (
                    <View key={cell.key} style={styles.dayCell} />
                  ),
                )}
              </View>
            </>
          ) : (
            <View style={styles.monthGrid}>
              {monthLabels.map((label, index) => {
                const month = index + 1
                const isActive = month === selectedParts.month && viewYear === selectedParts.year
                return (
                  <Pressable
                    key={label}
                    style={[styles.monthCell, isActive ? styles.calendarCellActive : null]}
                    onPress={() => onSelect(buildStartDate(viewYear, month, 1))}
                  >
                    <Text
                      style={[
                        styles.monthCellText,
                        isActive ? styles.calendarCellTextActive : null,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function SelectionModal({ visible, title, options, onClose, onSelect }: any) {
  return (
    <Modal visible={visible} transparent animationType='fade'>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map((o: any) => (
            <Pressable key={o.value} style={styles.modalOption} onPress={() => onSelect(o.value)}>
              <View style={styles.modalOptionContent}>
                {o.icon || o.color ? (
                  <View style={[styles.modalOptionIcon, { backgroundColor: o.color ?? '#12392C' }]}>
                    {o.icon ? (
                      <MaterialCommunityIcons name={o.icon} size={16} color='#FFFFFF' />
                    ) : null}
                  </View>
                ) : null}
                <Text style={styles.modalOptionText}>{o.label}</Text>
              </View>
              <Ionicons name='chevron-forward' size={16} color='#12392C' />
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FBF5' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.screenHeaderFontSize,
    fontWeight: '900',
    color: '#0B1D17',
  },
  backButton: { width: 40 },
  card: { backgroundColor: '#79C77C', borderRadius: 16, padding: 16, marginBottom: 16 },
  label: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', marginBottom: 10, opacity: 0.8 },
  input: {
    backgroundColor: '#12392C',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  categoryRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  categoryListButton: {
    backgroundColor: '#12392C',
    borderRadius: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  periodSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#12392C',
    borderRadius: 10,
    padding: 12,
  },
  selectorValue: { color: '#FFFFFF', fontWeight: '700' },
  dateDisplayGroup: {
    flex: 1.5,
    minHeight: 44,
    backgroundColor: '#12392C',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    justifyContent: 'center',
  },
  dateDisplayText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  calendarButton: {
    width: 44,
    height: 44,
    backgroundColor: '#12392C',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endDateText: {
    color: '#E9F8E2',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  smallInput: {
    flex: 1,
    backgroundColor: '#12392C',
    borderRadius: 10,
    padding: 10,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#12392C',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  errorCard: {
    backgroundColor: '#FFE7E7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: '#8A1C1C', fontSize: 13, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0B1D17',
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DDF2D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    color: '#245442',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  dayCellText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B1D17',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthCell: {
    width: '31%',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#DDF2D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B1D17',
  },
  calendarCellActive: {
    backgroundColor: '#79C77C',
  },
  calendarCellTextActive: {
    color: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0B1D17',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalOptionIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionText: { fontSize: 16, fontWeight: '700', color: '#12392C' },
})
