import { router } from 'expo-router'
import { LimitForm } from '@/shared/components/limit-form'
import { useLimits } from '@/shared/contexts/limit-context'

export default function AddLimitScreen() {
  const { addLimit } = useLimits()

  return (
    <LimitForm
      title='THÊM HẠN MỨC'
      submitLabel='LƯU HẠN MỨC'
      onSubmit={(limit) => {
        addLimit(limit)
        router.back()
      }}
    />
  )
}
