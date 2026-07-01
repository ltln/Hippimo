export type ApiWalletType =
  'CASH' | 'BANK_ACCOUNT' | 'E_WALLET' | 'CREDIT_CARD' | 'SAVINGS' | 'OTHER'

export type Wallet = {
  walletId: string
  userId: string
  name: string
  type: ApiWalletType
  balance: number | string
  isActive: boolean
  createdAt: string
}

export type CreateWalletDto = {
  name: string
  type: ApiWalletType
  balance: number
}

export type UpdateWalletDto = {
  name?: string
  type?: ApiWalletType
  isActive?: boolean
}

export type DeleteWalletResponse = {
  message: string
  walletId: string
}
