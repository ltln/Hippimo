import { router, useLocalSearchParams } from 'expo-router'
import { Alert, Text, View } from 'react-native'

import { TransactionForm } from '@/features/transaction/presentation/components/transaction-form'
import { useTransactions } from '@/features/transaction/data/transaction-context'
import { useWallets } from '@/features/wallet/data/wallet-context'
import { getTransactionFormValues } from '@/features/transaction/utils/transaction-form'

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { transactions, updateTransaction } = useTransactions()
  const { wallets } = useWallets()
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
      initialValues={getTransactionFormValues(transaction, wallets)}
      transactionId={transaction.id}
      onSubmit={async (updatedTransaction) => {
        try {
          await updateTransaction(updatedTransaction)
          router.replace('/(tabs)/transaction')
        } catch (error) {
          Alert.alert(
            'Không cập nhật được giao dịch',
            error instanceof Error ? error.message : 'Vui lòng thử lại.',
          )
        }
      }}
    />
  )
}
