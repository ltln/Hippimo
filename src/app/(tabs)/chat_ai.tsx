import type { ComponentProps, PropsWithChildren } from 'react'
import { useMemo, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTransactions, type TransactionItem } from '@/shared/contexts/transaction-context'
import {
  formatVnd,
  getWalletTypeMeta,
  useWallets,
  type WalletItem,
} from '@/shared/contexts/wallet-context'

type PromptKey = 'habits' | 'search' | 'forecast' | 'health'
type MessageRole = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: MessageRole
  text: string
}

type AssistantPrompt = {
  key: PromptKey
  title: string
  question: string
  icon: ComponentProps<typeof MaterialCommunityIcons>['name']
}

const assistantPrompts: AssistantPrompt[] = [
  {
    key: 'habits',
    title: 'Phân tích\nthói quen',
    question: 'Phân tích thói quen chi tiêu của tôi',
    icon: 'chart-line',
  },
  {
    key: 'search',
    title: 'Tìm kiếm\ngiao dịch',
    question: 'Tìm kiếm giao dịch gần đây',
    icon: 'text-search',
  },
  {
    key: 'forecast',
    title: 'Dự báo\nchi tiêu',
    question: 'Dự báo chi tiêu tháng này',
    icon: 'piggy-bank-outline',
  },
  {
    key: 'health',
    title: 'Sức khỏe\ntài chính',
    question: 'Đánh giá sức khỏe tài chính của tôi',
    icon: 'heart-pulse',
  },
]

const rainbowColors = ['#FF5F6D', '#FFCF33', '#33D17A', '#2EC7FF', '#8D6BFF', '#FF6BD6']

const stopWords = new Set([
  'ai',
  'ban',
  'bao',
  'cai',
  'cho',
  'co',
  'con',
  'cua',
  'da',
  'day',
  'dich',
  'du',
  'duoc',
  'gan',
  'gi',
  'giao',
  'hay',
  'kiem',
  'khong',
  'la',
  'minh',
  'nam',
  'ngay',
  'nhieu',
  'so',
  'tai',
  'thang',
  'the',
  'tim',
  'toi',
  'trong',
  've',
  'vi',
])

export default function ChatAIScreen() {
  const insets = useSafeAreaInsets()
  const { transactions } = useTransactions()
  const { wallets } = useWallets()
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const assistantData = useMemo(
    () => buildAssistantData(transactions, wallets),
    [transactions, wallets],
  )

  const sendQuestion = (rawQuestion = question) => {
    const trimmedQuestion = rawQuestion.trim()

    if (!trimmedQuestion) {
      return
    }

    const timestamp = Date.now()
    const answer = answerQuestion(trimmedQuestion, assistantData)

    setMessages((current) => [
      ...current,
      { id: `${timestamp}-user`, role: 'user', text: trimmedQuestion },
      { id: `${timestamp}-assistant`, role: 'assistant', text: answer },
    ])
    setQuestion('')
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 12, 28) }]}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <RainbowFrame style={styles.aiMarkFrame} innerStyle={styles.aiMarkInner}>
            <Ionicons name='sparkles' size={18} color='#081A13' />
          </RainbowFrame>
          <Text style={styles.headerTitle}>TRỢ LÝ AI</Text>
        </View>

        <View style={styles.promptGrid}>
          {assistantPrompts.map((item) => (
            <RainbowFrame
              key={item.key}
              style={styles.promptFrame}
              innerStyle={styles.promptFrameInner}
            >
              <Pressable onPress={() => sendQuestion(item.question)} style={styles.promptCard}>
                <MaterialCommunityIcons name={item.icon} size={34} color='#FFFFFF' />
                <Text style={styles.promptTitle}>{item.title}</Text>
              </Pressable>
            </RainbowFrame>
          ))}
        </View>

        <RainbowFrame style={styles.inputFrame} innerStyle={styles.inputInner}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            onSubmitEditing={() => sendQuestion()}
            placeholder='Nhập câu hỏi của bạn'
            placeholderTextColor='#D2E4D9'
            returnKeyType='send'
            style={styles.input}
          />
          <Pressable onPress={() => sendQuestion()} hitSlop={8} style={styles.sendButton}>
            <MaterialCommunityIcons name='send' size={20} color='#FFFFFF' />
          </Pressable>
        </RainbowFrame>

        <View style={styles.chatList}>
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function RainbowFrame({
  children,
  style,
  innerStyle,
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>
  innerStyle?: StyleProp<ViewStyle>
}>) {
  return (
    <View style={[styles.rainbowFrame, style]}>
      <View pointerEvents='none' style={styles.rainbowLayer}>
        {rainbowColors.map((color) => (
          <View key={color} style={[styles.rainbowBand, { backgroundColor: color }]} />
        ))}
      </View>
      <View style={[styles.rainbowInner, innerStyle]}>{children}</View>
    </View>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
      {!isUser ? (
        <RainbowFrame style={styles.botAvatarFrame} innerStyle={styles.botAvatarInner}>
          <MaterialCommunityIcons name='robot-happy-outline' size={17} color='#08251A' />
        </RainbowFrame>
      ) : null}

      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.assistantText]}>
          {message.text}
        </Text>
      </View>
    </View>
  )
}

function buildAssistantData(transactions: TransactionItem[], wallets: WalletItem[]) {
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

function answerQuestion(question: string, data: ReturnType<typeof buildAssistantData>) {
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

function answerHabits(data: ReturnType<typeof buildAssistantData>) {
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

function answerRecentTransactions(data: ReturnType<typeof buildAssistantData>) {
  if (data.recentTransactions.length === 0) {
    return 'Không có'
  }

  return `Các giao dịch gần đây:\n${formatTransactionList(
    data.recentTransactions.slice(0, 5),
    data.wallets,
  )}`
}

function answerForecast(data: ReturnType<typeof buildAssistantData>) {
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

function answerHealth(data: ReturnType<typeof buildAssistantData>) {
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

function answerExpenseSummary(data: ReturnType<typeof buildAssistantData>) {
  if (data.expenseTransactions.length === 0) {
    return 'Không có'
  }

  return [
    `Tổng chi tiêu đã ghi nhận là ${formatMoney(data.totalExpenses)}.`,
    `Có ${data.expenseTransactions.length} khoản chi trên ${data.expenseDaysCount} ngày.`,
    `Nhóm chi nhiều nhất là ${data.topCategory.name}: ${formatMoney(data.topCategory.value)}.`,
  ].join('\n')
}

function answerWalletSummary(data: ReturnType<typeof buildAssistantData>) {
  if (data.wallets.length === 0) {
    return 'Không có'
  }

  return `Tổng số dư các ví là ${formatMoney(data.totalBalance)}.\n${formatWalletList(data.wallets)}`
}

function answerLargestExpense(data: ReturnType<typeof buildAssistantData>) {
  if (!data.largestExpense) {
    return 'Không có'
  }

  return `Khoản chi lớn nhất là ${data.largestExpense.title}: ${formatMoney(
    Math.abs(data.largestExpense.amountValue),
  )} vào ngày ${data.largestExpense.dateLabel}.`
}

function answerTransfers(data: ReturnType<typeof buildAssistantData>) {
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 28,
    paddingBottom: 34,
  },
  header: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 34,
  },
  aiMarkFrame: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  aiMarkInner: {
    flex: 1,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#081A13',
    letterSpacing: 0,
  },
  promptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  promptFrame: {
    width: '48%',
    borderRadius: 14,
  },
  promptFrameInner: {
    borderRadius: 12,
    backgroundColor: '#128A3F',
  },
  promptCard: {
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  promptTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 19,
    textAlign: 'center',
  },
  inputFrame: {
    borderRadius: 28,
    marginBottom: 22,
  },
  inputInner: {
    minHeight: 50,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 18,
    paddingRight: 8,
    backgroundColor: '#063D2D',
  },
  input: {
    flex: 1,
    minHeight: 46,
    color: '#FFFFFF',
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '800',
    paddingVertical: 0,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B5B3F',
  },
  chatList: {
    gap: 12,
    paddingBottom: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  botAvatarFrame: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  botAvatarInner: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  userBubble: {
    borderBottomRightRadius: 6,
    backgroundColor: '#063D2D',
  },
  assistantBubble: {
    borderBottomLeftRadius: 6,
    backgroundColor: '#EDF8F1',
  },
  messageText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#0B2C20',
  },
  rainbowFrame: {
    overflow: 'hidden',
    padding: 2,
    position: 'relative',
  },
  rainbowLayer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  rainbowBand: {
    flex: 1,
  },
  rainbowInner: {
    position: 'relative',
  },
})
