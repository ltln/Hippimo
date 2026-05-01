import type { ComponentProps, PropsWithChildren } from 'react'
import { createContext, useContext, useState } from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export type LimitPeriod = 'weekly' | 'monthly'

export type LimitItem = {
  id: string
  title: string
  amount: number
  spent: number
  period: LimitPeriod
  category?: string // All categories if undefined
  startDate: string // ISO date
  endDate?: string
  icon: ComponentProps<typeof MaterialCommunityIcons>['name']
}

type LimitContextValue = {
  limits: LimitItem[]
  addLimit: (limit: LimitItem) => void
  updateLimit: (limit: LimitItem) => void
  deleteLimit: (id: string) => void
}

const initialLimits: LimitItem[] = [
  {
    id: 'limit-1',
    title: 'Ăn uống hàng tuần',
    amount: 5000000,
    spent: 1200000,
    period: 'weekly',
    category: 'Ăn uống',
    startDate: '2026-05-01',
    endDate: '2026-05-07', // Tự động tính 7 ngày[cite: 2]
    icon: 'silverware-fork-knife',
  },
  {
    id: 'limit-2',
    title: 'Tiền nhà tháng 5',
    amount: 500000,
    spent: 150000,
    period: 'monthly',
    category: 'Nhà cửa',
    startDate: '2026-05-01',
    icon: 'home-city-outline',
  },
]

const LimitContext = createContext<LimitContextValue | null>(null)

export function LimitProvider({ children }: PropsWithChildren) {
  const [limits, setLimits] = useState<LimitItem[]>(initialLimits)

  const addLimit = (limit: LimitItem) => {
    setLimits((current) => [limit, ...current])
  }

  const updateLimit = (limit: LimitItem) => {
    setLimits((current) => current.map((item) => (item.id === limit.id ? limit : item)))
  }

  const deleteLimit = (id: string) => {
    setLimits((current) => current.filter((limit) => limit.id !== id))
  }

  return (
    <LimitContext.Provider value={{ limits, addLimit, updateLimit, deleteLimit }}>
      {children}
    </LimitContext.Provider>
  )
}

export function useLimits() {
  const context = useContext(LimitContext)

  if (!context) {
    throw new Error('useLimits must be used within a LimitProvider')
  }

  return context
}
