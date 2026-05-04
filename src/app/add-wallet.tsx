import { router } from 'expo-router'

import { WalletForm } from '@/features/wallet/presentation/components/wallet-form'
import { useWallets } from '@/features/wallet/data/wallet-context'

export default function AddWalletScreen() {
  const { addWallet } = useWallets()

  return (
    <WalletForm
      title='TẠO VÍ'
      submitLabel='LƯU VÍ'
      onSubmit={(wallet) => {
        addWallet(wallet)
        router.back()
      }}
    />
  )
}
