import type { ComponentProps, PropsWithChildren } from 'react'
import { createContext, useContext, useState } from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export type TransactionType = 'expense' | 'transfer'

export type TransactionItem = {
  id: string
  title: string
  amount: string
  amountValue: number
  dateLabel: string
  dateISO: string
  icon: ComponentProps<typeof MaterialCommunityIcons>['name']
  iconBackground: string
  type: TransactionType
  walletId?: string
  transferFromWalletId?: string
  transferToWalletId?: string
  detail: {
    amountDisplay: string
    amountColor: string
    date: string
    tags: string[]
    note: string
    footer: string
    rightContent?: 'icon' | 'bank-transfer'
  }
}

type TransactionContextValue = {
  transactions: TransactionItem[]
  addTransaction: (transaction: TransactionItem) => void
  updateTransaction: (transaction: TransactionItem) => void
  deleteTransaction: (id: string) => void
}

const initialTransactions: TransactionItem[] = [
  {
    id: 'fuel',
    title: 'Đổ xăng',
    amount: '-50.000 VND',
    amountValue: -50000,
    dateLabel: '07-04-2026',
    dateISO: '2026-04-07',
    icon: 'motorbike',
    iconBackground: '#F2A493',
    type: 'expense',
    walletId: 'cash-main',
    detail: {
      amountDisplay: '-50.000 VND',
      amountColor: '#FFB0A4',
      date: '07-04-2026',
      tags: ['Tiền mặt', 'Đổ xăng dùm Lê Thành Phát :)))'],
      note: 'Khoản chi này chiếm 5% ngân sách tháng của bạn. Bạn đang chi tiêu rất hợp lý!',
      footer: 'Đổ xăng',
      rightContent: 'icon',
    },
  },
  {
    id: 'topup',
    title: 'Nạp game',
    amount: '200.000 VND',
    amountValue: 200000,
    dateLabel: '07-04-2026',
    dateISO: '2026-04-07',
    icon: 'gamepad-variant-outline',
    iconBackground: '#7E63F4',
    type: 'transfer',
    transferFromWalletId: 'bank-main',
    transferToWalletId: 'momo-main',
    detail: {
      amountDisplay: '200.000 VND',
      amountColor: '#79F4A6',
      date: '07-04-2026',
      tags: ['Rút tiền đi Vũng Tàu'],
      note: 'Khoản chi này chiếm 5% ngân sách tháng của bạn. Bạn đang chi tiêu rất hợp lý!',
      footer: 'NGÂN HÀNG',
      rightContent: 'bank-transfer',
    },
  },
  {
    id: 'rent',
    title: 'Đóng tiền nhà',
    amount: '-23.000 VND',
    amountValue: -23000,
    dateLabel: '06-04-2026',
    dateISO: '2026-04-06',
    icon: 'home-city-outline',
    iconBackground: '#3D94C6',
    type: 'expense',
    walletId: 'bank-main',
    detail: {
      amountDisplay: '-23.000 VND',
      amountColor: '#FFDFD7',
      date: '06-04-2026',
      tags: ['Chuyển khoản', 'Tiền nhà tháng 4'],
      note: 'Khoản chi cố định đang được theo dõi ổn định. Bạn có thể đặt nhắc trước ngày đến hạn.',
      footer: 'Đóng tiền nhà',
      rightContent: 'icon',
    },
  },
  {
    id: 'market',
    title: 'Đi chợ',
    amount: '-56.300 VND',
    amountValue: -56300,
    dateLabel: '05-04-2026',
    dateISO: '2026-04-05',
    icon: 'basket-outline',
    iconBackground: '#F0C65A',
    type: 'expense',
    walletId: 'cash-main',
    detail: {
      amountDisplay: '-56.300 VND',
      amountColor: '#FFE0B8',
      date: '05-04-2026',
      tags: ['Tiền mặt', 'Mua đồ ăn và trái cây'],
      note: 'Chi tiêu sinh hoạt hôm nay nằm trong mức an toàn. Nhóm ăn uống vẫn đang được kiểm soát tốt.',
      footer: 'Đi chợ',
      rightContent: 'icon',
    },
  },
  {
    id: 'insurance',
    title: 'Đóng bảo hiểm',
    amount: '-7.200 VND',
    amountValue: -7200,
    dateLabel: '02-04-2026',
    dateISO: '2026-04-02',
    icon: 'shield-check-outline',
    iconBackground: '#3897C7',
    type: 'expense',
    walletId: 'bank-main',
    detail: {
      amountDisplay: '-7.200 VND',
      amountColor: '#D4F8E6',
      date: '02-04-2026',
      tags: ['Tự động trừ', 'Bảo hiểm xe máy'],
      note: 'Giao dịch nhỏ nhưng lặp lại định kỳ. Nếu muốn, mình có thể tách riêng nhóm chi phí bảo hiểm sau.',
      footer: 'Đóng bảo hiểm',
      rightContent: 'icon',
    },
  },
  {
    id: 'oil',
    title: 'Thay nhớt',
    amount: '-24.300 VND',
    amountValue: -24300,
    dateLabel: '01-04-2026',
    dateISO: '2026-04-01',
    icon: 'motorbike-electric',
    iconBackground: '#0E3F33',
    type: 'expense',
    walletId: 'cash-main',
    detail: {
      amountDisplay: '-24.300 VND',
      amountColor: '#E1FFE5',
      date: '01-04-2026',
      tags: ['Tiền mặt', 'Bảo dưỡng định kỳ'],
      note: 'Bảo dưỡng phương tiện đang được ghi nhận đầy đủ. Điều này sẽ giúp theo dõi tổng chi phí di chuyển dễ hơn.',
      footer: 'Thay nhớt',
      rightContent: 'icon',
    },
  },
  {
    id: 'wallet-transfer',
    title: 'Chuyển ví dự phòng',
    amount: '350.000 VND',
    amountValue: 350000,
    dateLabel: '29-03-2026',
    dateISO: '2026-03-29',
    icon: 'wallet-outline',
    iconBackground: '#8A7DFF',
    type: 'transfer',
    transferFromWalletId: 'cash-main',
    transferToWalletId: 'saving-main',
    detail: {
      amountDisplay: '350.000 VND',
      amountColor: '#79F4A6',
      date: '29-03-2026',
      tags: ['Ví chính -> Ví dự phòng'],
      note: 'Bạn đã chuyển tiền sang ví dự phòng đúng lúc, giúp ngân sách linh hoạt hơn cho tuần tới.',
      footer: 'VÍ CHÍNH',
      rightContent: 'bank-transfer',
    },
  },
]

const TransactionContext = createContext<TransactionContextValue | null>(null)

export function TransactionProvider({ children }: PropsWithChildren) {
  const [transactions, setTransactions] = useState<TransactionItem[]>(initialTransactions)

  const addTransaction = (transaction: TransactionItem) => {
    setTransactions((current) => [transaction, ...current])
  }

  const updateTransaction = (transaction: TransactionItem) => {
    setTransactions((current) =>
      current.map((item) => (item.id === transaction.id ? transaction : item)),
    )
  }

  const deleteTransaction = (id: string) => {
    setTransactions((current) => current.filter((transaction) => transaction.id !== id))
  }

  return (
    <TransactionContext.Provider
      value={{ transactions, addTransaction, updateTransaction, deleteTransaction }}
    >
      {children}
    </TransactionContext.Provider>
  )
}

export function useTransactions() {
  const context = useContext(TransactionContext)

  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider')
  }

  return context
}
