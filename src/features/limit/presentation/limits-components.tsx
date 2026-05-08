import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import type { LimitItem } from '@/shared/contexts/limit-context'
import { styles } from '@/features/limit/presentation/limits.styles'

export function LimitCard({ limit, onDelete }: { limit: LimitItem; onDelete: () => void }) {
  const percent = Math.min(1, limit.spent / limit.amount)
  const isOver = limit.spent > limit.amount

  const renderPeriodInfo = () => {
    if (limit.period === 'weekly' && limit.startDate && limit.endDate) {
      const start = new Date(limit.startDate).toLocaleDateString('vi-VN')
      const end = new Date(limit.endDate).toLocaleDateString('vi-VN')
      return `${start} - ${end}`
    }
    if (limit.period === 'monthly' && limit.startDate) {
      const date = new Date(limit.startDate)
      return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`
    }
    return ''
  }

  return (
    <View style={styles.limitCard}>
      <View style={styles.limitHeader}>
        <View style={styles.limitIconBg}>
          <MaterialCommunityIcons name={limit.icon as any} size={24} color='#FFFFFF' />
        </View>
        <View style={styles.limitTitleArea}>
          <Text style={styles.limitTitle}>{limit.title}</Text>
          <Text style={styles.limitSub}>
            {limit.category || 'Tất cả danh mục'} • {renderPeriodInfo()}
          </Text>
        </View>
        <View style={styles.limitActions}>
          <Pressable
            onPress={() => router.push({ pathname: '/edit-limit', params: { id: limit.id } })}
          >
            <MaterialCommunityIcons name='pencil-outline' size={20} color='#0B1D17' />
          </Pressable>
          <Pressable onPress={onDelete}>
            <MaterialCommunityIcons name='trash-can-outline' size={20} color='#FF5252' />
          </Pressable>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${percent * 100}%`, backgroundColor: isOver ? '#FF5252' : '#179041' },
            ]}
          />
        </View>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressText}>
            Đã dùng:{' '}
            <Text style={{ fontWeight: '800' }}>
              {new Intl.NumberFormat('vi-VN').format(limit.spent)}đ
            </Text>
          </Text>
          <Text style={styles.progressText}>
            Hạn mức:{' '}
            <Text style={{ fontWeight: '800' }}>
              {new Intl.NumberFormat('vi-VN').format(limit.amount)}đ
            </Text>
          </Text>
        </View>
      </View>
    </View>
  )
}
