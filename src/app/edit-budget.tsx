import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { BudgetForm } from '@/shared/components/budget-form'
import { useBudgets } from '@/shared/contexts/budget-context'

export default function EditBudgetScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const { budgets, updateBudget, refreshBudgets } = useBudgets()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const hasAttemptedRefresh = useRef(false)
  const budget = budgets.find((item) => item.id === id)

  useEffect(() => {
    if (!id || budget || isRefreshing || hasAttemptedRefresh.current) {
      return
    }

    let isMounted = true
    hasAttemptedRefresh.current = true
    setIsRefreshing(true)
    refreshBudgets()
      .catch((error) => console.error('Refresh budgets before edit failed', error))
      .finally(() => {
        if (isMounted) {
          setIsRefreshing(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [budget, id, isRefreshing, refreshBudgets])

  if (id && isRefreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Äang táº£i dá»¯ liá»‡u ngÃ¢n sÃ¡ch...</Text>
      </View>
    )
  }

  if (!budget || !id) {
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
