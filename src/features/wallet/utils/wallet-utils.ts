import { Alert, Platform } from 'react-native'

import type { TransactionItem } from '@/features/transaction/data/transaction-context'
import type { WalletItem } from '@/features/wallet/data/wallet-context'

export function transactionBelongsToWallet(transaction: TransactionItem, wallet: WalletItem) {
  if (transaction.type === 'transfer') {
    return (
      transaction.transferFromWalletId === wallet.id ||
      transaction.transferToWalletId === wallet.id ||
      transaction.detail.tags[0]
        ?.toLocaleLowerCase('vi-VN')
        .includes(wallet.name.toLocaleLowerCase('vi-VN'))
    )
  }

  return (
    transaction.walletId === wallet.id ||
    transaction.detail.tags[0]?.trim().toLocaleLowerCase('vi-VN') ===
      wallet.name.trim().toLocaleLowerCase('vi-VN')
  )
}

export function getTransferWallets(transaction: TransactionItem) {
  const transferTag = transaction.detail.tags[0] ?? ''
  const [fromWallet, toWallet] = transferTag.split('->').map((value) => value.trim())

  return {
    fromWallet: fromWallet || transaction.detail.footer,
    toWallet: toWallet || 'Ví nhận',
  }
}

export function getPercentColor(percent: number) {
  if (percent >= 70) return '#79F4A6'
  if (percent >= 40) return '#FFCD24'
  if (percent >= 20) return '#FFB0A4'
  return '#FF6A5E'
}

export function confirmDelete(message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    const confirmFn = typeof window !== 'undefined' ? window.confirm : undefined
    if (!confirmFn || confirmFn(message)) {
      onConfirm()
    }
    return
  }

  setTimeout(() => {
    Alert.alert('Xóa ví', message, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: onConfirm },
    ])
  }, 50)
}
