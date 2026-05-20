import { router, useLocalSearchParams } from 'expo-router'
import { Alert, Text, View } from 'react-native'
import { BudgetForm } from '@/shared/components/budget-form'
import { useBudgets } from '@/shared/contexts/budget-context'

export default function EditBudgetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { budgets, updateBudget } = useBudgets()
  const budget = budgets.find((item) => item.id === id)

  if (!budget) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Không tìm thấy ngân sách này!</Text>
      </View>
    )
  }

  return (
    <BudgetForm
      title='SỬA NGÂN SÁCH'
      submitLabel='CẬP NHẬT'
      initialValues={budget}
      budgetId={budget.id}
      onSubmit={async (updated) => {
        try {
          await updateBudget(updated)
          router.back()
        } catch (error) {
          Alert.alert(
            'Không thể cập nhật ngân sách',
            error instanceof Error ? error.message : 'Vui lòng thử lại sau.',
          )
        }
      }}
    />
  )
}
