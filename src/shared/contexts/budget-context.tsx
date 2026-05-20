import type { ComponentProps, PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import type {
  Budget,
  BudgetPeriodType,
  CreateBudgetDto,
} from '@/features/budget/domain/budget.types'
import {
  createBudget,
  deleteBudget as deleteBudgetApi,
  listBudgets,
  updateBudget as updateBudgetApi,
} from '@/features/budget/data/budget-api'
import { useAuth } from '@/features/auth/data/auth-context'
import { useCategories } from '@/features/category/data/use-categories'
import { getCategoryColor, getCategoryIcon } from '@/features/transaction/utils/transaction-form'

export type BudgetPeriod = 'weekly' | 'monthly'

export type BudgetItem = {
  id: string
  title: string
  amount: number
  spent: number
  period: BudgetPeriod
  category?: string // All categories if undefined
  categoryId?: string
  startDate: string // ISO date
  endDate?: string
  icon: ComponentProps<typeof MaterialCommunityIcons>['name']
  iconColor?: string
}

type BudgetContextValue = {
  budgets: BudgetItem[]
  addBudget: (budget: BudgetItem) => Promise<void>
  updateBudget: (budget: BudgetItem) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
}

const initialBudgets: BudgetItem[] = [
  {
    id: 'budget-1',
    title: 'Ăn uống hàng tuần',
    amount: 5000000,
    spent: 1200000,
    period: 'weekly',
    category: 'Ăn uống',
    startDate: '2026-05-01',
    endDate: '2026-05-07', // Tự động tính 7 ngày[cite: 2]
    icon: 'silverware-fork-knife',
    iconColor: '#F0C65A',
  },
  {
    id: 'budget-2',
    title: 'Tiền nhà tháng 5',
    amount: 500000,
    spent: 150000,
    period: 'monthly',
    category: 'Nhà cửa',
    startDate: '2026-05-01',
    icon: 'home-city-outline',
    iconColor: '#3D94C6',
  },
]

const BudgetContext = createContext<BudgetContextValue | null>(null)

const mapApiPeriodToBudgetPeriod = (period: BudgetPeriodType): BudgetPeriod => {
  if (period === 'WEEK') return 'weekly'
  if (period === 'MONTH') return 'monthly'
  return 'monthly'
}

const mapBudgetPeriodToApiPeriod = (period: BudgetPeriod): BudgetPeriodType => {
  return period === 'weekly' ? 'WEEK' : 'MONTH'
}

const normalizeDateOnly = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value.split('T')[0] ?? value
  }
  return date.toISOString().split('T')[0]
}

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const numeric = Number(value)
    return Number.isNaN(numeric) ? 0 : numeric
  }
  return 0
}

const buildBudgetTitle = (categoryName: string, period: BudgetPeriod) => {
  return `${categoryName} ${period === 'weekly' ? 'hàng tuần' : 'hàng tháng'}`
}

type CategorySummary = {
  name: string
  icon?: string | null
  color?: string | null
}

const mapApiBudgetToBudgetItem = (budget: Budget, category?: CategorySummary) => {
  const period = mapApiPeriodToBudgetPeriod(budget.periodType)
  const categoryName = category?.name ?? 'Danh mục'
  const startDate = normalizeDateOnly(budget.periodStart)
  const endDate = normalizeDateOnly(budget.periodEnd)

  return {
    id: budget.budgetId,
    title: buildBudgetTitle(categoryName, period),
    amount: toNumber(budget.amountLimit),
    spent: toNumber(budget.spentAmount ?? 0),
    period,
    category: categoryName,
    categoryId: budget.categoryId,
    startDate,
    endDate,
    icon: (category?.icon as BudgetItem['icon'] | undefined) ?? getCategoryIcon(categoryName),
    iconColor: category?.color ?? getCategoryColor(categoryName),
  }
}

export function BudgetProvider({ children }: PropsWithChildren) {
  const { authResponse } = useAuth()
  const accessToken = authResponse?.tokens.accessToken
  const { categories } = useCategories({ type: 'EXPENSE', status: 'ACTIVE' })
  const [apiBudgets, setApiBudgets] = useState<Budget[]>([])
  const [budgets, setBudgets] = useState<BudgetItem[]>(initialBudgets)

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category.categoryId, category]))
  }, [categories])

  useEffect(() => {
    if (!accessToken) {
      setApiBudgets([])
      setBudgets(initialBudgets)
      return
    }

    let isMounted = true

    const loadBudgets = async () => {
      try {
        const data = await listBudgets(accessToken)
        if (isMounted) {
          setApiBudgets(data)
        }
      } catch (error) {
        console.error('Failed to load budgets', error)
        if (isMounted) {
          setApiBudgets([])
          setBudgets(initialBudgets)
        }
      }
    }

    loadBudgets()

    return () => {
      isMounted = false
    }
  }, [accessToken])

  useEffect(() => {
    if (!accessToken) {
      return
    }

    if (apiBudgets.length === 0) {
      setBudgets(initialBudgets)
      return
    }

    const mapped = apiBudgets.map((budget) =>
      mapApiBudgetToBudgetItem(budget, categoryById.get(budget.categoryId)),
    )
    setBudgets(mapped)
  }, [accessToken, apiBudgets, categoryById])

  const addBudget = async (budget: BudgetItem) => {
    if (!accessToken) {
      setBudgets((current) => [budget, ...current])
      return
    }

    if (!budget.categoryId) {
      throw new Error('Missing category id')
    }

    const payload: CreateBudgetDto = {
      categoryId: budget.categoryId,
      amountLimit: budget.amount,
      periodType: mapBudgetPeriodToApiPeriod(budget.period),
      periodStart: budget.startDate,
      alertThresholdPercent: 80,
    }

    const created = await createBudget(payload, accessToken)
    setApiBudgets((current) => [created, ...current])
  }

  const updateBudget = async (budget: BudgetItem) => {
    if (!accessToken) {
      setBudgets((current) => current.map((item) => (item.id === budget.id ? budget : item)))
      return
    }

    if (!budget.categoryId) {
      throw new Error('Missing category id')
    }

    const updated = await updateBudgetApi(
      budget.id,
      {
        categoryId: budget.categoryId,
        amountLimit: budget.amount,
        periodType: mapBudgetPeriodToApiPeriod(budget.period),
        periodStart: budget.startDate,
        alertThresholdPercent: 80,
      },
      accessToken,
    )

    setApiBudgets((current) =>
      current.map((item) => (item.budgetId === updated.budgetId ? updated : item)),
    )
  }

  const deleteBudget = async (id: string) => {
    if (!accessToken) {
      setBudgets((current) => current.filter((budget) => budget.id !== id))
      return
    }

    await deleteBudgetApi(id, accessToken)
    setApiBudgets((current) => current.filter((budget) => budget.budgetId !== id))
  }

  return (
    <BudgetContext.Provider value={{ budgets, addBudget, updateBudget, deleteBudget }}>
      {children}
    </BudgetContext.Provider>
  )
}

export function useBudgets() {
  const context = useContext(BudgetContext)

  if (!context) {
    throw new Error('useBudgets must be used within a BudgetProvider')
  }

  return context
}
