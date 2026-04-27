import type { TransactionItem, TransactionType } from '@/shared/contexts/transaction-context'
import type { WalletItem } from '@/shared/contexts/wallet-context'

export type CreateMode = TransactionType

export type TransactionFormValues = {
  mode: CreateMode
  amount: string
  note: string
  expenseWallet: string
  expenseCategory: string
  transferFromWallet: string
  transferToWallet: string
  transactionDate: string
}

export const categories = ['TIỀN MẶT', 'NGÂN HÀNG', 'TIẾT KIỆM', 'VÍ ĐIỆN TỬ']

export const defaultTransactionFormValues: TransactionFormValues = {
  mode: 'expense',
  amount: '400000',
  note: '',
  expenseWallet: 'cash-main',
  expenseCategory: 'TIỀN MẶT',
  transferFromWallet: 'cash-main',
  transferToWallet: 'momo-main',
  transactionDate: '29/04/2026',
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

export function buildTransaction({
  id,
  amountValue,
  date,
  mode,
  note,
  expenseWallet,
  expenseCategory,
  transferFromWallet,
  transferToWallet,
  wallets,
}: {
  id?: string
  amountValue: number
  date: { display: string; iso: string }
  mode: CreateMode
  note: string
  expenseWallet: string
  expenseCategory: string
  transferFromWallet: string
  transferToWallet: string
  wallets: WalletItem[]
}): TransactionItem {
  const rawId = id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const normalizedNote = note.trim() || 'Giao dịch mới vừa được thêm từ màn hình nhập tay.'
  const formattedAmount = `${new Intl.NumberFormat('vi-VN').format(amountValue)} VND`
  const expenseWalletItem = findWallet(wallets, expenseWallet)
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
      icon: 'wallet-outline',
      iconBackground: '#8A7DFF',
      type: 'transfer',
      transferFromWalletId: fromWalletItem?.id,
      transferToWalletId: toWalletItem?.id,
      detail: {
        amountDisplay: formattedAmount,
        amountColor: '#79F4A6',
        date: date.display,
        tags: [`${fromWalletName} -> ${toWalletName}`],
        note: normalizedNote,
        aiSuggestion: 'Giao dịch chuyển tiền nội bộ',
        footer: fromWalletName.toUpperCase(),
        rightContent: 'bank-transfer',
      } as any,
    }
  }

  return {
    id: rawId,
    title: expenseCategory,
    amount: `-${formattedAmount}`,
    amountValue: -amountValue,
    dateLabel: date.display,
    dateISO: date.iso,
    icon: mapCategoryIcon(expenseCategory),
    iconBackground: mapCategoryColor(expenseCategory),
    type: 'expense',
    walletId: expenseWalletItem?.id,
    detail: {
      amountDisplay: `-${formattedAmount}`,
      amountColor: '#FFDFD7',
      date: date.display,
      tags: [expenseWalletName],
      note: normalizedNote,
      aiSuggestion: `Có vẻ bạn đang chi cho ${expenseCategory.toLowerCase()}?`,
      footer: expenseCategory,
      rightContent: 'icon',
    } as any,
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
      expenseCategory: defaultTransactionFormValues.expenseCategory,
      transferFromWallet:
        transaction.transferFromWalletId ??
        matchKnownWalletId(fromWalletRaw || transaction.detail.footer, wallets),
      transferToWallet: transaction.transferToWalletId ?? matchKnownWalletId(toWalletRaw, wallets),
      transactionDate,
    }
  }

  return {
    mode: 'expense',
    amount,
    note: transaction.detail.note,
    expenseWallet: transaction.walletId ?? matchKnownWalletId(transaction.detail.tags[0], wallets),
    expenseCategory: matchKnownOption(transaction.detail.footer || transaction.title, categories),
    transferFromWallet: defaultTransactionFormValues.transferFromWallet,
    transferToWallet: defaultTransactionFormValues.transferToWallet,
    transactionDate,
  }
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

function matchKnownOption(value: string | undefined, options: string[]) {
  if (!value) {
    return options[0]
  }

  const normalizedValue = value.trim().toLocaleLowerCase('vi-VN')
  const matchedOption = options.find(
    (option) => option.trim().toLocaleLowerCase('vi-VN') === normalizedValue,
  )

  return matchedOption ?? options[0]
}

function mapCategoryIcon(category: string): TransactionItem['icon'] {
  if (category === 'TIỀN MẶT') return 'cash'
  if (category === 'NGÂN HÀNG') return 'bank'
  if (category === 'TIẾT KIỆM') return 'sack'
  if (category === 'VÍ ĐIỆN TỬ') return 'wallet'
  if (category === 'Ăn uống') return 'silverware-fork-knife'
  if (category === 'Di chuyển') return 'motorbike'
  if (category === 'Nhà cửa') return 'home-city-outline'
  if (category === 'Giải trí') return 'gamepad-variant-outline'
  return 'cash'
}

function mapCategoryColor(category: string) {
  if (category === 'TIỀN MẶT') return '#128A3D'
  if (category === 'NGÂN HÀNG') return '#3D94C6'
  if (category === 'TIẾT KIỆM') return '#F0C65A'
  if (category === 'VÍ ĐIỆN TỬ') return '#7E63F4'
  if (category === 'Ăn uống') return '#F0C65A'
  if (category === 'Di chuyển') return '#F2A493'
  if (category === 'Nhà cửa') return '#3D94C6'
  if (category === 'Giải trí') return '#7E63F4'
  return '#3897C7'
}
