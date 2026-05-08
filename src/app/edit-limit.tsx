import { router, useLocalSearchParams } from 'expo-router'
import { LimitForm } from '@/shared/components/limit-form'
import { useLimits } from '@/shared/contexts/limit-context'
import { View, Text } from 'react-native'

export default function EditLimitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { limits, updateLimit } = useLimits()
  const limit = limits.find((l) => l.id === id)

  if (!limit) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Không tìm thấy hạn mức này!</Text>
      </View>
    )
  }

  return (
    <LimitForm
      title='SỬA HẠN MỨC'
      submitLabel='CẬP NHẬT'
      initialValues={limit}
      limitId={limit.id}
      onSubmit={(updated) => {
        updateLimit(updated)
        router.back()
      }}
    />
  )
}
