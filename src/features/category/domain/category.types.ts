export type CategoryType = 'INCOME' | 'EXPENSE'

export type CategoryStatus = 'ACTIVE' | 'INACTIVE'

export type Category = {
  categoryId: string
  userId: string
  name: string
  type: CategoryType
  icon?: string | null
  color?: string | null
  status: CategoryStatus
}

export type CreateCategoryDto = {
  name: string
  type: CategoryType
  icon?: string
  color?: string
}

export type UpdateCategoryDto = {
  name?: string
  type?: CategoryType
  icon?: string
  color?: string
  status?: CategoryStatus
}

export type DeleteCategoryResponse = {
  message: string
  categoryId: string
}
