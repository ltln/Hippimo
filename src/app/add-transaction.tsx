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
      onSubmit={async (transaction) => {
        try {
          await addTransaction(transaction)
          router.replace('/(tabs)/transaction')
        } catch (error) {
          Alert.alert(
            'Không lưu được giao dịch',
            error instanceof Error ? error.message : 'Vui lòng thử lại.',
          )
        }
      }}
    />
  )
}
