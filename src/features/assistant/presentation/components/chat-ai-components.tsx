import type { PropsWithChildren } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { Animated, Text, View } from 'react-native'
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
  const [frameWidth, setFrameWidth] = useState(0)
  const shineProgress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!frameWidth) {
      return
    }

    shineProgress.setValue(0)

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shineProgress, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ]),
    )

    animation.start()

    return () => {
      animation.stop()
    }
  }, [frameWidth, shineProgress])

  const translateX = shineProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-frameWidth - 60, frameWidth + 60],
  })

  return (
    <View
      style={[styles.rainbowFrame, style]}
      onLayout={(event) => setFrameWidth(event.nativeEvent.layout.width)}
    >
      <View pointerEvents='none' style={styles.rainbowLayer}>
        {rainbowColors.map((color) => (
          <View key={color} style={[styles.rainbowBand, { backgroundColor: color }]} />
        ))}
      </View>
      {frameWidth ? (
        <Animated.View
          pointerEvents='none'
          style={[
            styles.shineStreak,
            {
              transform: [{ translateX }, { rotate: '-20deg' }],
            },
          ]}
        />
      ) : null}
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
