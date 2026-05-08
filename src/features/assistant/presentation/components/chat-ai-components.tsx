import type { PropsWithChildren } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { Text, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import { rainbowColors, type ChatMessage } from '../chat-ai.constants'
import { styles } from '../chat-ai.styles'

export function RainbowFrame({
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

export function ChatBubble({ message }: { message: ChatMessage }) {
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
