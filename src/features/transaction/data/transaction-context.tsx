import type { ComponentProps, PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import { fetchCategories, type CategoryRecord } from '@/features/category/data/category-api'
import { useAuthAccessToken } from '@/features/auth/data/auth-context'
import {
  createTransaction as createTransactionApi,
  deleteTransaction as deleteTransactionApi,
  fetchTransactions,
  updateTransaction as updateTransactionApi,
  type CreateTransactionDto,
  type TransactionRecord,
  type UpdateTransactionDto,
} from '@/features/transaction/data/transaction-api'
import { useWallets } from '@/features/wallet/data/wallet-context'

export type TransactionType = 'expense' | 'transfer'

export type TransactionItem = {
  id: string
  title: string
  amount: string
  amountValue: number
  dateLabel: string
  dateISO: string
  icon: ComponentProps<typeof MaterialCommunityIcons>['name']
  iconBackground: string
  type: TransactionType
  walletId?: string
  transferFromWalletId?: string
  transferToWalletId?: string
  detail: {
    amountDisplay: string
    amountColor: string
    date: string
    tags: string[]
    note: string
    aiSuggestion?: string
    footer: string
    walletType?: 'cash' | 'bank' | 'saving' | 'digital'
    rightContent?: 'icon' | 'bank-transfer'
  }
}

type TransactionContextValue = {
  transactions: TransactionItem[]
  categoryOptions: { value: string; label: string; type: CategoryRecord['type'] }[]
  isLoading: boolean
  error: string | null
  refreshTransactions: () => Promise<void>
  addTransaction: (payload: CreateTransactionDto) => Promise<boolean>
  updateTransaction: (id: string, payload: UpdateTransactionDto) => Promise<boolean>
  deleteTransaction: (id: string) => Promise<boolean>
}

const initialTransactions: TransactionItem[] = [
  {
    id: 'fuel',
    title: 'Đổ xăng',
    amount: '-50.000 VND',
    amountValue: -50000,
    dateLabel: '07-04-2026',
    dateISO: '2026-04-07',
    icon: 'motorbike',
    iconBackground: '#F2A493',
    type: 'expense',
    walletId: 'cash-main',
    detail: {
      amountDisplay: '-50.000 VND',
      amountColor: '#FFB0A4',
      date: '07-04-2026',
      tags: ['Ví 1', 'Đổ xăng dùm Lê Thành Phát :)))'],
      note: 'Khoản chi này chiếm 5% ngân sách tháng của bạn. Bạn đang chi tiêu rất hợp lý!',
      footer: 'Đổ xăng',
      walletType: 'cash',
      rightContent: 'icon',
    },
  },
  {
    id: 'topup',
    title: 'Nạp game',
    amount: '200.000 VND',
    amountValue: 200000,
    dateLabel: '07-04-2026',
    dateISO: '2026-04-07',
    icon: 'gamepad-variant-outline',
    iconBackground: '#7E63F4',
    type: 'transfer',
    transferFromWalletId: 'bank-main',
    transferToWalletId: 'momo-main',
    detail: {
      amountDisplay: '200.000 VND',
      amountColor: '#79F4A6',
      date: '07-04-2026',
      tags: ['Ví 2 -> Ví 4'],
      note: 'Khoản chi này chiếm 5% ngân sách tháng của bạn. Bạn đang chi tiêu rất hợp lý!',
      footer: 'NGÂN HÀNG',
      rightContent: 'bank-transfer',
    },
  },
  {
    id: 'rent',
    title: 'Đóng tiền nhà',
    amount: '-23.000 VND',
    amountValue: -23000,
    dateLabel: '06-04-2026',
    dateISO: '2026-04-06',
    icon: 'home-city-outline',
    iconBackground: '#3D94C6',
    type: 'expense',
    walletId: 'bank-main',
    detail: {
      amountDisplay: '-23.000 VND',
      amountColor: '#FFDFD7',
      date: '06-04-2026',
      tags: ['Ví 2', 'Tiền nhà tháng 4'],
      note: 'Khoản chi cố định đang được theo dõi ổn định. Bạn có thể đặt nhắc trước ngày đến hạn.',
      footer: 'Đóng tiền nhà',
      walletType: 'bank',
      rightContent: 'icon',
    },
  },
  {
    id: 'market',
    title: 'Đi chợ',
    amount: '-56.300 VND',
    amountValue: -56300,
    dateLabel: '05-04-2026',
    dateISO: '2026-04-05',
    icon: 'basket-outline',
    iconBackground: '#F0C65A',
    type: 'expense',
    walletId: 'cash-main',
    detail: {
      amountDisplay: '-56.300 VND',
      amountColor: '#FFE0B8',
      date: '05-04-2026',
      tags: ['Ví 1', 'Mua đồ ăn và trái cây'],
      note: 'Chi tiêu sinh hoạt hôm nay nằm trong mức an toàn. Nhóm ăn uống vẫn đang được kiểm soát tốt.',
      footer: 'Đi chợ',
      walletType: 'cash',
      rightContent: 'icon',
    },
  },
  {
    id: 'insurance',
    title: 'Đóng bảo hiểm',
    amount: '-7.200 VND',
    amountValue: -7200,
    dateLabel: '02-04-2026',
    dateISO: '2026-04-02',
    icon: 'shield-check-outline',
    iconBackground: '#3897C7',
    type: 'expense',
    walletId: 'bank-main',
    detail: {
      amountDisplay: '-7.200 VND',
      amountColor: '#D4F8E6',
      date: '02-04-2026',
      tags: ['Ví 2', 'Bảo hiểm xe máy'],
      note: 'Giao dịch nhỏ nhưng lặp lại định kỳ. Nếu muốn, mình có thể tách riêng nhóm chi phí bảo hiểm sau.',
      footer: 'Đóng bảo hiểm',
      walletType: 'bank',
      rightContent: 'icon',
    },
  },
  {
    id: 'oil',
    title: 'Thay nhớt',
    amount: '-24.300 VND',
    amountValue: -24300,
    dateLabel: '01-04-2026',
    dateISO: '2026-04-01',
    icon: 'motorbike-electric',
    iconBackground: '#0E3F33',
    type: 'expense',
    walletId: 'cash-main',
    detail: {
      amountDisplay: '-24.300 VND',
      amountColor: '#E1FFE5',
      date: '01-04-2026',
      tags: ['Ví 1', 'Bảo dưỡng định kỳ'],
      note: 'Bảo dưỡng phương tiện đang được ghi nhận đầy đủ. Điều này sẽ giúp theo dõi tổng chi phí di chuyển dễ hơn.',
      footer: 'Thay nhớt',
      walletType: 'cash',
      rightContent: 'icon',
    },
  },
  {
    id: 'wallet-transfer',
    title: 'Chuyển ví dự phòng',
    amount: '350.000 VND',
    amountValue: 350000,
    dateLabel: '29-03-2026',
    dateISO: '2026-03-29',
    icon: 'wallet-outline',
    iconBackground: '#8A7DFF',
    type: 'transfer',
    transferFromWalletId: 'cash-main',
    transferToWalletId: 'saving-main',
    detail: {
      amountDisplay: '350.000 VND',
      amountColor: '#79F4A6',
      date: '29-03-2026',
      tags: ['Ví 1 -> Ví 3'],
      note: 'Bạn đã chuyển tiền sang ví dự phòng đúng lúc, giúp ngân sách linh hoạt hơn cho tuần tới.',
      footer: 'VÍ CHÍNH',
      rightContent: 'bank-transfer',
    },
  },
]

const TransactionContext = createContext<TransactionContextValue | null>(null)

const formatCurrency = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} VND`

const formatDateLabel = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  const day = String(parsed.getDate()).padStart(2, '0')
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  return `${day}-${month}-${parsed.getFullYear()}`
}

const mapRecordToItem = (
  record: TransactionRecord,
  wallets: ReturnType<typeof useWallets>['wallets'],
  categoryNameById: Map<string, string>,
): TransactionItem => {
  const wallet = wallets.find((item) => item.id === record.walletId)
  const toWallet = wallets.find((item) => item.id === record.toWalletId)
  const isTransfer = record.type === 'TRANSFER'
  const isExpense = record.type === 'EXPENSE'
  const amountValue = isExpense ? -Number(record.amount) : Number(record.amount)
  const amountDisplay = isExpense
    ? `-${formatCurrency(Number(record.amount))}`
    : formatCurrency(Number(record.amount))
  const dateLabel = formatDateLabel(record.transactionDate)
  const fallbackTitle = isTransfer ? 'Chuyển tiền' : isExpense ? 'Chi tiêu' : 'Thu nhập'
  const categoryName = record.categoryId ? categoryNameById.get(record.categoryId) : undefined
  const title = categoryName ?? fallbackTitle
  const walletName = wallet?.name ?? 'Ví'

  if (isTransfer) {
    const toWalletName = toWallet?.name ?? 'Ví nhận'

    return {
      id: record.transactionId,
      title,
      amount: amountDisplay,
      amountValue,
      dateLabel,
      dateISO: record.transactionDate,
      icon: 'swap-horizontal',
      iconBackground: '#8A7DFF',
      type: 'transfer',
      transferFromWalletId: record.walletId ?? undefined,
      transferToWalletId: record.toWalletId ?? undefined,
      detail: {
        amountDisplay,
        amountColor: '#79F4A6',
        date: dateLabel,
        tags: [`${walletName} -> ${toWalletName}`],
        note: record.notes ?? '',
        aiSuggestion: undefined,
        footer: walletName.toUpperCase(),
        rightContent: 'bank-transfer',
      },
    }
  }

  return {
    id: record.transactionId,
    title,
    amount: amountDisplay,
    amountValue,
    dateLabel,
    dateISO: record.transactionDate,
    icon: isExpense ? 'shopping-outline' : 'cash',
    iconBackground: isExpense ? '#F0C65A' : '#79F4A6',
    type: 'expense',
    walletId: record.walletId ?? undefined,
    detail: {
      amountDisplay,
      amountColor: isExpense ? '#FFDFD7' : '#79F4A6',
      date: dateLabel,
      tags: [walletName],
      note: record.notes ?? '',
      aiSuggestion: record.aiSuggestedCategoryId ? 'Có gợi ý AI cho danh mục này.' : undefined,
      footer: title,
      walletType: wallet?.type,
      rightContent: 'icon',
    },
  }
}

export function TransactionProvider({ children }: PropsWithChildren) {
  const [transactions, setTransactions] = useState<TransactionItem[]>(initialTransactions)
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const authToken = useAuthAccessToken()
  const { wallets } = useWallets()

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((category) => category.status !== 'INACTIVE')
        .map((category) => ({
          value: category.categoryId,
          label: category.name,
          type: category.type,
        })),
    [categories],
  )

  const categoryNameById = useMemo(() => {
    const entries = categories.map((category) => [category.categoryId, category.name] as const)
    return new Map(entries)
  }, [categories])

  const authConfig = useMemo(() => {
    if (!authToken?.accessToken) {
      return null
    }

    return authToken
  }, [authToken])

  const refreshCategories = useCallback(async () => {
    if (!authConfig) {
      setCategories([])
      return
    }

    try {
      const response = await fetchCategories(authConfig)
      setCategories(response)
    } catch (caughtError) {
      console.error('Fetch categories failed', caughtError)
    }
  }, [authConfig])

  const refreshTransactions = useCallback(async () => {
    if (!authConfig) {
      setTransactions([])
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const records = await fetchTransactions(authConfig)
      setTransactions(records.map((record) => mapRecordToItem(record, wallets, categoryNameById)))
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Fetch failed.'
      console.error('Fetch transactions failed', caughtError)
      setError(message)
      setTransactions(initialTransactions)
    } finally {
      setIsLoading(false)
    }
  }, [authConfig, wallets, categoryNameById])

  useEffect(() => {
    void refreshTransactions()
  }, [refreshTransactions])

  useEffect(() => {
    void refreshCategories()
  }, [refreshCategories])

  const addTransaction = useCallback(
    async (payload: CreateTransactionDto) => {
      if (!authConfig) {
        setError('Missing authentication. Please sign in again.')
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        const record = await createTransactionApi(payload, authConfig)
        const nextItem = mapRecordToItem(record, wallets, categoryNameById)
        setTransactions((current) => [nextItem, ...current])
        return true
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : 'Create failed.'
        console.error('Create transaction failed', caughtError)
        setError(message)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [authConfig, wallets, categoryNameById],
  )

  const updateTransaction = useCallback(
    async (id: string, payload: UpdateTransactionDto) => {
      if (!authConfig) {
        setError('Missing authentication. Please sign in again.')
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        const record = await updateTransactionApi(id, payload, authConfig)
        const nextItem = mapRecordToItem(record, wallets, categoryNameById)
        setTransactions((current) => current.map((item) => (item.id === id ? nextItem : item)))
        return true
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : 'Update failed.'
        console.error('Update transaction failed', caughtError)
        setError(message)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [authConfig, wallets, categoryNameById],
  )

  const deleteTransaction = useCallback(
    async (id: string) => {
      setTransactions((current) => current.filter((transaction) => transaction.id !== id))

      if (!authConfig) {
        return false
      }

      try {
        await deleteTransactionApi(id, authConfig)
        return true
      } catch (caughtError) {
        console.error('Delete transaction failed', caughtError)
        return false
      }
    },
    [authConfig],
  )

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        categoryOptions,
        isLoading,
        error,
        refreshTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
      }}
    >
      {children}
    </TransactionContext.Provider>
  )
}

export function useTransactions() {
  const context = useContext(TransactionContext)

  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider')
  }

  return context
}
