import { router } from 'expo-router'

import { TransactionForm } from '@/shared/components/transaction-form'
import { useTransactions } from '@/shared/contexts/transaction-context'

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
