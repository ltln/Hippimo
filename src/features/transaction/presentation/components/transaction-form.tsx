import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
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
import type { TransactionItem } from '@/features/transaction/data/transaction-context'
import {
  buildTransaction,
  defaultTransactionFormValues,
  formatCurrencyInput,
  getCategoryColor,
  getCategoryIcon,
  normalizeDate,
  normalizeTime,
  walletTypeToLabel,
  type CreateMode,
  type TransactionFormValues,
} from '@/features/transaction/utils/transaction-form'
import { useWallets } from '@/features/wallet/data/wallet-context'

type SelectionOption = {
  value: string
  label: string
  icon?: string | null
  color?: string | null
}

type TransactionFormProps = {
  title: string
  submitLabel: string
  initialValues?: TransactionFormValues
  initialReceiptImageUri?: string
  transactionId?: string
  onSubmit: (transaction: TransactionItem) => Promise<void> | void
}

export function TransactionForm({
  title,
  submitLabel,
  initialValues = defaultTransactionFormValues,
  initialReceiptImageUri,
  transactionId,
  onSubmit,
}: TransactionFormProps) {
  const insets = useSafeAreaInsets()
  const { categories } = useCategories({ status: 'ACTIVE' })
  const { wallets } = useWallets()
  const amountInputRef = useRef<TextInput>(null)
  const [mode, setMode] = useState<CreateMode>(initialValues.mode)
  const [amount, setAmount] = useState(initialValues.amount)
  const [amountFocused, setAmountFocused] = useState(false)
  const [note, setNote] = useState(initialValues.note)
  const noteRef = useRef(initialValues.note)
  const lastExpenseCategoryRef = useRef(initialValues.expenseCategory)
  const [expenseWallet, setExpenseWallet] = useState(initialValues.expenseWallet)
  const [expenseWalletType, setExpenseWalletType] = useState(
    (initialValues as any)?.expenseWalletType || 'Tiền mặt',
  )
  const [expenseCategory, setExpenseCategory] = useState(initialValues.expenseCategory)
  const [transferFromWallet, setTransferFromWallet] = useState(initialValues.transferFromWallet)
  const [transferToWallet, setTransferToWallet] = useState(initialValues.transferToWallet)
  const [transactionTime, setTransactionTime] = useState(initialValues.transactionTime)
  const [transactionDate, setTransactionDate] = useState(initialValues.transactionDate)
  const [receiptImageUri, setReceiptImageUri] = useState<string | null>(
    initialReceiptImageUri ?? null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<
    | null
    | 'expenseWallet'
    | 'expenseWalletType'
    | 'expenseCategory'
    | 'transferFromWallet'
    | 'transferToWallet'
    | 'customCategory'
  >(null)

  const displayAmount = useMemo(() => formatCurrencyInput(amount), [amount])
  const walletOptions = useMemo<SelectionOption[]>(
    () =>
      wallets.map((wallet) => ({
        value: wallet.id,
        label: wallet.name,
      })),
    [wallets],
  )
  const walletTypeOptions = useMemo<SelectionOption[]>(
    () => [
      { value: 'Tiền mặt', label: 'Tiền mặt' },
      { value: 'Ngân hàng', label: 'Ngân hàng' },
      { value: 'Tiết kiệm', label: 'Tiết kiệm' },
      { value: 'Ví điện tử', label: 'Ví điện tử' },
    ],
    [],
  )

  const categoryOptions = useMemo(() => mapCategoriesToOptions(categories), [categories])

  const selectedCategory = useMemo(
    () => categoryOptions.find((option) => option.value === expenseCategory),
    [categoryOptions, expenseCategory],
  )

  const suggestedNote = useMemo(() => {
    const resolvedAmount = Number.parseInt(amount || '0', 10)
    const formattedAmount = Number.isNaN(resolvedAmount)
      ? null
      : new Intl.NumberFormat('vi-VN').format(resolvedAmount)

    if (mode === 'transfer') {
      const fromWalletName = walletOptions.find(
        (wallet) => wallet.value === transferFromWallet,
      )?.label
      const toWalletName = walletOptions.find((wallet) => wallet.value === transferToWallet)?.label

      if (fromWalletName && toWalletName) {
        return `Chuyển tiền từ ${fromWalletName} sang ${toWalletName}${formattedAmount ? `, số tiền ${formattedAmount} VND` : ''}.`
      }

      return 'Chuyển tiền giữa các ví.'
    }

    const walletName = walletOptions.find((wallet) => wallet.value === expenseWallet)?.label
    const categoryName = selectedCategory?.label ?? expenseCategory

    if (categoryName && walletName && formattedAmount) {
      return `Chi ${formattedAmount} VND cho ${categoryName.toLowerCase()} bằng ví ${walletName}.`
    }

    if (categoryName && formattedAmount) {
      return `Chi ${formattedAmount} VND cho ${categoryName.toLowerCase()}.`
    }

    if (categoryName) {
      return `Chi tiêu cho ${categoryName.toLowerCase()}.`
    }

    return 'Gợi ý ghi chú sẽ hiện khi bạn chọn đủ thông tin giao dịch.'
  }, [
    amount,
    expenseCategory,
    expenseWallet,
    mode,
    selectedCategory?.label,
    transferFromWallet,
    transferToWallet,
    walletOptions,
  ])

  useEffect(() => {
    if (mode === 'expense' && categoryOptions.length) {
      const hasCategory = categoryOptions.some((option) => option.value === expenseCategory)
      if (!hasCategory && !initialValues.expenseCategory) {
        setExpenseCategory(categoryOptions[0].value)
      }
    }
  }, [categoryOptions, expenseCategory, initialValues.expenseCategory, mode])

  useEffect(() => {
    setMode(initialValues.mode)
    setAmount(initialValues.amount)
    setNote(initialValues.note)
    noteRef.current = initialValues.note
    setExpenseWallet(initialValues.expenseWallet)
    setExpenseWalletType((initialValues as any)?.expenseWalletType || 'Tiền mặt')
    setExpenseCategory(initialValues.expenseCategory)
    lastExpenseCategoryRef.current =
      initialValues.mode === 'transfer'
        ? defaultTransactionFormValues.expenseCategory
        : initialValues.expenseCategory
    setTransferFromWallet(initialValues.transferFromWallet)
    setTransferToWallet(initialValues.transferToWallet)
    setTransactionTime(initialValues.transactionTime)
    setTransactionDate(initialValues.transactionDate)
  }, [initialValues])

  useEffect(() => {
    setReceiptImageUri(initialReceiptImageUri ?? null)
  }, [initialReceiptImageUri])

  useEffect(() => {
    if (mode === 'transfer') {
      setExpenseCategory('Chuyển tiền ví')
      return
    }

    if (expenseCategory === 'Chuyển tiền ví') {
      setExpenseCategory(
        lastExpenseCategoryRef.current || defaultTransactionFormValues.expenseCategory,
      )
    }
  }, [mode, expenseCategory])

  useEffect(() => {
    const matchedWallet = wallets.find((wallet) => wallet.id === expenseWallet)
    if (!matchedWallet) {
      return
    }

    setExpenseWalletType(walletTypeToLabel(matchedWallet.type))
  }, [expenseWallet, wallets])

  useEffect(() => {
    if (mode === 'expense' && expenseCategory && expenseCategory !== 'Chuyển tiền ví') {
      lastExpenseCategoryRef.current = expenseCategory
    }
  }, [expenseCategory, mode])

  useEffect(() => {
    if (!amountFocused) {
      return
    }

    const timeout = setTimeout(() => {
      amountInputRef.current?.focus()
    }, 0)

    return () => clearTimeout(timeout)
  }, [amountFocused])

  useEffect(() => {
    if (wallets.length === 0) {
      return
    }

    if (!wallets.some((wallet) => wallet.id === expenseWallet)) {
      setExpenseWallet(wallets[0].id)
    }

    if (!wallets.some((wallet) => wallet.id === transferFromWallet)) {
      setTransferFromWallet(wallets[0].id)
    }

    if (!wallets.some((wallet) => wallet.id === transferToWallet)) {
      setTransferToWallet(wallets[1]?.id ?? wallets[0].id)
    }
  }, [expenseWallet, transferFromWallet, transferToWallet, wallets])

  const adjustAmount = (delta: number) => {
    const numericAmount = Number.parseInt(amount || '0', 10)
    const nextAmount = Math.max(0, numericAmount + delta)
    setAmount(String(nextAmount))
  }

  const pickReceiptImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    })

    const asset = result.canceled ? null : result.assets[0]

    if (!asset?.uri) {
      return
    }

    const maxDimension = Math.max(asset.width ?? 0, asset.height ?? 0)
    const fileSize = asset.fileSize ?? 0
    const shouldOptimize = fileSize > 4 * 1024 * 1024 || maxDimension > 2200

    if (!shouldOptimize) {
      setReceiptImageUri(asset.uri)
      return
    }

    const optimizedImage = await manipulateAsync(
      asset.uri,
      maxDimension > 2200 ? [{ resize: { width: 1800 } }] : [],
      {
        compress: 0.82,
        format: SaveFormat.JPEG,
      },
    )

    setReceiptImageUri(optimizedImage.uri)
  }

  const handleSave = async () => {
    if (isSubmitting) {
      return
    }

    const numericAmount = Number.parseInt(amount || '0', 10)

    if (!numericAmount) {
      Alert.alert('Thiếu số tiền', 'Bạn hãy nhập số tiền trước khi lưu giao dịch.')
      return
    }

    if (wallets.length === 0) {
      Alert.alert('Chưa có ví', 'Bạn hãy tạo ví trước khi lưu giao dịch.')
      return
    }

    if (mode === 'expense' && !selectedCategory?.id) {
      Alert.alert('Thiếu danh mục', 'Bạn hãy chọn danh mục từ dữ liệu database.')
      return
    }

    const normalizedDate = normalizeDate(transactionDate)
    const normalizedTime = normalizeTime(transactionTime)

    if (!normalizedDate) {
      Alert.alert('Ngày chưa hợp lệ', 'Bạn hãy nhập ngày theo dạng dd/mm/yyyy.')
      return
    }

    if (!normalizedTime) {
      Alert.alert('Giờ chưa hợp lệ', 'Bạn hãy nhập giờ theo dạng hh:mm.')
      return
    }

    const transaction = buildTransaction({
      id: transactionId,
      amountValue: numericAmount,
      date: normalizedDate,
      time: normalizedTime,
      mode,
      note: noteRef.current,
      expenseWallet,
      expenseWalletTypeLabel: expenseWalletType,
      expenseCategory,
      categoryId: selectedCategory?.id,
      categoryIcon:
        (selectedCategory?.icon as TransactionItem['icon'] | undefined) ??
        getCategoryIcon(expenseCategory),
      categoryColor: selectedCategory?.color ?? getCategoryColor(expenseCategory),
      transferFromWallet,
      transferToWallet,
      receiptImageUri,
      wallets,
    })

    try {
      setIsSubmitting(true)
      await onSubmit(transaction)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 10, 24),
            paddingBottom: Math.max(insets.bottom + 34, 34),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
            <Ionicons name='arrow-back' size={24} color='#0B1D17' />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
            {title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

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
                options={walletOptions}
                onPress={() => setOpenDropdown('expenseWallet')}
              />
              <SelectorBlock
                label='LOẠI VÍ'
                value={expenseWalletType}
                options={walletTypeOptions}
                onPress={() => {}}
                withDivider
                hideChevron
                interactive={false}
              />
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.choiceGrid}>
              <SelectorBlock
                label='VÍ GỬI'
                value={transferFromWallet}
                options={walletOptions}
                onPress={() => setOpenDropdown('transferFromWallet')}
              />
              <SelectorBlock
                label='VÍ NHẬN'
                value={transferToWallet}
                options={walletOptions}
                onPress={() => setOpenDropdown('transferToWallet')}
                withDivider
              />
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>DANH MỤC</Text>
          <View style={styles.categoryContainer}>
            <Pressable
              style={styles.categoryInput}
              onPress={() => {
                if (mode === 'expense') {
                  setOpenDropdown('expenseCategory')
                }
              }}
              disabled={mode !== 'expense'}
            >
              <Text
                style={[
                  styles.categoryInputText,
                  !expenseCategory && styles.categoryInputPlaceholder,
                ]}
                numberOfLines={1}
              >
                {expenseCategory || 'Chọn danh mục'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.categoryListButton}
              onPress={() => {
                if (mode === 'expense') {
                  setOpenDropdown('expenseCategory')
                }
              }}
              disabled={mode !== 'expense'}
            >
              <Ionicons name='list' size={22} color={mode === 'expense' ? '#FFFFFF' : '#DDF2D2'} />
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Time</Text>
          <Text style={styles.sectionTitle}>THỜI GIAN GIAO DỊCH</Text>
          <View style={styles.dateTimeRow}>
            <View style={[styles.dateTimeField, styles.timeField]}>
              <View style={styles.dateTimeLabelRow}>
                <Ionicons name='time-outline' size={16} color='#E9F8E2' />
                <Text style={styles.dateTimeLabel}>Giờ</Text>
              </View>
              <TextInput
                value={transactionTime}
                onChangeText={setTransactionTime}
                placeholder='hh:mm'
                placeholderTextColor='#DDF2D2'
                keyboardType='numbers-and-punctuation'
                maxLength={5}
                style={styles.timeInput}
              />
            </View>
            <View style={[styles.dateTimeField, styles.dateField]}>
              <View style={styles.dateTimeLabelRow}>
                <Ionicons name='calendar-outline' size={16} color='#E9F8E2' />
                <Text style={styles.dateTimeLabel}>Ngày</Text>
              </View>
              <TextInput
                value={transactionDate}
                onChangeText={setTransactionDate}
                placeholder='dd/mm/yyyy'
                placeholderTextColor='#DDF2D2'
                keyboardType='numbers-and-punctuation'
                style={styles.dateInput}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>GHI CHÚ</Text>
          <TextInput
            value={note}
            onChangeText={(text) => {
              setNote(text)
              noteRef.current = text
            }}
            placeholder='Nhập ghi chú cho giao dịch'
            placeholderTextColor='#DDF2D2'
            style={styles.noteInput}
            multiline={true}
            submitBehavior='blurAndSubmit'
            autoCorrect={false}
            spellCheck={false}
          />
          <Pressable
            style={styles.noteSuggestionChip}
            onPress={() => {
              setNote(suggestedNote)
              noteRef.current = suggestedNote
            }}
          >
            <Ionicons name='sparkles-outline' size={16} color='#12392C' />
            <Text style={styles.noteSuggestionText}>{suggestedNote}</Text>
          </Pressable>
          <View style={styles.noteHintRow}>
            <MaterialCommunityIcons name='emoticon-excited-outline' size={18} color='#12392C' />
            <Text style={styles.noteHint}>Chạm gợi ý để dùng nhanh làm ghi chú.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>TẢI ẢNH HÓA ĐƠN</Text>
          {receiptImageUri ? (
            <View style={styles.receiptPreviewCard}>
              <Image source={{ uri: receiptImageUri }} style={styles.receiptPreviewImage} />
              <View style={styles.receiptPreviewActions}>
                <Pressable style={styles.receiptSecondaryButton} onPress={pickReceiptImage}>
                  <Ionicons name='image-outline' size={16} color='#12392C' />
                  <Text style={styles.receiptSecondaryButtonText}>Replace</Text>
                </Pressable>
                <Pressable
                  style={styles.receiptDangerButton}
                  onPress={() => setReceiptImageUri(null)}
                >
                  <Ionicons name='trash-outline' size={16} color='#B3261E' />
                  <Text style={styles.receiptDangerButtonText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.receiptUploadButton} onPress={pickReceiptImage}>
              <View style={styles.receiptUploadIconWrap}>
                <Ionicons name='cloud-upload-outline' size={22} color='#12392C' />
              </View>
              <View style={styles.receiptUploadBody}>
                <Text style={styles.receiptUploadTitle}>Chọn ảnh từ thiết bị</Text>
                <Text style={styles.receiptUploadText}>PNG, JPG, hoặc ảnh từ thư viện</Text>
              </View>
              <Ionicons name='chevron-forward' size={18} color='#12392C' />
            </Pressable>
          )}
        </View>

        <Pressable
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          <View style={styles.saveButtonContent}>
            {isSubmitting ? <ActivityIndicator size='small' color='#FFFFFF' /> : null}
            <Text style={styles.saveButtonText}>{isSubmitting ? 'ĐANG LƯU...' : submitLabel}</Text>
          </View>
        </Pressable>
      </ScrollView>

      <SelectionModal
        visible={openDropdown === 'expenseWallet'}
        title='Chọn ví'
        options={walletOptions}
        onClose={() => setOpenDropdown(null)}
        onSelect={(value) => {
          setExpenseWallet(value)
          setOpenDropdown(null)
        }}
      />
      <SelectionModal
        visible={openDropdown === 'expenseWalletType'}
        title='Chọn loại ví'
        options={walletTypeOptions}
        onClose={() => setOpenDropdown(null)}
        onSelect={(value) => {
          setExpenseWalletType(value)
          setOpenDropdown(null)
        }}
      />
      <SelectionModal
        visible={openDropdown === 'expenseCategory'}
        title='Chọn danh mục'
        options={categoryOptions}
        onClose={() => setOpenDropdown(null)}
        onSelect={(value) => {
          setExpenseCategory(value)
          setOpenDropdown(null)
        }}
      />
      <SelectionModal
        visible={openDropdown === 'transferFromWallet'}
        title='Chọn ví gửi'
        options={walletOptions}
        onClose={() => setOpenDropdown(null)}
        onSelect={(value) => {
          setTransferFromWallet(value)
          setOpenDropdown(null)
        }}
      />
      <SelectionModal
        visible={openDropdown === 'transferToWallet'}
        title='Chọn ví nhận'
        options={walletOptions}
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
  options,
  onPress,
  withDivider = false,
  hideChevron = false,
  interactive = true,
}: {
  label: string
  value: string
  options: SelectionOption[]
  onPress: () => void
  withDivider?: boolean
  hideChevron?: boolean
  interactive?: boolean
}) {
  const selectedOption = options.find((option) => option.value === value)
  return (
    <View style={[styles.selectorBlock, withDivider && styles.selectorBlockDivider]}>
      <Text style={styles.selectorTitle}>{label}</Text>
      {interactive ? (
        <Pressable style={styles.selectorPill} onPress={onPress}>
          <Text style={styles.selectorValue}>{selectedOption?.label ?? value}</Text>
          {!hideChevron && <Ionicons name='chevron-down' size={16} color='#E9F8E2' />}
        </Pressable>
      ) : (
        <View style={styles.selectorPill}>
          <Text style={styles.selectorValue}>{selectedOption?.label ?? value}</Text>
          {!hideChevron && <Ionicons name='chevron-down' size={16} color='#E9F8E2' />}
        </View>
      )}
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
  options: SelectionOption[]
  onClose: () => void
  onSelect: (value: string) => void
}) {
  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={styles.modalOptionsScroll} showsVerticalScrollIndicator={false}>
            {options.map((option) => (
              <Pressable
                key={option.value}
                style={styles.modalOption}
                onPress={() => onSelect(option.value)}
              >
                <View style={styles.modalOptionContent}>
                  {option.icon || option.color ? (
                    <View
                      style={[
                        styles.modalOptionIcon,
                        { backgroundColor: option.color ?? '#12392C' },
                      ]}
                    >
                      {option.icon ? (
                        <MaterialCommunityIcons
                          name={
                            option.icon as ComponentProps<typeof MaterialCommunityIcons>['name']
                          }
                          size={16}
                          color='#FFFFFF'
                        />
                      ) : null}
                    </View>
                  ) : null}
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                </View>
                <Ionicons name='chevron-forward' size={16} color='#12392C' />
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FBF5',
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
    fontSize: Typography.screenHeaderFontSize,
    fontWeight: '900',
    color: '#0B1D17',
    letterSpacing: 0.4,
  },
  headerSpacer: {
    width: 36,
  },
  card: {
    backgroundColor: '#79C77C',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  cardEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#E9F8E2',
    marginBottom: 6,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#12392C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#12392C',
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
    color: '#E9F8E2',
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  segmentButton: {
    borderRadius: 999,
    backgroundColor: '#CFECC2',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#12392C',
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#12392C',
  },
  segmentLabelActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F6FFF9',
    marginBottom: 8,
    textAlign: 'left',
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#E9F8E2',
    marginBottom: 12,
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
    backgroundColor: '#12392C',
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
  dateTimeColumn: {
    alignItems: 'center',
    gap: 10,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeField: {
    flex: 1,
    backgroundColor: '#12392C',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeField: {
    flex: 0.9,
  },
  dateField: {
    flex: 1.3,
  },
  dateTimeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  dateTimeLabel: {
    color: '#E9F8E2',
    fontSize: 12,
    fontWeight: '800',
  },
  dateInput: {
    width: '100%',
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'left',
    paddingVertical: 0,
  },
  timeInput: {
    width: '100%',
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'left',
    paddingVertical: 0,
  },
  noteInput: {
    backgroundColor: '#DDF2D2',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 96,
    fontSize: 14,
    color: '#12392C',
    textAlignVertical: 'top',
  },
  noteHintRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteSuggestionChip: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#F7FBF5',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteSuggestionText: {
    flex: 1,
    color: '#12392C',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  noteHint: {
    fontSize: 12,
    fontWeight: '700',
    color: '#12392C',
  },
  saveButton: {
    backgroundColor: '#12392C',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  saveButtonDisabled: {
    opacity: 0.55,
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
    maxHeight: '80%',
    backgroundColor: '#F7FBF5',
    borderRadius: 18,
    padding: 16,
  },
  modalOptionsScroll: {
    maxHeight: 360,
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
  modalOptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalOptionIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#12392C',
  },
  input: {
    backgroundColor: '#12392C',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  categoryInput: {
    flex: 1,
    backgroundColor: '#DDF2D2',
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  categoryInputText: {
    fontSize: 14,
    color: '#12392C',
    fontWeight: '700',
  },
  categoryInputPlaceholder: {
    color: '#245442',
  },
  categoryListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12392C',
    borderRadius: 12,
    width: 44,
    height: 44,
  },
  receiptUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    backgroundColor: '#DDF2D2',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  receiptUploadIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FBF5',
  },
  receiptUploadBody: {
    flex: 1,
  },
  receiptUploadTitle: {
    color: '#12392C',
    fontSize: 15,
    fontWeight: '900',
  },
  receiptUploadText: {
    marginTop: 2,
    color: '#315245',
    fontSize: 12,
    fontWeight: '700',
  },
  receiptPreviewCard: {
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#DDF2D2',
  },
  receiptPreviewImage: {
    width: '100%',
    height: 210,
    backgroundColor: '#CFECC2',
  },
  receiptPreviewActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  receiptSecondaryButton: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#F7FBF5',
  },
  receiptSecondaryButtonText: {
    color: '#12392C',
    fontSize: 13,
    fontWeight: '900',
  },
  receiptDangerButton: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#FFE3DE',
  },
  receiptDangerButtonText: {
    color: '#B3261E',
    fontSize: 13,
    fontWeight: '900',
  },
})
