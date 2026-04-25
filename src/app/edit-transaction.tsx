import { router, useLocalSearchParams } from 'expo-router'
import { Alert, Text, View } from 'react-native'

import { TransactionForm } from '@/shared/components/transaction-form'
import { useTransactions } from '@/shared/contexts/transaction-context'
import { getTransactionFormValues } from '@/shared/utils/transaction-form'

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { transactions, updateTransaction } = useTransactions()
  const transaction = transactions.find((item) => item.id === id)

  if (!transaction || !id) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F4F1EF',
          paddingHorizontal: 24,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0B1D17', textAlign: 'center' }}>
          Không tìm thấy giao dịch để chỉnh sửa.
        </Text>
      </View>
    )
  }

  return (
    <TransactionForm
      title='CHỈNH SỬA GIAO DỊCH'
      submitLabel='CẬP NHẬT GIAO DỊCH'
      initialValues={getTransactionFormValues(transaction)}
      transactionId={transaction.id}
      onSubmit={(updatedTransaction) => {
        updateTransaction(updatedTransaction)
        Alert.alert('Đã cập nhật', 'Thông tin giao dịch đã được cập nhật.', [
          { text: 'OK', onPress: () => router.back() },
        ])
      }}
    />
  )
}
