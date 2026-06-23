import type { ComponentProps, PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useAuth } from '@/features/auth/data/auth-context'
import { listCategories } from '@/features/category/data/category-api'
import type { Category } from '@/features/category/domain/category.types'
import {
  createTransaction,
  deleteTransaction as deleteTransactionFromApi,
  listTransactions,
  updateTransaction as updateTransactionFromApi,
} from '@/features/transaction/data/transaction-api'
import type {
  ApiTransactionType,
  Transaction,
} from '@/features/transaction/domain/transaction.types'
import { getCategoryColor, getCategoryIcon } from '@/features/transaction/utils/transaction-form'
import { useWallets } from '@/features/wallet/data/wallet-context'
import { useBudgets } from '@/shared/contexts/budget-context'

export type TransactionType = 'income' | 'expense' | 'transfer'

export type TransactionItem = {
  id: string
  title: string
  amount: string
  amountValue: number
  dateLabel: string
  dateISO: string
  timeLabel?: string
  icon: ComponentProps<typeof MaterialCommunityIcons>['name']
  iconBackground: string
  type: TransactionType
  categoryId?: string
  walletId?: string
  receiptImageUri?: string
  transferFromWalletId?: string
  transferToWalletId?: string
  detail: {
    amountDisplay: string
    amountColor: string
    date: string
    time?: string
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
  addTransaction: (transaction: TransactionItem) => Promise<void>
  updateTransaction: (transaction: TransactionItem) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  refreshTransactions: () => Promise<void>
}

const TransactionContext = createContext<TransactionContextValue | null>(null)

export function TransactionProvider({ children }: PropsWithChildren) {
  const { authResponse } = useAuth()
  const { refreshWallets } = useWallets()
  const { refreshBudgets } = useBudgets()
  const accessToken = authResponse?.tokens.accessToken
  const [transactions, setTransactions] = useState<TransactionItem[]>([])

  const requireAccessToken = useCallback(() => {
    if (!accessToken) {
      throw new Error('Bạn cần đăng nhập để thao tác với giao dịch.')
    }

    return accessToken
  }, [accessToken])

  const loadTransactions = useCallback(async (token: string) => {
    const [transactionData, categoryData] = await Promise.all([
      listTransactions(token),
      listCategories(token),
    ])
    setTransactions(
      transactionData.map((transaction) => mapTransactionFromApi(transaction, categoryData)),
    )
  }, [])

  const refreshTransactions = useCallback(async () => {
    if (!accessToken) {
      setTransactions([])
      return
    }

    await loadTransactions(accessToken)
  }, [accessToken, loadTransactions])

  const refreshRelatedData = useCallback(
    async (action: 'create' | 'update' | 'delete') => {
      const results = await Promise.allSettled([refreshWallets(), refreshBudgets()])
      const [walletResult, budgetResult] = results

      if (walletResult.status === 'rejected') {
        console.error(`Refresh wallets after ${action} transaction failed`, walletResult.reason)
      }

      if (budgetResult.status === 'rejected') {
        console.error(`Refresh budgets after ${action} transaction failed`, budgetResult.reason)
      }
    },
    [refreshBudgets, refreshWallets],
  )

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      if (!accessToken) {
        setTransactions([])
        return
      }

      try {
        const [transactionData, categoryData] = await Promise.all([
          listTransactions(accessToken),
          listCategories(accessToken),
        ])

        if (isMounted) {
          setTransactions(
            transactionData.map((transaction) => mapTransactionFromApi(transaction, categoryData)),
          )
        }
      } catch (error) {
        console.error('Load transactions failed', error)

        if (isMounted) {
          setTransactions([])
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [accessToken])

  const addTransaction = async (transaction: TransactionItem) => {
    const startedAt = Date.now()
    const token = requireAccessToken()
    console.log('[AddTransactionTiming] start', {
      hasReceiptImage: Boolean(transaction.receiptImageUri),
      amount: Math.abs(transaction.amountValue),
      type: transaction.type,
    })

    const createdTransaction = await createTransaction(mapTransactionToApi(transaction), token)
    console.log('[AddTransactionTiming] createTransaction done', {
      durationMs: Date.now() - startedAt,
    })

    const categoriesStartedAt = Date.now()
    const categories = await listCategories(token)
    console.log('[AddTransactionTiming] listCategories done', {
      durationMs: Date.now() - categoriesStartedAt,
      totalDurationMs: Date.now() - startedAt,
    })

    setTransactions((current) => [
      mapTransactionFromApi(createdTransaction, categories),
      ...current,
    ])
    console.log('[AddTransactionTiming] local state updated', {
      totalDurationMs: Date.now() - startedAt,
    })

    const refreshStartedAt = Date.now()
    void refreshRelatedData('create')
      .then(() => {
        console.log('[AddTransactionTiming] background refresh done', {
          durationMs: Date.now() - refreshStartedAt,
          totalDurationMs: Date.now() - startedAt,
        })
      })
      .catch((error) => {
        console.error('Background refresh after create transaction failed', error)
      })
  }

  const updateTransaction = async (transaction: TransactionItem) => {
    const token = requireAccessToken()
    const updatedTransaction = await updateTransactionFromApi(
      transaction.id,
      mapTransactionToApi(transaction),
      token,
    )
    const categories = await listCategories(token)

    setTransactions((current) =>
      current.map((item) =>
        item.id === transaction.id ? mapTransactionFromApi(updatedTransaction, categories) : item,
      ),
    )
    await refreshRelatedData('update')
  }

  const deleteTransaction = async (id: string) => {
    const token = requireAccessToken()
    await deleteTransactionFromApi(id, token)
    setTransactions((current) => current.filter((transaction) => transaction.id !== id))
    await refreshRelatedData('delete')
  }

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        refreshTransactions,
      }}
    >
      {children}
    </TransactionContext.Provider>
  )
}

function mapTransactionFromApi(transaction: Transaction, categories: Category[]): TransactionItem {
  const amountValue = Number(transaction.amount)
  const amount = Number.isNaN(amountValue) ? 0 : amountValue
  const dateISO = transaction.transactionDate.slice(0, 10)
  const dateLabel = formatDateLabel(dateISO)
  const timeLabel = formatTimeLabel(transaction.transactionDate)
  const category = categories.find((item) => item.categoryId === transaction.categoryId)
  const categoryName = category?.name ?? 'Giao dịch'
  const note = transaction.notes?.trim() || 'Không có ghi chú'

  const formattedAmount = `${formatVnd(amount)} VND`

  if (transaction.type === 'TRANSFER') {
    return {
      id: transaction.transactionId,
      title: 'Chuyển tiền ví',
      amount: formattedAmount,
      amountValue: amount,
      dateLabel,
      dateISO,
      timeLabel,
      icon: 'wallet-outline',
      iconBackground: '#8A7DFF',
      type: 'transfer',
      transferFromWalletId: transaction.walletId,
      transferToWalletId: transaction.toWalletId ?? undefined,
      receiptImageUri: undefined,
      detail: {
        amountDisplay: formattedAmount,
        amountColor: '#79F4A6',
        date: dateLabel,
        time: timeLabel,
        tags: [
          transaction.toWalletId
            ? `${transaction.walletId} -> ${transaction.toWalletId}`
            : transaction.walletId,
        ],
        note,
        aiSuggestion: 'Giao dịch chuyển tiền nội bộ',
        footer: 'VÍ CHUYỂN',
        rightContent: 'bank-transfer',
      },
    }
  }

  if (transaction.type === 'INCOME') {
    return {
      id: transaction.transactionId,
      title: categoryName,
      amount: `+${formattedAmount}`,
      amountValue: amount,
      dateLabel,
      dateISO,
      timeLabel,
      icon:
        (category?.icon as ComponentProps<typeof MaterialCommunityIcons>['name'] | undefined) ??
        getCategoryIcon(categoryName),
      iconBackground: category?.color ?? getCategoryColor(categoryName),
      type: 'income',
      categoryId: transaction.categoryId ?? undefined,
      walletId: transaction.walletId,
      receiptImageUri: undefined,
      detail: {
        amountDisplay: `+${formattedAmount}`,
        amountColor: '#79F4A6',
        date: dateLabel,
        time: timeLabel,
        tags: [transaction.walletId],
        note,
        aiSuggestion: `Khoản thu từ ${categoryName.toLowerCase()}`,
        footer: categoryName,
        rightContent: 'icon',
      },
    }
  }

  return {
    id: transaction.transactionId,
    title: categoryName,
    amount: `-${formattedAmount}`,
    amountValue: -amount,
    dateLabel,
    dateISO,
    timeLabel,
    icon:
      (category?.icon as ComponentProps<typeof MaterialCommunityIcons>['name'] | undefined) ??
      getCategoryIcon(categoryName),
    iconBackground: category?.color ?? getCategoryColor(categoryName),
    type: 'expense',
    categoryId: transaction.categoryId ?? undefined,
    walletId: transaction.walletId,
    receiptImageUri: undefined,
    detail: {
      amountDisplay: `-${formattedAmount}`,
      amountColor: '#FFDFD7',
      date: dateLabel,
      time: timeLabel,
      tags: [transaction.walletId],
      note,
      aiSuggestion: `Có vẻ bạn đang chi cho ${categoryName.toLowerCase()}?`,
      footer: categoryName,
      rightContent: 'icon',
    },
  }
}

function mapTransactionToApi(transaction: TransactionItem) {
  const amount = Math.abs(transaction.amountValue)

  if (transaction.type === 'transfer') {
    if (!transaction.transferFromWalletId || !transaction.transferToWalletId) {
      throw new Error('Vui lòng chọn ví gửi và ví nhận.')
    }

    return {
      walletId: transaction.transferFromWalletId,
      toWalletId: transaction.transferToWalletId,
      amount,
      type: 'TRANSFER' as ApiTransactionType,
      transactionDate: formatTransactionDateTime(transaction.dateISO, transaction.timeLabel),
      notes: transaction.detail.note,
      isExcludedFromReport: false,
      isEssential: false,
      receiptImageUri: transaction.receiptImageUri,
    }
  }

  if (!transaction.walletId) {
    throw new Error('Vui lòng chọn ví cho giao dịch.')
  }

  if (!transaction.categoryId) {
    throw new Error('Vui lòng chọn danh mục từ dữ liệu database.')
  }

  return {
    walletId: transaction.walletId,
    categoryId: transaction.categoryId,
    amount,
    type: (transaction.type === 'income' ? 'INCOME' : 'EXPENSE') as ApiTransactionType,
    transactionDate: formatTransactionDateTime(transaction.dateISO, transaction.timeLabel),
    notes: transaction.detail.note,
    isExcludedFromReport: false,
    isEssential: false,
    receiptImageUri: transaction.receiptImageUri,
  }
}

function formatDateLabel(dateISO: string) {
  const [year, month, day] = dateISO.split('-')
  return `${day}-${month}-${year}`
}

function formatTimeLabel(transactionDate: string) {
  const match = transactionDate.match(/T(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : '00:00'
}

function formatTransactionDateTime(dateISO: string, timeLabel = '00:00') {
  return `${dateISO}T${timeLabel}:00`
}

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

export function useTransactions() {
  const context = useContext(TransactionContext)

  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider')
  }

  return context
}
