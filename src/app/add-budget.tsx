import { router } from 'expo-router'
import { BudgetForm } from '@/shared/components/budget-form'
import { useBudgets } from '@/shared/contexts/budget-context'

export default function AddBudgetScreen() {
  const { addBudget } = useBudgets()

  return (
    <BudgetForm
      title='THÊM NGÂN SÁCH'
      submitLabel='LƯU NGÂN SÁCH'
      onSubmit={async (budget) => {
        await addBudget(budget)
        router.back()
      }}
    />
  )
}
