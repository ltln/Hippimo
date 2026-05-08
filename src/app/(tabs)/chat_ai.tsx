import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  ChatBubble,
  RainbowFrame,
} from '@/features/assistant/presentation/components/chat-ai-components'
import {
  assistantPrompts,
  type ChatMessage,
} from '@/features/assistant/presentation/chat-ai.constants'
import { styles } from '@/features/assistant/presentation/chat-ai.styles'
import { answerQuestion, buildAssistantData } from '@/features/assistant/utils/assistant-logic'
import { useTransactions } from '@/features/transaction/data/transaction-context'
import { useWallets } from '@/features/wallet/data/wallet-context'

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
