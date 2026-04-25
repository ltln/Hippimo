import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
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

import type { TransactionItem } from '@/shared/contexts/transaction-context'
import {
  buildTransaction,
  categories,
  defaultTransactionFormValues,
  formatCurrencyInput,
  normalizeDate,
  receiveWallets,
  wallets,
  type CreateMode,
  type TransactionFormValues,
} from '@/shared/utils/transaction-form'

type TransactionFormProps = {
  title: string
  submitLabel: string
  initialValues?: TransactionFormValues
  transactionId?: string
  onSubmit: (transaction: TransactionItem) => void
}

export function TransactionForm({
  title,
  submitLabel,
  initialValues = defaultTransactionFormValues,
  transactionId,
  onSubmit,
}: TransactionFormProps) {
  const insets = useSafeAreaInsets()
  const amountInputRef = useRef<TextInput>(null)
  const [mode, setMode] = useState<CreateMode>(initialValues.mode)
  const [amount, setAmount] = useState(initialValues.amount)
  const [amountFocused, setAmountFocused] = useState(false)
  const [note, setNote] = useState(initialValues.note)
  const noteRef = useRef(initialValues.note)
  const [expenseWallet, setExpenseWallet] = useState(initialValues.expenseWallet)
  const [expenseCategory, setExpenseCategory] = useState(initialValues.expenseCategory)
  const [transferFromWallet, setTransferFromWallet] = useState(initialValues.transferFromWallet)
  const [transferToWallet, setTransferToWallet] = useState(initialValues.transferToWallet)
  const [transactionDate, setTransactionDate] = useState(initialValues.transactionDate)
  const [openDropdown, setOpenDropdown] = useState<
    null | 'expenseWallet' | 'expenseCategory' | 'transferFromWallet' | 'transferToWallet'
  >(null)

  const displayAmount = useMemo(() => formatCurrencyInput(amount), [amount])

  useEffect(() => {
    setMode(initialValues.mode)
    setAmount(initialValues.amount)
    setNote(initialValues.note)
    setExpenseWallet(initialValues.expenseWallet)
    setExpenseCategory(initialValues.expenseCategory)
    setTransferFromWallet(initialValues.transferFromWallet)
    setTransferToWallet(initialValues.transferToWallet)
    setTransactionDate(initialValues.transactionDate)
  }, [initialValues])

  useEffect(() => {
    if (!amountFocused) {
      return
    }

    const timeout = setTimeout(() => {
      amountInputRef.current?.focus()
    }, 0)

    return () => clearTimeout(timeout)
  }, [amountFocused])

  const adjustAmount = (delta: number) => {
    const numericAmount = Number.parseInt(amount || '0', 10)
    const nextAmount = Math.max(0, numericAmount + delta)
    setAmount(String(nextAmount))
  }

  const handleReceiptScan = () => {
    Alert.alert(
      'Quét hóa đơn',
      'Phương án tối ưu là chụp hoặc chọn ảnh hóa đơn trước, sau đó OCR để tự điền số tiền, ngày và ghi chú. Cách này nhẹ app hơn, ít lỗi hơn live camera OCR và dễ mở rộng về sau.',
    )
  }

  const handleSave = () => {
    const numericAmount = Number.parseInt(amount || '0', 10)

    if (!numericAmount) {
      Alert.alert('Thiếu số tiền', 'Bạn hãy nhập số tiền trước khi lưu giao dịch.')
      return
    }

    const normalizedDate = normalizeDate(transactionDate)

    if (!normalizedDate) {
      Alert.alert('Ngày chưa hợp lệ', 'Bạn hãy nhập ngày theo dạng dd/mm/yyyy.')
      return
    }

    const transaction = buildTransaction({
      id: transactionId,
      amountValue: numericAmount,
      date: normalizedDate,
      mode,
      note: noteRef.current,
      expenseWallet,
      expenseCategory,
      transferFromWallet,
      transferToWallet,
    })

    onSubmit(transaction)
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 10, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
            <Ionicons name='arrow-back' size={24} color='#0B1D17' />
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Pressable style={styles.card} onPress={handleReceiptScan}>
          <View style={styles.scanIconWrap}>
            <MaterialCommunityIcons name='barcode-scan' size={40} color='#FFFFFF' />
          </View>
          <View style={styles.receiptPill}>
            <Text style={styles.receiptPillText}>Quét hóa đơn</Text>
          </View>
        </Pressable>

        <View style={[styles.card, styles.amountCard]}>
          <View style={styles.amountControls}>
            <Pressable style={styles.amountButton} onPress={() => adjustAmount(-1000)}>
              <Ionicons name='remove' size={22} color='#FF6A5E' />
            </Pressable>

            <Pressable style={styles.amountCenter} onPress={() => setAmountFocused(true)}>
              {amountFocused ? (
                <TextInput
                  ref={amountInputRef}
                  value={amount}
                  onChangeText={(value) => setAmount(value.replace(/[^0-9]/g, ''))}
                  keyboardType='numeric'
                  onFocus={() => setAmountFocused(true)}
                  onBlur={() => setAmountFocused(false)}
                  style={styles.amountInput}
                />
              ) : (
                <Text style={styles.amountDisplay}>{displayAmount}</Text>
              )}
              <Text style={styles.amountCurrency}>VND</Text>
            </Pressable>

            <Pressable style={styles.amountButton} onPress={() => adjustAmount(1000)}>
              <Ionicons name='add' size={22} color='#F6C63D' />
            </Pressable>
          </View>
        </View>

        <View style={styles.segmentRow}>
          <SegmentButton
            label='CHI TIÊU'
            active={mode === 'expense'}
            onPress={() => setMode('expense')}
          />
          <SegmentButton
            label='CHUYỂN TIỀN GIỮA CÁC VÍ'
            active={mode === 'transfer'}
            onPress={() => setMode('transfer')}
          />
        </View>

        {mode === 'expense' ? (
          <View style={styles.card}>
            <View style={styles.choiceGrid}>
              <SelectorBlock
                label='CHỌN VÍ'
                value={expenseWallet}
                onPress={() => setOpenDropdown('expenseWallet')}
              />
              <SelectorBlock
                label='DANH MỤC'
                value={expenseCategory}
                onPress={() => setOpenDropdown('expenseCategory')}
                withDivider
              />
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.choiceGrid}>
              <SelectorBlock
                label='VÍ GỬI'
                value={transferFromWallet}
                onPress={() => setOpenDropdown('transferFromWallet')}
              />
              <SelectorBlock
                label='VÍ NHẬN'
                value={transferToWallet}
                onPress={() => setOpenDropdown('transferToWallet')}
                withDivider
              />
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>NGÀY GIAO DỊCH</Text>
          <View style={styles.dateRow}>
            <View style={styles.datePill}>
              <TextInput
                value={transactionDate}
                onChangeText={setTransactionDate}
                placeholder='dd/mm/yyyy'
                placeholderTextColor='#CFE8DA'
                keyboardType='numbers-and-punctuation'
                style={styles.dateInput}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>GHI CHÚ</Text>
          <TextInput
            defaultValue={initialValues.note}
            onChangeText={(text) => {
              noteRef.current = text
            }}
            placeholder='Nhập ghi chú cho giao dịch'
            placeholderTextColor='#B8CEC3'
            style={styles.noteInput}
            multiline={true}
            submitBehavior='blurAndSubmit'
            autoCorrect={false}
            spellCheck={false}
          />
          <View style={styles.noteHintRow}>
            <MaterialCommunityIcons name='emoticon-excited-outline' size={18} color='#072D20' />
            <Text style={styles.noteHint}>Có vẻ bạn đang chi cho ăn uống ?</Text>
          </View>
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{submitLabel}</Text>
        </Pressable>
      </ScrollView>

      <SelectionModal
        visible={openDropdown === 'expenseWallet'}
        title='Chọn ví'
        options={wallets}
        onClose={() => setOpenDropdown(null)}
        onSelect={(value) => {
          setExpenseWallet(value)
          setOpenDropdown(null)
        }}
      />
      <SelectionModal
        visible={openDropdown === 'expenseCategory'}
        title='Chọn danh mục'
        options={categories}
        onClose={() => setOpenDropdown(null)}
        onSelect={(value) => {
          setExpenseCategory(value)
          setOpenDropdown(null)
        }}
      />
      <SelectionModal
        visible={openDropdown === 'transferFromWallet'}
        title='Chọn ví gửi'
        options={wallets}
        onClose={() => setOpenDropdown(null)}
        onSelect={(value) => {
          setTransferFromWallet(value)
          setOpenDropdown(null)
        }}
      />
      <SelectionModal
        visible={openDropdown === 'transferToWallet'}
        title='Chọn ví nhận'
        options={receiveWallets}
        onClose={() => setOpenDropdown(null)}
        onSelect={(value) => {
          setTransferToWallet(value)
          setOpenDropdown(null)
        }}
      />
    </SafeAreaView>
  )
}

function SegmentButton({
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
      style={[styles.segmentButton, active && styles.segmentButtonActive]}
    >
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
    </Pressable>
  )
}

function SelectorBlock({
  label,
  value,
  onPress,
  withDivider = false,
}: {
  label: string
  value: string
  onPress: () => void
  withDivider?: boolean
}) {
  return (
    <View style={[styles.selectorBlock, withDivider && styles.selectorBlockDivider]}>
      <Text style={styles.selectorTitle}>{label}</Text>
      <Pressable style={styles.selectorPill} onPress={onPress}>
        <Text style={styles.selectorValue}>{value}</Text>
        <Ionicons name='chevron-down' size={16} color='#E6FFF2' />
      </Pressable>
    </View>
  )
}

function SelectionModal({
  visible,
  title,
  options,
  onClose,
  onSelect,
}: {
  visible: boolean
  title: string
  options: string[]
  onClose: () => void
  onSelect: (value: string) => void
}) {
  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map((option) => (
            <Pressable key={option} style={styles.modalOption} onPress={() => onSelect(option)}>
              <Text style={styles.modalOptionText}>{option}</Text>
              <Ionicons name='chevron-forward' size={16} color='#1B4D39' />
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EF',
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: {
    width: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
    color: '#0B1D17',
    letterSpacing: 0.4,
  },
  headerSpacer: {
    width: 36,
  },
  card: {
    backgroundColor: '#198B3F',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  scanIconWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptPill: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 8,
  },
  receiptPillText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0A1D16',
  },
  amountCard: {
    paddingVertical: 18,
  },
  amountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#083B2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0E5A40',
  },
  amountCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInput: {
    minWidth: 170,
    fontSize: 25,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    paddingVertical: 0,
    textAlign: 'center',
  },
  amountDisplay: {
    fontSize: 25,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  amountCurrency: {
    marginTop: 2,
    fontSize: 15,
    color: '#E8FFF0',
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  segmentButton: {
    borderRadius: 999,
    backgroundColor: '#7F9B90',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#050505',
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F6FFFA',
  },
  segmentLabelActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F6FFF9',
    marginBottom: 12,
    textAlign: 'center',
  },
  choiceGrid: {
    flexDirection: 'row',
  },
  selectorBlock: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  selectorBlockDivider: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.35)',
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  selectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#063629',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  selectorValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePill: {
    backgroundColor: '#063629',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  dateInput: {
    minWidth: 160,
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingVertical: 0,
  },
  noteInput: {
    backgroundColor: '#F2F5F2',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: '#072D20',
  },
  noteHintRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteHint: {
    fontSize: 12,
    fontWeight: '700',
    color: '#072D20',
  },
  saveButton: {
    backgroundColor: '#072D20',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#F4F1EF',
    borderRadius: 18,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0B1D17',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B4D39',
  },
})
