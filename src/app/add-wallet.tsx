import { router } from 'expo-router'

import { WalletForm } from '@/shared/components/wallet-form'
import { useWallets } from '@/shared/contexts/wallet-context'

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
