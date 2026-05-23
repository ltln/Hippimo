import type { ComponentProps, PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useAuth } from '@/features/auth/data/auth-context'
import {
  createWallet,
  deleteWallet as deleteWalletFromApi,
  listWallets,
  updateWallet as updateWalletFromApi,
} from '@/features/wallet/data/wallet-api'
import type { ApiWalletType, Wallet } from '@/features/wallet/domain/wallet.types'

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

type WalletContextValue = {
  wallets: WalletItem[]
  addWallet: (wallet: WalletItem) => Promise<void>
  updateWallet: (wallet: WalletItem) => Promise<void>
  deleteWallet: (id: string) => Promise<void>
  getWalletById: (id: string | undefined) => WalletItem | undefined
  getWalletByName: (name: string | undefined) => WalletItem | undefined
  refreshWallets: () => Promise<void>
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: PropsWithChildren) {
  const { authResponse } = useAuth()
  const accessToken = authResponse?.tokens.accessToken
  const [wallets, setWallets] = useState<WalletItem[]>([])

  const requireAccessToken = useCallback(() => {
    if (!accessToken) {
      throw new Error('Bạn cần đăng nhập để thao tác với ví.')
    }

    return accessToken
  }, [accessToken])

  const refreshWallets = useCallback(async () => {
    if (!accessToken) {
      setWallets([])
      return
    }

    const data = await listWallets(accessToken)
    setWallets(data.map(mapWalletFromApi))
  }, [accessToken])

  useEffect(() => {
    let isMounted = true

    const loadWallets = async () => {
      if (!accessToken) {
        setWallets([])
        return
      }

      try {
        const data = await listWallets(accessToken)

        if (isMounted) {
          setWallets(data.map(mapWalletFromApi))
        }
      } catch (error) {
        console.error('Load wallets failed', error)

        if (isMounted) {
          setWallets([])
        }
      }
    }

    loadWallets()

    return () => {
      isMounted = false
    }
  }, [accessToken])

  const addWallet = async (wallet: WalletItem) => {
    const token = requireAccessToken()
    const createdWallet = await createWallet(
      {
        name: wallet.name,
        type: mapWalletTypeToApi(wallet.type),
        balance: wallet.balance,
      },
      token,
    )

    setWallets((current) => [mapWalletFromApi(createdWallet), ...current])
  }

  const updateWallet = async (wallet: WalletItem) => {
    const token = requireAccessToken()
    const updatedWallet = await updateWalletFromApi(
      wallet.id,
      {
        name: wallet.name,
        type: mapWalletTypeToApi(wallet.type),
      },
      token,
    )

    setWallets((current) =>
      current.map((item) => (item.id === wallet.id ? mapWalletFromApi(updatedWallet) : item)),
    )
  }

  const deleteWallet = async (id: string) => {
    const token = requireAccessToken()
    await deleteWalletFromApi(id, token)
    setWallets((current) => current.filter((wallet) => wallet.id !== id))
  }

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
        addWallet,
        updateWallet,
        deleteWallet,
        getWalletById,
        getWalletByName,
        refreshWallets,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

function mapWalletFromApi(wallet: Wallet): WalletItem {
  const balance = Number(wallet.balance)

  return {
    id: wallet.walletId,
    name: wallet.name,
    type: mapWalletTypeFromApi(wallet.type),
    balance: Number.isNaN(balance) ? 0 : balance,
    spent: 0,
  }
}

function mapWalletTypeToApi(type: WalletType): ApiWalletType {
  switch (type) {
    case 'bank':
      return 'BANK_ACCOUNT'
    case 'saving':
      return 'SAVINGS'
    case 'digital':
      return 'E_WALLET'
    case 'cash':
    default:
      return 'CASH'
  }
}

function mapWalletTypeFromApi(type: ApiWalletType): WalletType {
  switch (type) {
    case 'BANK_ACCOUNT':
    case 'CREDIT_CARD':
      return 'bank'
    case 'SAVINGS':
      return 'saving'
    case 'E_WALLET':
      return 'digital'
    case 'CASH':
    case 'OTHER':
    default:
      return 'cash'
  }
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
