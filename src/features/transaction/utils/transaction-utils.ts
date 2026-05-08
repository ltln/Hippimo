import { Alert, Platform } from 'react-native'

import type { TransactionItem } from '@/features/transaction/data/transaction-context'
import type { WalletItem } from '@/features/wallet/data/wallet-context'

export function normalizeDateQuery(value: string) {
  return value.trim().replaceAll('/', '-')
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
    Alert.alert('Xóa giao dịch', message, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: onConfirm },
    ])
  }, 50)
}

export function getTransferWallets(item: TransactionItem, wallets: WalletItem[]) {
  const transferTag = item.detail.tags[0] ?? ''
  const [fromWallet, toWallet] = transferTag.split('->').map((value) => value.trim())
  const fromWalletItem = wallets.find((wallet) => wallet.id === item.transferFromWalletId)
  const toWalletItem = wallets.find((wallet) => wallet.id === item.transferToWalletId)

  return {
    fromWallet: fromWalletItem?.name ?? fromWallet ?? item.detail.footer,
    toWallet: toWalletItem?.name ?? toWallet ?? 'TIẾT KIỆM',
    fromType: fromWalletItem?.type ?? 'bank',
    toType: toWalletItem?.type ?? 'saving',
  }
}

export function getExpenseWallet(item: TransactionItem, wallets: WalletItem[]) {
  const wallet =
    wallets.find((currentWallet) => currentWallet.id === item.walletId) ??
    wallets.find(
      (currentWallet) =>
        currentWallet.name.trim().toLocaleLowerCase('vi-VN') ===
        item.detail.tags[0]?.trim().toLocaleLowerCase('vi-VN'),
    )

  return {
    wallet,
    name: wallet?.name ?? item.detail.tags[0] ?? '',
    walletType: (item.detail as any).walletType as WalletItem['type'] | undefined,
  }
}
