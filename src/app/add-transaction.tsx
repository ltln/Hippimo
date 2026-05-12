import { router } from 'expo-router'
import { Alert } from 'react-native'

import { TransactionForm } from '@/features/transaction/presentation/components/transaction-form'
import { useTransactions } from '@/features/transaction/data/transaction-context'

export default function AddTransactionScreen() {
  const { addTransaction } = useTransactions()

  return (
    <TransactionForm
      title='THÊM GIAO DỊCH'
      submitLabel='LƯU GIAO DỊCH'
      onSubmit={async (payload) => {
        const success = await addTransaction(payload)
        if (success) {
          router.back()
        } else {
          Alert.alert('Lỗi', 'Không thể tạo giao dịch. Vui lòng thử lại.')
        }
      }}
    />
  )
}
