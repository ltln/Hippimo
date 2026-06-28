import { router, useLocalSearchParams } from 'expo-router'
import { Alert } from 'react-native'

import { useTransactions } from '@/features/transaction/data/transaction-context'
import { TransactionForm } from '@/features/transaction/presentation/components/transaction-form'
import { defaultTransactionFormValues } from '@/features/transaction/utils/transaction-form'

export default function AddTransactionScreen() {
  const { addTransaction } = useTransactions()
  const params = useLocalSearchParams<{
    amount?: string | string[]
    receiptImageUri?: string | string[]
  }>()

  const scannedAmount = Array.isArray(params.amount) ? params.amount[0] : params.amount
  const receiptImageUri = Array.isArray(params.receiptImageUri)
    ? params.receiptImageUri[0]
    : params.receiptImageUri

  const initialValues = {
    ...defaultTransactionFormValues,
    amount: scannedAmount?.trim() || defaultTransactionFormValues.amount,
  }

  return (
    <TransactionForm
      title='THÊM GIAO DỊCH'
      submitLabel='LƯU GIAO DỊCH'
      initialValues={initialValues}
      initialReceiptImageUri={receiptImageUri}
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
