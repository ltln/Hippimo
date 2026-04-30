import type { ComponentProps, PropsWithChildren } from 'react'
import { createContext, useContext, useState } from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons'

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
  { id: 'cash-main', name: 'Ví ABC', type: 'cash', balance: 400000, spent: 1000000 },
  { id: 'bank-main', name: 'Ngân hàng', type: 'bank', balance: 2300000, spent: 750000 },
  { id: 'saving-main', name: 'Ví dự phòng', type: 'saving', balance: 1500000, spent: 250000 },
  { id: 'momo-main', name: 'MoMo', type: 'digital', balance: 620000, spent: 380000 },
]

type WalletContextValue = {
  wallets: WalletItem[]
  addWallet: (wallet: WalletItem) => void
  updateWallet: (wallet: WalletItem) => void
  deleteWallet: (id: string) => void
  getWalletById: (id: string | undefined) => WalletItem | undefined
  getWalletByName: (name: string | undefined) => WalletItem | undefined
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: PropsWithChildren) {
  const [wallets, setWallets] = useState(initialWallets)

  const addWallet = (wallet: WalletItem) => {
    setWallets((current) => [wallet, ...current])
  }

  const updateWallet = (wallet: WalletItem) => {
    setWallets((current) => current.map((item) => (item.id === wallet.id ? wallet : item)))
  }

  const deleteWallet = (id: string) => {
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
      value={{ wallets, addWallet, updateWallet, deleteWallet, getWalletById, getWalletByName }}
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
