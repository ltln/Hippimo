import { router, useLocalSearchParams } from 'expo-router'
import { LimitForm } from '@/shared/components/limit-form'
import { useLimits } from '@/shared/contexts/limit-context'

export default function EditLimitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { limits, updateLimit } = useLimits()
  const limit = limits.find((l) => l.id === id)

  if (!limit) return null

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
