import type { ComponentProps, PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useAuthAccessToken } from '@/features/auth/data/auth-context'
import {
  addMoneyToWallet as addMoneyToWalletApi,
  createWallet as createWalletApi,
  deleteWallet as deleteWalletApi,
  fetchWallets,
  updateWallet as updateWalletApi,
  type CreateWalletDto,
  type UpdateWalletDto,
  type WalletRecord,
  type WalletTypeApi,
} from '@/features/wallet/data/wallet-api'

export type WalletType = 'cash' | 'bank' | 'saving' | 'digital'

export type WalletItem = {
  id: string
  name: string
  type: WalletType
  balance: number
  spent: number
}

export const walletTypes: {
  type: WalletType
  label: string
  icon: ComponentProps<typeof MaterialCommunityIcons>['name']
}[] = [
  { type: 'cash', label: 'TIỀN MẶT', icon: 'cash' },
  { type: 'bank', label: 'NGÂN HÀNG', icon: 'bank' },
  { type: 'saving', label: 'TIẾT KIỆM', icon: 'sack' },
  { type: 'digital', label: 'VÍ ĐIỆN TỬ', icon: 'wallet' },
]

const initialWallets: WalletItem[] = [
  { id: 'cash-main', name: 'Ví 1', type: 'cash', balance: 400000, spent: 1000000 },
  { id: 'bank-main', name: 'Ví 2', type: 'bank', balance: 2300000, spent: 750000 },
  { id: 'saving-main', name: 'Ví 3', type: 'saving', balance: 1500000, spent: 250000 },
  { id: 'momo-main', name: 'Ví 4', type: 'digital', balance: 620000, spent: 380000 },
]

type WalletContextValue = {
  wallets: WalletItem[]
  isLoading: boolean
  error: string | null
  refreshWallets: () => Promise<void>
  addWallet: (payload: CreateWalletDto) => Promise<boolean>
  updateWallet: (id: string, payload: UpdateWalletDto, nextBalance?: number) => Promise<boolean>
  deleteWallet: (id: string) => Promise<boolean>
  getWalletById: (id: string | undefined) => WalletItem | undefined
  getWalletByName: (name: string | undefined) => WalletItem | undefined
}

const WalletContext = createContext<WalletContextValue | null>(null)

const mapWalletType = (type: WalletTypeApi): WalletType => {
  switch (type) {
    case 'BANK_ACCOUNT':
      return 'bank'
    case 'SAVINGS':
      return 'saving'
    case 'E_WALLET':
      return 'digital'
    case 'CASH':
    case 'CREDIT_CARD':
    case 'OTHER':
    default:
      return 'cash'
  }
}

const mapRecordToWallet = (record: WalletRecord): WalletItem => ({
  id: record.walletId,
  name: record.name,
  type: mapWalletType(record.type),
  balance: Number(record.balance),
  spent: 0,
})

export function WalletProvider({ children }: PropsWithChildren) {
  const [wallets, setWallets] = useState(initialWallets)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const authToken = useAuthAccessToken()

  const authConfig = useMemo(() => {
    if (!authToken?.accessToken) {
      return null
    }

    return authToken
  }, [authToken])

  const refreshWallets = useCallback(async () => {
    if (!authConfig) {
      setWallets([])
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const records = await fetchWallets(authConfig)
      setWallets(records.map(mapRecordToWallet))
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Fetch failed.'
      console.error('Fetch wallets failed', caughtError)
      setError(message)
      setWallets(initialWallets)
    } finally {
      setIsLoading(false)
    }
  }, [authConfig])

  useEffect(() => {
    void refreshWallets()
  }, [refreshWallets])

  const addWallet = useCallback(
    async (payload: CreateWalletDto) => {
      if (!authConfig) {
        setError('Missing authentication. Please sign in again.')
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        const record = await createWalletApi(payload, authConfig)
        const nextWallet = mapRecordToWallet(record)
        setWallets((current) => [nextWallet, ...current])
        return true
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : 'Create failed.'
        console.error('Create wallet failed', caughtError)
        setError(message)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [authConfig],
  )

  const updateWallet = useCallback(
    async (id: string, payload: UpdateWalletDto, nextBalance?: number) => {
      if (!authConfig) {
        setError('Missing authentication. Please sign in again.')
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        const updateResponse = await updateWalletApi(id, payload, authConfig)
        let finalRecord = updateResponse

        if (typeof nextBalance === 'number') {
          const currentWallet = wallets.find((wallet) => wallet.id === id)
          const delta = Math.round(nextBalance - (currentWallet?.balance ?? 0))

          if (delta < 0) {
            setError('Không thể giảm số dư bằng thao tác cập nhật ví.')
            return false
          }

          if (delta > 0) {
            finalRecord = await addMoneyToWalletApi(id, { amount: delta }, authConfig)
          }
        }

        const nextWallet = mapRecordToWallet(finalRecord)
        setWallets((current) => current.map((item) => (item.id === id ? nextWallet : item)))
        return true
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : 'Update failed.'
        console.error('Update wallet failed', caughtError)
        setError(message)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [authConfig, wallets],
  )

  const deleteWallet = useCallback(
    async (id: string) => {
      setWallets((current) => current.filter((wallet) => wallet.id !== id))

      if (!authConfig) {
        return false
      }

      try {
        await deleteWalletApi(id, authConfig)
        return true
      } catch (caughtError) {
        console.error('Delete wallet failed', caughtError)
        return false
      }
    },
    [authConfig],
  )

  const getWalletById = (id: string | undefined) => wallets.find((wallet) => wallet.id === id)

  const getWalletByName = (name: string | undefined) => {
    if (!name) {
      return undefined
    }

    const normalizedName = name.trim().toLocaleLowerCase('vi-VN')
    return wallets.find(
      (wallet) => wallet.name.trim().toLocaleLowerCase('vi-VN') === normalizedName,
    )
  }

  return (
    <WalletContext.Provider
      value={{
        wallets,
        isLoading,
        error,
        refreshWallets,
        addWallet,
        updateWallet,
        deleteWallet,
        getWalletById,
        getWalletByName,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallets() {
  const context = useContext(WalletContext)

  if (!context) {
    throw new Error('useWallets must be used within a WalletProvider')
  }

  return context
}

export function getWalletTypeMeta(type: WalletType) {
  return walletTypes.find((walletType) => walletType.type === type) ?? walletTypes[0]
}

export function formatVnd(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value)} VND`
}
