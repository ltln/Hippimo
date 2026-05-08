import type { ComponentProps } from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export type PromptKey = 'habits' | 'search' | 'forecast' | 'health'
export type MessageRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: MessageRole
  text: string
}

export type AssistantPrompt = {
  key: PromptKey
  title: string
  question: string
  icon: ComponentProps<typeof MaterialCommunityIcons>['name']
}

export const assistantPrompts: AssistantPrompt[] = [
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

export const rainbowColors = ['#FF5F6D', '#FFCF33', '#33D17A', '#2EC7FF', '#8D6BFF', '#FF6BD6']

export const stopWords = new Set([
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
