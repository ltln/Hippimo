import { Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { TransactionPageTabs } from '@/features/transaction/presentation/transaction-components'
import { styles } from '@/features/transaction/presentation/transaction.styles'

export default function TransactionStatisticsScreen() {
  const insets = useSafeAreaInsets()

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 12, 28) }]}>
        <Text style={styles.headerTitle}>GIAO DỊCH</Text>
      </View>
      <View style={styles.content}>
        <TransactionPageTabs activeTab='statistics' />
      </View>
    </SafeAreaView>
  )
}
