import type {
  TransactionItem,
  TransactionType,
} from '@/features/transaction/data/transaction-context'
import type { WalletItem } from '@/features/wallet/data/wallet-context'

export type CreateMode = TransactionType

export type TransactionFormValues = {
  mode: CreateMode
  amount: string
  note: string
  expenseWallet: string
  expenseCategory: string
  expenseWalletType: string
  transferFromWallet: string
  transferToWallet: string
  transactionTime: string
  transactionDate: string
}

function padTimePart(value: number) {
  return String(value).padStart(2, '0')
}

function getCurrentTransactionDateInput() {
  const now = new Date()
  return `${padTimePart(now.getDate())}/${padTimePart(now.getMonth() + 1)}/${now.getFullYear()}`
}

function getCurrentTransactionTimeInput() {
  const now = new Date()
  return `${padTimePart(now.getHours())}:${padTimePart(now.getMinutes())}`
}

export const defaultTransactionFormValues: TransactionFormValues = {
  mode: 'expense',
  amount: '',
  note: '',
  expenseWallet: 'cash-main',
  expenseCategory: '',
  expenseWalletType: 'Tiền mặt',
  transferFromWallet: 'cash-main',
  transferToWallet: 'momo-main',
  transactionTime: getCurrentTransactionTimeInput(),
  transactionDate: getCurrentTransactionDateInput(),
}

export function formatCurrencyInput(value: string) {
  const numeric = Number.parseInt(value || '0', 10)
  return new Intl.NumberFormat('vi-VN').format(Number.isNaN(numeric) ? 0 : numeric)
}

export function normalizeDate(value: string) {
  const normalized = value.trim().replaceAll('-', '/')
  const pattern = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const match = normalized.match(pattern)

  if (!match) {
    return null
  }

  return {
    display: `${match[1]}-${match[2]}-${match[3]}`,
    iso: `${match[3]}-${match[2]}-${match[1]}`,
  }
}

export function normalizeTime(value: string) {
  const normalized = value.trim().replace('.', ':')
  const pattern = /^(\d{1,2}):(\d{2})$/
  const match = normalized.match(pattern)

  if (!match) {
    return null
  }

  const hour = Number.parseInt(match[1], 10)
  const minute = Number.parseInt(match[2], 10)

  if (hour > 23 || minute > 59) {
    return null
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function buildTransaction({
  id,
  amountValue,
  date,
  time,
  mode,
  note,
  expenseWallet,
  expenseWalletTypeLabel,
  expenseCategory,
  categoryId,
  categoryIcon,
  categoryColor,
  transferFromWallet,
  transferToWallet,
  receiptImageUri,
  wallets,
}: {
  id?: string
  amountValue: number
  date: { display: string; iso: string }
  time: string
  mode: CreateMode
  note: string
  expenseWallet: string
  expenseWalletTypeLabel?: string
  expenseCategory: string
  categoryId?: string
  categoryIcon?: TransactionItem['icon']
  categoryColor?: string | null
  transferFromWallet: string
  transferToWallet: string
  receiptImageUri?: string | null
  wallets: WalletItem[]
}): TransactionItem {
  const rawId = id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const normalizedNote = note.trim() || 'Giao dịch mới vừa được thêm từ màn hình nhập tay.'
  const formattedAmount = `${new Intl.NumberFormat('vi-VN').format(amountValue)} VND`
  const expenseWalletItem = findWallet(wallets, expenseWallet)
  const expenseWalletTypeFallback = expenseWalletTypeLabel
    ? walletLabelToType(expenseWalletTypeLabel)
    : undefined
  const fromWalletItem = findWallet(wallets, transferFromWallet)
  const toWalletItem = findWallet(wallets, transferToWallet)
  const expenseWalletName = expenseWalletItem?.name ?? expenseWallet
  const fromWalletName = fromWalletItem?.name ?? transferFromWallet
  const toWalletName = toWalletItem?.name ?? transferToWallet

  if (mode === 'transfer') {
    return {
      id: rawId,
      title: `Chuyển từ ${fromWalletName}`,
      amount: formattedAmount,
      amountValue,
      dateLabel: date.display,
      dateISO: date.iso,
      timeLabel: time,
      icon: 'wallet-outline',
      iconBackground: '#8A7DFF',
      type: 'transfer',
      receiptImageUri: receiptImageUri ?? undefined,
      transferFromWalletId: fromWalletItem?.id,
      transferToWalletId: toWalletItem?.id,
      detail: {
        amountDisplay: formattedAmount,
        amountColor: '#79F4A6',
        date: date.display,
        time,
        tags: [`${fromWalletName} -> ${toWalletName}`],
        note: normalizedNote,
        aiSuggestion: 'Giao dịch chuyển tiền nội bộ',
        footer: fromWalletName.toUpperCase(),
        rightContent: 'bank-transfer',
      },
    }
  }

  return {
    id: rawId,
    title: expenseCategory,
    amount: `-${formattedAmount}`,
    amountValue: -amountValue,
    dateLabel: date.display,
    dateISO: date.iso,
    timeLabel: time,
    icon: categoryIcon ?? getCategoryIcon(expenseCategory),
    iconBackground: categoryColor ?? getCategoryColor(expenseCategory),
    type: 'expense',
    categoryId,
    walletId: expenseWalletItem?.id,
    receiptImageUri: receiptImageUri ?? undefined,
    detail: {
      amountDisplay: `-${formattedAmount}`,
      amountColor: '#FFDFD7',
      date: date.display,
      time,
      tags: [expenseWalletName],
      note: normalizedNote,
      aiSuggestion: `Có vẻ bạn đang chi cho ${expenseCategory.toLowerCase()}?`,
      footer: expenseCategory,
      walletType: expenseWalletItem?.type ?? expenseWalletTypeFallback ?? 'cash',
      rightContent: 'icon',
    },
  }
}

export function getTransactionFormValues(
  transaction: TransactionItem,
  wallets: WalletItem[] = [],
): TransactionFormValues {
  const amount = String(Math.abs(transaction.amountValue))
  const transactionDate = transaction.detail.date.replaceAll('-', '/')

  if (transaction.type === 'transfer') {
    const transferTag = transaction.detail.tags[0] ?? ''
    const [fromWalletRaw, toWalletRaw] = transferTag.split('->').map((value) => value.trim())

    return {
      mode: 'transfer',
      amount,
      note: transaction.detail.note,
      expenseWallet: defaultTransactionFormValues.expenseWallet,
      expenseCategory: 'Chuyển tiền ví',
      expenseWalletType: defaultTransactionFormValues.expenseWalletType,
      transferFromWallet:
        transaction.transferFromWalletId ??
        matchKnownWalletId(fromWalletRaw || transaction.detail.footer, wallets),
      transferToWallet: transaction.transferToWalletId ?? matchKnownWalletId(toWalletRaw, wallets),
      transactionTime:
        transaction.timeLabel ??
        transaction.detail.time ??
        defaultTransactionFormValues.transactionTime,
      transactionDate,
    }
  }

  const savedWalletType = transaction.detail.walletType
  const walletFromId = wallets.find((w) => w.id === transaction.walletId)
  const resolvedWalletType = savedWalletType ?? walletFromId?.type ?? 'cash'

  return {
    mode: 'expense',
    amount,
    note: transaction.detail.note,
    expenseWallet: transaction.walletId ?? matchKnownWalletId(transaction.detail.tags[0], wallets),
    expenseCategory: transaction.title,
    expenseWalletType: walletTypeToLabel(resolvedWalletType),
    transferFromWallet: defaultTransactionFormValues.transferFromWallet,
    transferToWallet: defaultTransactionFormValues.transferToWallet,
    transactionTime:
      transaction.timeLabel ??
      transaction.detail.time ??
      defaultTransactionFormValues.transactionTime,
    transactionDate,
  }
}

export function walletTypeToLabel(type: WalletItem['type']): string {
  switch (type) {
    case 'bank':
      return 'Ngân hàng'
    case 'saving':
      return 'Tiết kiệm'
    case 'digital':
      return 'Ví điện tử'
    case 'cash':
    default:
      return 'Tiền mặt'
  }
}

function walletLabelToType(label: string): WalletItem['type'] {
  const normalized = label.trim().toLocaleLowerCase('vi-VN')
  if (normalized === 'ngân hàng') return 'bank'
  if (normalized === 'tiết kiệm') return 'saving'
  if (normalized === 'ví điện tử') return 'digital'
  return 'cash'
}

function findWallet(wallets: WalletItem[], value: string) {
  return (
    wallets.find((wallet) => wallet.id === value) ??
    wallets.find(
      (wallet) =>
        wallet.name.trim().toLocaleLowerCase('vi-VN') === value.trim().toLocaleLowerCase('vi-VN'),
    )
  )
}

function matchKnownWalletId(value: string | undefined, wallets: WalletItem[]) {
  if (wallets.length === 0) {
    return value ?? defaultTransactionFormValues.expenseWallet
  }

  if (!value) {
    return wallets[0].id
  }

  return findWallet(wallets, value)?.id ?? wallets[0].id
}

export function getCategoryIcon(category: string): TransactionItem['icon'] {
  const upper = category.toUpperCase()
  if (upper === 'TIỀN MẶT') return 'cash'
  if (upper === 'NGÂN HÀNG') return 'bank'
  if (upper === 'TIẾT KIỆM') return 'sack'
  if (upper === 'VÍ ĐIỆN TỬ') return 'wallet'
  if (category === 'Ăn uống') return 'silverware-fork-knife'
  if (category === 'Di chuyển') return 'motorbike'
  if (category === 'Nhà cửa') return 'home-city-outline'
  if (category === 'Giải trí') return 'gamepad-variant-outline'
  if (category === 'Mua sắm') return 'shopping-outline'
  if (category === 'Làm đẹp') return 'face-woman-outline'
  if (category === 'Chuyển tiền ví') return 'swap-horizontal'
  return pickFromList(category, customCategoryIcons)
}

export function getCategoryColor(category: string) {
  const upper = category.toUpperCase()
  if (upper === 'TIỀN MẶT') return '#79C77C'
  if (upper === 'NGÂN HÀNG') return '#3D94C6'
  if (upper === 'TIẾT KIỆM') return '#F0C65A'
  if (upper === 'VÍ ĐIỆN TỬ') return '#7E63F4'
  if (category === 'Ăn uống') return '#F0C65A'
  if (category === 'Di chuyển') return '#F2A493'
  if (category === 'Nhà cửa') return '#3D94C6'
  if (category === 'Giải trí') return '#7E63F4'
  if (category === 'Mua sắm') return '#FFB347'
  if (category === 'Làm đẹp') return '#F59BD4'
  if (category === 'Chuyển tiền ví') return '#8A7DFF'
  return pickFromList(category, customCategoryColors)
}

const customCategoryIcons: TransactionItem['icon'][] = [
  'basket-outline',
  'coffee-outline',
  'car-outline',
  'book-open-variant',
  'medical-bag',
  'music-circle-outline',
  'tag-outline',
  'lightbulb-outline',
]

const customCategoryColors = [
  '#F0C65A',
  '#F2A493',
  '#3D94C6',
  '#7E63F4',
  '#79F4A6',
  '#FFB0A4',
  '#8A7DFF',
  '#3897C7',
]

function pickFromList<T>(value: string, list: T[]): T {
  const normalized = value.trim().toLocaleLowerCase('vi-VN')
  let hash = 0
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) % 2147483647
  }
  const index = list.length > 0 ? Math.abs(hash) % list.length : 0
  return list[index]
}
