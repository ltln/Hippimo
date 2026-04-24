import type { TransactionItem, TransactionType } from '@/shared/contexts/transaction-context'

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

export const wallets = ['Tiền mặt', 'MoMo', 'Ngân hàng', 'Ví ăn uống']
export const categories = ['Ăn uống', 'Di chuyển', 'Nhà cửa', 'Giải trí']
export const receiveWallets = ['MoMo', 'Ngân hàng', 'Ví dự phòng', 'Tiền mặt']

export const defaultTransactionFormValues: TransactionFormValues = {
  mode: 'expense',
  amount: '400000',
  note: '',
  expenseWallet: 'Tiền mặt',
  expenseCategory: 'Ăn uống',
  transferFromWallet: 'Tiền mặt',
  transferToWallet: 'MoMo',
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
}): TransactionItem {
  const rawId = id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const normalizedNote = note.trim() || 'Giao dịch mới vừa được thêm từ màn hình nhập tay.'
  const formattedAmount = `${new Intl.NumberFormat('vi-VN').format(amountValue)} VND`

  if (mode === 'transfer') {
    return {
      id: rawId,
      title: `Chuyển từ ${transferFromWallet}`,
      amount: formattedAmount,
      amountValue,
      dateLabel: date.display,
      dateISO: date.iso,
      icon: 'wallet-outline',
      iconBackground: '#8A7DFF',
      type: 'transfer',
      detail: {
        amountDisplay: formattedAmount,
        amountColor: '#79F4A6',
        date: date.display,
        tags: [`${transferFromWallet} -> ${transferToWallet}`],
        note: normalizedNote, // <-- Đây là Ghi chú người dùng
        aiSuggestion: 'Giao dịch chuyển tiền nội bộ', // <-- Thêm trường riêng cho AI
        footer: transferFromWallet.toUpperCase(),
        rightContent: 'bank-transfer',
      } as any, // Dùng as any để bypass lỗi interface nếu chưa update kiểu dữ liệu
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
    detail: {
      amountDisplay: `-${formattedAmount}`,
      amountColor: '#FFDFD7',
      date: date.display,
      tags: [expenseWallet], // <-- Đã xóa note khỏi tags để không bị lặp
      note: normalizedNote, // <-- Ghi chú người dùng chuẩn xác
      aiSuggestion: `Có vẻ bạn đang chi cho ${expenseCategory.toLowerCase()}?`, // <-- Trường riêng cho AI
      footer: expenseCategory,
      rightContent: 'icon',
    } as any,
  }
}

export function getTransactionFormValues(transaction: TransactionItem): TransactionFormValues {
  const amount = String(Math.abs(transaction.amountValue))
  const transactionDate = transaction.detail.date.replaceAll('-', '/')

  if (transaction.type === 'transfer') {
    const transferTag = transaction.detail.tags[0] ?? ''
    const [fromWalletRaw, toWalletRaw] = transferTag.split('->').map((value) => value.trim())

    return {
      mode: 'transfer',
      amount,
      note: transaction.detail.note, // Đảm bảo lấy đúng note gốc
      expenseWallet: defaultTransactionFormValues.expenseWallet,
      expenseCategory: defaultTransactionFormValues.expenseCategory,
      transferFromWallet: matchKnownOption(fromWalletRaw || transaction.detail.footer, wallets),
      transferToWallet: matchKnownOption(toWalletRaw, receiveWallets),
      transactionDate,
    }
  }

  return {
    mode: 'expense',
    amount,
    note: transaction.detail.note, // Đảm bảo lấy đúng note gốc
    expenseWallet: matchKnownOption(transaction.detail.tags[0], wallets),
    expenseCategory: matchKnownOption(transaction.detail.footer || transaction.title, categories),
    transferFromWallet: defaultTransactionFormValues.transferFromWallet,
    transferToWallet: defaultTransactionFormValues.transferToWallet,
    transactionDate,
  }
}

function matchKnownOption(value: string | undefined, options: string[]) {
  if (!value) {
    return options[0]
  }

  const normalizedValue = value.trim().toLocaleLowerCase('vi-VN')
  const matchedOption = options.find(
    (option) => option.trim().toLocaleLowerCase('vi-VN') === normalizedValue,
  )

  return matchedOption ?? value
}

function mapCategoryIcon(category: string): TransactionItem['icon'] {
  if (category === 'Ăn uống') return 'silverware-fork-knife'
  if (category === 'Di chuyển') return 'motorbike'
  if (category === 'Nhà cửa') return 'home-city-outline'
  if (category === 'Giải trí') return 'gamepad-variant-outline'
  return 'cash'
}

function mapCategoryColor(category: string) {
  if (category === 'Ăn uống') return '#F0C65A'
  if (category === 'Di chuyển') return '#F2A493'
  if (category === 'Nhà cửa') return '#3D94C6'
  if (category === 'Giải trí') return '#7E63F4'
  return '#3897C7'
}
