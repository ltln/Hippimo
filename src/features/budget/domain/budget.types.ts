export type BudgetPeriodType = 'WEEK' | 'MONTH' | 'YEAR'

export type Budget = {
  budgetId: string
  userId: string
  categoryId: string
  amountLimit: number | string
  periodType: BudgetPeriodType
  periodStart: string
  periodEnd: string
  alertThresholdPercent: number
  spentAmount?: number | string
  remainingAmount?: number | string
  usagePercent?: number
  overThreshold?: boolean
  alertMessage?: string | null
}

export type CreateBudgetDto = {
  categoryId: string
  amountLimit: number
  periodType: BudgetPeriodType
  periodStart: string
  alertThresholdPercent?: number
}

export type UpdateBudgetDto = {
  categoryId?: string
  amountLimit?: number
  periodType?: BudgetPeriodType
  periodStart?: string
  alertThresholdPercent?: number
}

export type DeleteBudgetResponse = {
  message: string
  budgetId: string
}
