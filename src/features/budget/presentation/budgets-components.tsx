import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import type { BudgetItem } from '@/shared/contexts/budget-context'
import { styles } from '@/features/budget/presentation/budgets.styles'

export function BudgetCard({ budget, onDelete }: { budget: BudgetItem; onDelete: () => void }) {
  const percent = Math.min(1, budget.spent / budget.amount)
  const isOver = budget.spent > budget.amount

  const renderPeriodInfo = () => {
    if (budget.period === 'weekly' && budget.startDate && budget.endDate) {
      const start = new Date(budget.startDate).toLocaleDateString('vi-VN')
      const end = new Date(budget.endDate).toLocaleDateString('vi-VN')
      return `${start} - ${end}`
    }
    if (budget.period === 'monthly' && budget.startDate) {
      const date = new Date(budget.startDate)
      return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`
    }
    return ''
  }

  return (
    <View style={styles.budgetCard}>
      <View style={styles.budgetHeader}>
        <View style={[styles.budgetIconBg, { backgroundColor: budget.iconColor ?? '#198B3F' }]}>
          <MaterialCommunityIcons name={budget.icon} size={24} color='#FFFFFF' />
        </View>
        <View style={styles.budgetTitleArea}>
          <Text style={styles.budgetTitle}>{budget.title}</Text>
          <Text style={styles.budgetSub}>
            {budget.category || 'Tất cả danh mục'} • {renderPeriodInfo()}
          </Text>
        </View>
        <View style={styles.budgetActions}>
          <Pressable
            onPress={() => router.push({ pathname: '/edit-budget', params: { id: budget.id } })}
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
              {new Intl.NumberFormat('vi-VN').format(budget.spent)}đ
            </Text>
          </Text>
          <Text style={styles.progressText}>
            Ngân sách:{' '}
            <Text style={{ fontWeight: '800' }}>
              {new Intl.NumberFormat('vi-VN').format(budget.amount)}đ
            </Text>
          </Text>
        </View>
      </View>
    </View>
  )
}
