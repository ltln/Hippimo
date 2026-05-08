import { assistantPrompts, stopWords } from '@/features/assistant/presentation/chat-ai.constants'
import { formatVnd, getWalletTypeMeta } from '@/features/wallet/data/wallet-context'
import type { TransactionItem } from '@/features/transaction/data/transaction-context'
import type { WalletItem } from '@/features/wallet/data/wallet-context'

export function buildAssistantData(transactions: TransactionItem[], wallets: WalletItem[]) {
  const expenseTransactions = transactions.filter((transaction) => transaction.type === 'expense')
  const transferTransactions = transactions.filter((transaction) => transaction.type === 'transfer')
  const recentTransactions = [...transactions].sort((left, right) =>
    right.dateISO.localeCompare(left.dateISO),
  )

  const totalExpenses = expenseTransactions.reduce(
    (sum, transaction) => sum + Math.abs(transaction.amountValue),
    0,
  )
  const totalTransfers = transferTransactions.reduce(
    (sum, transaction) => sum + Math.abs(transaction.amountValue),
    0,
  )
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  const totalWalletSpent = wallets.reduce((sum, wallet) => sum + wallet.spent, 0)
  const expenseDays = new Set(expenseTransactions.map((transaction) => transaction.dateISO))
  const averageDailyExpense = expenseDays.size > 0 ? totalExpenses / expenseDays.size : 0
  const projectedMonthlyExpense = averageDailyExpense * 30

  return {
    transactions,
    wallets,
    expenseTransactions,
    transferTransactions,
    recentTransactions,
    totalExpenses,
    totalTransfers,
    totalBalance,
    totalWalletSpent,
    expenseDaysCount: expenseDays.size,
    averageDailyExpense,
    projectedMonthlyExpense,
    largestExpense: getLargestTransaction(expenseTransactions),
    topCategory: getTopCategory(expenseTransactions),
    topExpenseWallet: getTopExpenseWallet(expenseTransactions, wallets),
    richestWallet: getRichestWallet(wallets),
  }
}

export type AssistantData = ReturnType<typeof buildAssistantData>

export function answerQuestion(question: string, data: AssistantData) {
  const normalizedQuestion = normalizeText(question)
  const prompt = assistantPrompts.find(
    (item) => normalizeText(item.question) === normalizedQuestion,
  )

  if (prompt?.key === 'habits' || hasAny(normalizedQuestion, ['phan tich', 'thoi quen'])) {
    return answerHabits(data)
  }

  if (prompt?.key === 'forecast' || hasAny(normalizedQuestion, ['du bao', 'du kien'])) {
    return answerForecast(data)
  }

  if (prompt?.key === 'health' || hasAny(normalizedQuestion, ['suc khoe', 'tai chinh'])) {
    return answerHealth(data)
  }

  const matchingTransactions = findMatchingTransactions(question, data.transactions, data.wallets)

  if (matchingTransactions.length > 0) {
    return `Mình tìm thấy ${matchingTransactions.length} giao dịch:\n${formatTransactionList(
      matchingTransactions,
      data.wallets,
    )}`
  }

  const matchingWallets = findMatchingWallets(question, data.wallets)

  if (matchingWallets.length > 0) {
    return `Mình tìm thấy ${matchingWallets.length} ví:\n${formatWalletList(matchingWallets)}`
  }

  if (prompt?.key === 'search' || hasAny(normalizedQuestion, ['gan day', 'giao dich'])) {
    return answerRecentTransactions(data)
  }

  if (hasAny(normalizedQuestion, ['tong chi', 'da chi', 'chi tieu', 'tieu bao nhieu'])) {
    return answerExpenseSummary(data)
  }

  if (hasAny(normalizedQuestion, ['so du', 'con bao nhieu', 'vi'])) {
    return answerWalletSummary(data)
  }

  if (hasAny(normalizedQuestion, ['lon nhat', 'cao nhat', 'mac nhat', 'nhieu nhat'])) {
    return answerLargestExpense(data)
  }

  if (hasAny(normalizedQuestion, ['chuyen vi', 'chuyen tien', 'transfer'])) {
    return answerTransfers(data)
  }

  return 'Không có'
}

function answerHabits(data: AssistantData) {
  if (data.expenseTransactions.length === 0) {
    return 'Không có'
  }

  const largestExpense = data.largestExpense
  const largestExpenseText = largestExpense
    ? `Giao dịch chi lớn nhất là ${largestExpense.title} ${formatMoney(
        Math.abs(largestExpense.amountValue),
      )} vào ngày ${largestExpense.dateLabel}.`
    : ''

  return [
    `Bạn có ${data.expenseTransactions.length} khoản chi, tổng ${formatMoney(data.totalExpenses)}.`,
    `Nhóm chi nổi bật là ${data.topCategory.name} với ${formatMoney(data.topCategory.value)}.`,
    `Ví dùng nhiều nhất cho chi tiêu là ${data.topExpenseWallet.name}. ${largestExpenseText}`,
  ].join('\n')
}

function answerRecentTransactions(data: AssistantData) {
  if (data.recentTransactions.length === 0) {
    return 'Không có'
  }

  return `Các giao dịch gần đây:\n${formatTransactionList(
    data.recentTransactions.slice(0, 5),
    data.wallets,
  )}`
}

function answerForecast(data: AssistantData) {
  if (data.expenseTransactions.length === 0 || data.expenseDaysCount === 0) {
    return 'Không có'
  }

  return [
    `Trung bình bạn chi ${formatMoney(data.averageDailyExpense)} mỗi ngày có phát sinh giao dịch.`,
    `Nếu giữ nhịp này trong 30 ngày, chi tiêu dự kiến khoảng ${formatMoney(
      data.projectedMonthlyExpense,
    )}.`,
    `Mốc nên chú ý hiện tại là nhóm ${data.topCategory.name}.`,
  ].join('\n')
}

function answerHealth(data: AssistantData) {
  if (data.wallets.length === 0 && data.transactions.length === 0) {
    return 'Không có'
  }

  const reserveRatio =
    data.totalBalance + data.totalWalletSpent > 0
      ? data.totalBalance / (data.totalBalance + data.totalWalletSpent)
      : 0
  const healthLabel = reserveRatio >= 0.65 ? 'Tốt' : reserveRatio >= 0.4 ? 'Ổn định' : 'Cần chú ý'

  return [
    `Sức khỏe tài chính: ${healthLabel}.`,
    `Tổng số dư hiện có ${formatMoney(data.totalBalance)}, đã sử dụng ${formatMoney(
      data.totalWalletSpent,
    )}.`,
    `Ví mạnh nhất là ${data.richestWallet.name} với ${formatMoney(data.richestWallet.balance)}.`,
  ].join('\n')
}

function answerExpenseSummary(data: AssistantData) {
  if (data.expenseTransactions.length === 0) {
    return 'Không có'
  }

  return [
    `Tổng chi tiêu đã ghi nhận là ${formatMoney(data.totalExpenses)}.`,
    `Có ${data.expenseTransactions.length} khoản chi trên ${data.expenseDaysCount} ngày.`,
    `Nhóm chi nhiều nhất là ${data.topCategory.name}: ${formatMoney(data.topCategory.value)}.`,
  ].join('\n')
}

function answerWalletSummary(data: AssistantData) {
  if (data.wallets.length === 0) {
    return 'Không có'
  }

  return `Tổng số dư các ví là ${formatMoney(data.totalBalance)}.\n${formatWalletList(data.wallets)}`
}

function answerLargestExpense(data: AssistantData) {
  if (!data.largestExpense) {
    return 'Không có'
  }

  return `Khoản chi lớn nhất là ${data.largestExpense.title}: ${formatMoney(
    Math.abs(data.largestExpense.amountValue),
  )} vào ngày ${data.largestExpense.dateLabel}.`
}

function answerTransfers(data: AssistantData) {
  if (data.transferTransactions.length === 0) {
    return 'Không có'
  }

  return [
    `Có ${data.transferTransactions.length} giao dịch chuyển ví, tổng ${formatMoney(
      data.totalTransfers,
    )}.`,
    formatTransactionList(data.transferTransactions.slice(0, 4), data.wallets),
  ].join('\n')
}

function getLargestTransaction(transactions: TransactionItem[]) {
  return transactions.reduce<TransactionItem | null>((largest, transaction) => {
    if (!largest || Math.abs(transaction.amountValue) > Math.abs(largest.amountValue)) {
      return transaction
    }

    return largest
  }, null)
}

function getTopCategory(transactions: TransactionItem[]) {
  const totals = new Map<string, number>()

  transactions.forEach((transaction) => {
    const key = transaction.detail.footer || transaction.title
    totals.set(key, (totals.get(key) ?? 0) + Math.abs(transaction.amountValue))
  })

  return getTopEntry(totals, 'Không có')
}

function getTopExpenseWallet(transactions: TransactionItem[], wallets: WalletItem[]) {
  const totals = new Map<string, number>()

  transactions.forEach((transaction) => {
    const walletName = getExpenseWalletName(transaction, wallets)
    totals.set(walletName, (totals.get(walletName) ?? 0) + Math.abs(transaction.amountValue))
  })

  return getTopEntry(totals, 'Không có')
}

function getTopEntry(entries: Map<string, number>, fallbackName: string) {
  let topEntry = { name: fallbackName, value: 0 }

  entries.forEach((value, name) => {
    if (value > topEntry.value) {
      topEntry = { name, value }
    }
  })

  return topEntry
}

function getRichestWallet(wallets: WalletItem[]) {
  return wallets.reduce(
    (richest, wallet) => (wallet.balance > richest.balance ? wallet : richest),
    wallets[0] ?? { id: 'none', name: 'Không có', type: 'cash', balance: 0, spent: 0 },
  )
}

function findMatchingTransactions(
  question: string,
  transactions: TransactionItem[],
  wallets: WalletItem[],
) {
  const normalizedQuestion = normalizeText(question)
  const tokens = getMeaningfulTokens(normalizedQuestion)

  if (!normalizedQuestion || tokens.length === 0) {
    return []
  }

  return transactions
    .filter((transaction) => {
      const haystack = getTransactionSearchText(transaction, wallets)

      if (normalizedQuestion.length > 2 && haystack.includes(normalizedQuestion)) {
        return true
      }

      return tokens.every((token) => haystack.includes(token))
    })
    .slice(0, 5)
}

function findMatchingWallets(question: string, wallets: WalletItem[]) {
  const normalizedQuestion = normalizeText(question)
  const tokens = getMeaningfulTokens(normalizedQuestion)

  if (!normalizedQuestion || tokens.length === 0) {
    return []
  }

  return wallets
    .filter((wallet) => {
      const walletType = getWalletTypeMeta(wallet.type)
      const haystack = normalizeText(
        [wallet.name, walletType.label, wallet.balance, wallet.spent].join(' '),
      )

      if (normalizedQuestion.length > 2 && haystack.includes(normalizedQuestion)) {
        return true
      }

      return tokens.every((token) => haystack.includes(token))
    })
    .slice(0, 5)
}

function getMeaningfulTokens(value: string) {
  return value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !stopWords.has(token))
}

function getTransactionSearchText(transaction: TransactionItem, wallets: WalletItem[]) {
  const transferWallets = getTransferWalletNames(transaction, wallets)

  return normalizeText(
    [
      transaction.title,
      transaction.amount,
      transaction.amountValue,
      transaction.dateLabel,
      transaction.dateISO,
      transaction.type,
      transaction.detail.amountDisplay,
      transaction.detail.date,
      transaction.detail.footer,
      transaction.detail.note,
      transaction.detail.tags.join(' '),
      getExpenseWalletName(transaction, wallets),
      transferWallets.fromWallet,
      transferWallets.toWallet,
    ].join(' '),
  )
}

function formatTransactionList(transactions: TransactionItem[], wallets: WalletItem[]) {
  return transactions.map((transaction) => formatTransactionLine(transaction, wallets)).join('\n')
}

function formatTransactionLine(transaction: TransactionItem, wallets: WalletItem[]) {
  if (transaction.type === 'transfer') {
    const transferWallets = getTransferWalletNames(transaction, wallets)

    return `- ${transaction.title}: ${transferWallets.fromWallet} -> ${transferWallets.toWallet}, ${transaction.amount}, ${transaction.dateLabel}`
  }

  return `- ${transaction.title}: ${transaction.amount}, ${transaction.dateLabel}, ví ${getExpenseWalletName(
    transaction,
    wallets,
  )}`
}

function formatWalletList(wallets: WalletItem[]) {
  return wallets
    .map((wallet) => {
      const walletType = getWalletTypeMeta(wallet.type)
      return `- ${wallet.name} (${walletType.label}): còn ${formatMoney(
        wallet.balance,
      )}, đã dùng ${formatMoney(wallet.spent)}`
    })
    .join('\n')
}

function getExpenseWalletName(transaction: TransactionItem, wallets: WalletItem[]) {
  const wallet = wallets.find((item) => item.id === transaction.walletId)

  return wallet?.name ?? transaction.detail.tags[0] ?? 'Không có'
}

function getTransferWalletNames(transaction: TransactionItem, wallets: WalletItem[]) {
  const transferTag = transaction.detail.tags[0] ?? ''
  const [fromWalletTag, toWalletTag] = transferTag.split('->').map((value) => value.trim())
  const fromWallet = wallets.find((wallet) => wallet.id === transaction.transferFromWalletId)
  const toWallet = wallets.find((wallet) => wallet.id === transaction.transferToWalletId)

  return {
    fromWallet: fromWallet?.name ?? fromWalletTag ?? transaction.detail.footer,
    toWallet: toWallet?.name ?? toWalletTag ?? 'Ví nhận',
  }
}

function hasAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword))
}

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .trim()
    .toLocaleLowerCase('vi-VN')
}

function formatMoney(value: number) {
  return formatVnd(Math.round(value))
}
