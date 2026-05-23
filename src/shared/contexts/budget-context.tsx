import type { ComponentProps, PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

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
  refreshBudgets: () => Promise<void>
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

const BUDGET_TITLES_KEY = 'hippimo.budget.titles.v1'

const memoryBudgetTitleStore = new Map<string, string>()

const getBudgetTitlesStorageKey = (userId?: string) =>
  userId ? `${BUDGET_TITLES_KEY}.${userId}` : BUDGET_TITLES_KEY

const canUseLocalStorage = () =>
  Platform.OS === 'web' && typeof globalThis.localStorage !== 'undefined'

const getStorageValue = async (key: string) => {
  if (canUseLocalStorage()) {
    return globalThis.localStorage.getItem(key)
  }

  if (await SecureStore.isAvailableAsync()) {
    return SecureStore.getItemAsync(key)
  }

  return memoryBudgetTitleStore.get(key) ?? null
}

const setStorageValue = async (key: string, value: string) => {
  if (canUseLocalStorage()) {
    globalThis.localStorage.setItem(key, value)
    return
  }

  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.setItemAsync(key, value)
    return
  }

  memoryBudgetTitleStore.set(key, value)
}

async function getStoredBudgetTitles(storageKey: string): Promise<Record<string, string>> {
  const storedValue = await getStorageValue(storageKey)

  if (!storedValue) {
    return {}
  }

  try {
    const parsed: unknown = JSON.parse(storedValue)

    if (!parsed || typeof parsed !== 'object') {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] =>
          typeof entry[0] === 'string' && typeof entry[1] === 'string',
      ),
    )
  } catch (error) {
    console.error('Failed to parse stored budget titles', error)
    return {}
  }
}

async function setStoredBudgetTitles(storageKey: string, titles: Record<string, string>) {
  const serializedTitles = JSON.stringify(titles)
  await setStorageValue(storageKey, serializedTitles)
}

const mapApiPeriodToBudgetPeriod = (period: BudgetPeriodType): BudgetPeriod => {
  if (period === 'WEEK') return 'weekly'
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
  if (period === 'weekly') return `${categoryName} hàng tuần`
  return `${categoryName} hàng tháng`
}

type CategorySummary = {
  name: string
  icon?: string | null
  color?: string | null
}

const getAuthUserId = (user: unknown) => {
  if (!user || typeof user !== 'object' || !('userId' in user)) {
    return undefined
  }

  const userId = (user as { userId?: unknown }).userId
  return typeof userId === 'string' ? userId : undefined
}

const mapApiBudgetToBudgetItem = (
  budget: Budget,
  category?: CategorySummary,
  titleOverride?: string,
) => {
  const period = mapApiPeriodToBudgetPeriod(budget.periodType)
  const categoryName = category?.name ?? 'Danh mục'
  const startDate = normalizeDateOnly(budget.periodStart)
  const endDate = normalizeDateOnly(budget.periodEnd)

  return {
    id: budget.budgetId,
    title: titleOverride?.trim() || buildBudgetTitle(categoryName, period),
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
  const storageKey = getBudgetTitlesStorageKey(getAuthUserId(authResponse?.user))
  const { categories } = useCategories({ type: 'EXPENSE', status: 'ACTIVE' })
  const [apiBudgets, setApiBudgets] = useState<Budget[]>([])
  const [budgets, setBudgets] = useState<BudgetItem[]>(initialBudgets)
  const [titleOverrides, setTitleOverrides] = useState<Record<string, string>>({})
  const titleOverridesRef = useRef(titleOverrides)

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category.categoryId, category]))
  }, [categories])

  const fetchBudgets = useCallback(async () => {
    if (!accessToken) {
      return
    }

    const data = await listBudgets(accessToken)
    setApiBudgets(data)
  }, [accessToken])

  useEffect(() => {
    titleOverridesRef.current = titleOverrides
  }, [titleOverrides])

  useEffect(() => {
    let isMounted = true

    const loadStoredTitles = async () => {
      const storedTitles = await getStoredBudgetTitles(storageKey)

      if (Object.keys(storedTitles).length || storageKey === BUDGET_TITLES_KEY) {
        return storedTitles
      }

      return getStoredBudgetTitles(BUDGET_TITLES_KEY)
    }

    loadStoredTitles()
      .then((storedTitles) => {
        if (isMounted) {
          titleOverridesRef.current = storedTitles
          setTitleOverrides(storedTitles)
        }
      })
      .catch((error) => console.error('Failed to load budget titles', error))

    return () => {
      isMounted = false
    }
  }, [storageKey])

  const saveBudgetTitleOverride = useCallback(
    async (id: string, title?: string) => {
      const normalizedTitle = title?.trim()
      const nextTitles = { ...titleOverridesRef.current }

      if (normalizedTitle) {
        nextTitles[id] = normalizedTitle
      } else {
        delete nextTitles[id]
      }

      titleOverridesRef.current = nextTitles
      setTitleOverrides(nextTitles)

      try {
        await setStoredBudgetTitles(storageKey, nextTitles)
      } catch (error) {
        console.error('Failed to save budget title', error)
      }
    },
    [storageKey],
  )

  useEffect(() => {
    if (!accessToken) {
      setApiBudgets([])
      setBudgets(initialBudgets)
      return
    }

    setBudgets([])

    let isMounted = true

    const loadBudgets = async () => {
      try {
        await fetchBudgets()
      } catch (error) {
        console.error('Failed to load budgets', error)
        if (isMounted) {
          setApiBudgets([])
          setBudgets([])
        }
      }
    }

    loadBudgets()

    return () => {
      isMounted = false
    }
  }, [accessToken, fetchBudgets])

  useEffect(() => {
    if (!accessToken) {
      return
    }

    if (apiBudgets.length === 0) {
      setBudgets([])
      return
    }

    const mapped = apiBudgets.map((budget) =>
      mapApiBudgetToBudgetItem(
        budget,
        categoryById.get(budget.categoryId),
        titleOverridesRef.current[budget.budgetId] ?? titleOverrides[budget.budgetId],
      ),
    )
    setBudgets(mapped)
  }, [accessToken, apiBudgets, categoryById, titleOverrides])

  const addBudget = async (budget: BudgetItem) => {
    if (!accessToken) {
      setBudgets((current) => [budget, ...current])
      return
    }

    if (!budget.categoryId) {
      throw new Error('Vui lÃ²ng chá»n danh má»¥c há»£p lá»‡ trÆ°á»›c khi lÆ°u ngÃ¢n sÃ¡ch')
    }

    const payload: CreateBudgetDto = {
      categoryId: budget.categoryId,
      amountLimit: budget.amount,
      periodType: mapBudgetPeriodToApiPeriod(budget.period),
      periodStart: budget.startDate,
      alertThresholdPercent: 80,
    }

    const created = await createBudget(payload, accessToken)

    if (!created?.budgetId) {
      throw new Error('Invalid budget response')
    }

    await saveBudgetTitleOverride(created.budgetId, budget.title)

    try {
      await fetchBudgets()
    } catch (error) {
      console.error('Failed to refresh budgets after create', error)
      setApiBudgets((current) => [created, ...current])
    }
  }

  const updateBudget = async (budget: BudgetItem) => {
    if (!accessToken) {
      setBudgets((current) => current.map((item) => (item.id === budget.id ? budget : item)))
      return
    }

    if (!budget.categoryId) {
      throw new Error('Vui lÃ²ng chá»n danh má»¥c há»£p lá»‡ trÆ°á»›c khi lÆ°u ngÃ¢n sÃ¡ch')
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

    if (!updated?.budgetId) {
      throw new Error('Invalid budget response')
    }

    await saveBudgetTitleOverride(updated.budgetId, budget.title)

    try {
      await fetchBudgets()
    } catch (error) {
      console.error('Failed to refresh budgets after update', error)
      setApiBudgets((current) =>
        current.map((item) => (item.budgetId === updated.budgetId ? updated : item)),
      )
    }
  }

  const deleteBudget = async (id: string) => {
    if (!accessToken) {
      setBudgets((current) => current.filter((budget) => budget.id !== id))
      return
    }

    await deleteBudgetApi(id, accessToken)
    await saveBudgetTitleOverride(id)
    setApiBudgets((current) => current.filter((budget) => budget.budgetId !== id))
  }

  return (
    <BudgetContext.Provider
      value={{ budgets, addBudget, updateBudget, deleteBudget, refreshBudgets: fetchBudgets }}
    >
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
