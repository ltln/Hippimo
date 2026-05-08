import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
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

import type { LimitItem, LimitPeriod } from '@/shared/contexts/limit-context'

const categoryOptions = [
  { value: 'Ăn uống', label: 'Ăn uống' },
  { value: 'Di chuyển', label: 'Di chuyển' },
  { value: 'Nhà cửa', label: 'Nhà cửa' },
  { value: 'Giải trí', label: 'Giải trí' },
  { value: 'Mua sắm', label: 'Mua sắm' },
  { value: 'Làm đẹp', label: 'Làm đẹp' },
]

const periodOptions = [
  { value: 'weekly', label: 'Hàng tuần' },
  { value: 'monthly', label: 'Hàng tháng' },
]

type LimitFormProps = {
  title: string
  submitLabel: string
  initialValues?: Partial<LimitItem>
  limitId?: string
  onSubmit: (limit: LimitItem) => void
}

export function LimitForm({
  title,
  submitLabel,
  initialValues,
  limitId,
  onSubmit,
}: LimitFormProps) {
  const insets = useSafeAreaInsets()

  const [limitTitle, setLimitTitle] = useState(initialValues?.title || '')
  const [amount, setAmount] = useState(String(initialValues?.amount || '0'))
  const [period, setPeriod] = useState<LimitPeriod>(initialValues?.period || 'weekly')
  const [category, setCategory] = useState(initialValues?.category || 'Ăn uống')
  const [startDate, setStartDate] = useState(
    initialValues?.startDate || new Date().toISOString().split('T')[0],
  )
  const [openDropdown, setOpenDropdown] = useState<null | 'period' | 'category'>(null)

  // Tự động tính ngày kết thúc cho chu kỳ tuần (7 ngày)
  const autoEndDate = useMemo(() => {
    if (period !== 'weekly') return ''
    try {
      const start = new Date(startDate)
      if (isNaN(start.getTime())) return ''
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return end.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }, [startDate, period])

  const handleSave = () => {
    const numericAmount = parseInt(amount, 10)
    if (!limitTitle.trim() || !numericAmount || numericAmount <= 0) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin tên và số tiền hợp lệ')
      return
    }

    const limit: LimitItem = {
      id: limitId || `limit-${Date.now()}`,
      title: limitTitle,
      amount: numericAmount,
      spent: initialValues?.spent || 0,
      period,
      category,
      startDate,
      endDate: period === 'weekly' ? autoEndDate : undefined, // Lưu ngày kết thúc cho chu kỳ tuần
      icon: 'cash-multiple',
    }
    onSubmit(limit)
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name='arrow-back' size={24} color='#0B1D17' />
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Khung 1: Tên & Số tiền */}
        <View style={styles.card}>
          <Text style={styles.label}>THÔNG TIN HẠN MỨC</Text>
          <TextInput
            value={limitTitle}
            onChangeText={setLimitTitle}
            placeholder='Tên hạn mức'
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

        {/* Khung 2: Danh mục áp dụng */}
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

        {/* Khung 3: Chu kỳ & Thời gian */}
        <View style={styles.card}>
          <Text style={styles.label}>CHU KỲ & THỜI GIAN</Text>
          <View style={styles.row}>
            <Pressable style={styles.periodSelector} onPress={() => setOpenDropdown('period')}>
              <Text style={styles.selectorValue}>
                {period === 'weekly' ? 'Hàng tuần' : 'Hàng tháng'}
              </Text>
              <Ionicons name='chevron-down' size={16} color='#FFF' />
            </Pressable>

            <View style={{ width: 10 }} />

            {period === 'weekly' ? (
              <View style={styles.weekInputs}>
                <TextInput
                  value={startDate}
                  onChangeText={setStartDate}
                  style={styles.smallInput}
                  placeholder='Bắt đầu'
                />
                <TextInput
                  value={autoEndDate}
                  editable={false}
                  style={[styles.smallInput, { opacity: 0.6 }]}
                />
              </View>
            ) : (
              <TextInput
                value={startDate.substring(0, 7)}
                onChangeText={(v) => setStartDate(`${v}-01`)}
                style={[styles.input, { flex: 1.5 }]}
                placeholder='YYYY-MM'
              />
            )}
          </View>
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{submitLabel}</Text>
        </Pressable>
      </ScrollView>

      {/* Modal Chọn Chu kỳ */}
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

      {/* Modal Chọn Danh mục*/}
      <SelectionModal
        visible={openDropdown === 'category'}
        title='Chọn danh mục'
        options={categoryOptions}
        onClose={() => setOpenDropdown(null)}
        onSelect={(v: any) => {
          setCategory(v)
          setOpenDropdown(null)
        }}
      />
    </SafeAreaView>
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
              <Text style={styles.modalOptionText}>{o.label}</Text>
              <Ionicons name='chevron-forward' size={16} color='#1B4D39' />
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F1EF' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0B1D17' },
  backButton: { width: 40 },
  card: { backgroundColor: '#198B3F', borderRadius: 16, padding: 16, marginBottom: 16 },
  label: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', marginBottom: 10, opacity: 0.8 },
  input: {
    backgroundColor: '#063629',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  categoryRow: { flexDirection: 'row', gap: 10, alignItems: 'center' }, // Định nghĩa để ô nhập và nút list nằm ngang[cite: 2]
  categoryListButton: {
    backgroundColor: '#063629',
    borderRadius: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  periodSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#063629',
    borderRadius: 10,
    padding: 12,
  },
  selectorValue: { color: '#FFFFFF', fontWeight: '700' },
  weekInputs: { flex: 2, flexDirection: 'row', gap: 6 },
  smallInput: {
    flex: 1,
    backgroundColor: '#063629',
    borderRadius: 10,
    padding: 10,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#072D20',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 },
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
  modalOptionText: { fontSize: 16, fontWeight: '700', color: '#1B4D39' },
})
