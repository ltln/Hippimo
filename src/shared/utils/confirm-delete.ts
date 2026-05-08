import { Alert, Platform } from 'react-native'

export function confirmDelete(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    const confirmFn = typeof window !== 'undefined' ? window.confirm : undefined
    const confirmMessage = title ? `${title}\n${message}` : message
    if (!confirmFn || confirmFn(confirmMessage)) {
      onConfirm()
    }
    return
  }

  setTimeout(() => {
    Alert.alert(title, message, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: onConfirm },
    ])
  }, 50)
}
