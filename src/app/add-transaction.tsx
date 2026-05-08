import { router } from 'expo-router'

import { TransactionForm } from '@/features/transaction/presentation/components/transaction-form'
import { useTransactions } from '@/features/transaction/data/transaction-context'

export default function AddTransactionScreen() {
  const { addTransaction } = useTransactions()

  return (
    <TransactionForm
      title='THÊM GIAO DỊCH'
      submitLabel='LƯU GIAO DỊCH'
      onSubmit={(transaction) => {
        addTransaction(transaction)
        router.back()
      }}
    />
  )
}
