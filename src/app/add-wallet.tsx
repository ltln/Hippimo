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
      onSubmit={async (wallet) => {
        try {
          await addWallet(wallet)
          router.replace('/(tabs)/wallet')
        } catch (error) {
          Alert.alert(
            'Không lưu được ví',
            error instanceof Error ? error.message : 'Vui lòng thử lại.',
          )
        }
      }}
    />
  )
}
