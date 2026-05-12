import { router } from 'expo-router'
import { Alert } from 'react-native'

import { WalletForm } from '@/features/wallet/presentation/components/wallet-form'
import { useWallets } from '@/features/wallet/data/wallet-context'

export default function AddWalletScreen() {
  const { addWallet } = useWallets()

  return (
    <WalletForm
      title='TẠO VÍ'
      submitLabel='LƯU VÍ'
      onSubmit={async (payload) => {
        const success = await addWallet(payload)
        if (success) {
          router.back()
        } else {
          Alert.alert('Lỗi', 'Không thể tạo ví. Vui lòng thử lại.')
        }
      }}
    />
  )
}
