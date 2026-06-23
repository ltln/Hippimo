import { useCallback, useEffect, useMemo, useState } from 'react'

import { listCategories } from '@/features/category/data/category-api'
import type {
  Category,
  CategoryStatus,
  CategoryType,
} from '@/features/category/domain/category.types'
import { useAuth } from '@/features/auth/data/auth-context'

export type CategoryOption = {
  value: string
  label: string
  id: string
  icon?: string | null
  color?: string | null
}

type UseCategoriesOptions = {
  type?: CategoryType
  status?: CategoryStatus
}

const filterCategories = (categories: Category[], type?: CategoryType, status?: CategoryStatus) => {
  if (!type && !status) {
    return categories
  }

  return categories.filter((category) => {
    if (type && category.type !== type) {
      return false
    }

    if (status && category.status !== status) {
      return false
    }

    return true
  })
}

export const mapCategoriesToOptions = (categories: Category[]): CategoryOption[] =>
  categories.map((category) => ({
    value: category.name,
    label: category.name,
    id: category.categoryId,
    icon: category.icon ?? null,
    color: category.color ?? null,
  }))

export function useCategories(options?: UseCategoriesOptions) {
  const { authResponse } = useAuth()
  const accessToken = authResponse?.tokens.accessToken
  const optionType = options?.type
  const optionStatus = options?.status

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    if (!accessToken) {
      setCategories([])
      setError(null)
      return []
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await listCategories(accessToken)
      setCategories(data)
      return filterCategories(data, optionType, optionStatus)
    } catch (err) {
      setCategories([])
      setError(err instanceof Error ? err.message : 'Failed to load categories.')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, optionStatus, optionType])

  useEffect(() => {
    let isMounted = true

    const loadCategories = async () => {
      if (!accessToken) {
        setCategories([])
        setError(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const data = await listCategories(accessToken)

        if (!isMounted) {
          return
        }

        setCategories(data)
      } catch (err) {
        if (!isMounted) {
          return
        }

        setCategories([])
        setError(err instanceof Error ? err.message : 'Failed to load categories.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadCategories()

    return () => {
      isMounted = false
    }
  }, [accessToken])

  const filteredCategories = useMemo(
    () => filterCategories(categories, optionType, optionStatus),
    [categories, optionStatus, optionType],
  )

  return {
    categories: filteredCategories,
    error,
    isLoading,
    refresh: fetchCategories,
  }
}
