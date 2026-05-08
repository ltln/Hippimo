import { Alert, Platform } from 'react-native'

export function confirmDelete(message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    const confirmFn = typeof window !== 'undefined' ? window.confirm : undefined
    if (!confirmFn || confirmFn(message)) {
      onConfirm()
    }
    return
  }

  setTimeout(() => {
    Alert.alert('Xóa hạn mức', message, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: onConfirm },
    ])
  }, 50)
}
