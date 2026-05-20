import { router } from 'expo-router'
import { Alert } from 'react-native'
import { BudgetForm } from '@/shared/components/budget-form'
import { useBudgets } from '@/shared/contexts/budget-context'

export default function AddBudgetScreen() {
  const { addBudget } = useBudgets()

  return (
    <BudgetForm
      title='THÊM NGÂN SÁCH'
      submitLabel='LƯU NGÂN SÁCH'
      onSubmit={async (budget) => {
        try {
          await addBudget(budget)
          router.back()
        } catch (error) {
          Alert.alert(
            'Không thể lưu ngân sách',
            error instanceof Error ? error.message : 'Vui lòng thử lại sau.',
          )
        }
      }}
    />
  )
}
