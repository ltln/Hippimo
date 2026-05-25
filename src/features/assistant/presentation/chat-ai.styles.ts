import { StyleSheet } from 'react-native'

import { Typography } from '@/config/constants/theme'

export const styles = StyleSheet.create({
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
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
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
    fontSize: Typography.screenHeaderFontSize,
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
  shineStreak: {
    position: 'absolute',
    top: -60,
    bottom: -60,
    width: 28,
    opacity: 0.55,
    backgroundColor: '#FFFFFF',
  },
  rainbowInner: {
    position: 'relative',
  },
})
