export type ApiTransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

export type Transaction = {
  transactionId: string
  userId: string
  walletId: string
  toWalletId: string | null
  categoryId: string | null
  amount: number | string
  type: ApiTransactionType
  transactionDate: string
  notes?: string | null
  isExcludedFromReport: boolean
  aiSuggestedCategoryId?: string | null
  isEssential: boolean
  createdAt: string
}

export type CreateTransactionDto = {
  walletId: string
  categoryId?: string
  aiSuggestedCategoryId?: string
  toWalletId?: string
  amount: number
  type: ApiTransactionType
  transactionDate: string
  notes?: string
  isExcludedFromReport?: boolean
  isEssential?: boolean
  receiptImageUri?: string
}

export type UpdateTransactionDto = Partial<CreateTransactionDto>

export type DeleteTransactionResponse = {
  message: string
  transactionId: string
}
