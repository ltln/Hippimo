import Constants from 'expo-constants'
import { Platform } from 'react-native'

const sanitizeDeviceId = (value: string) =>
  value
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)

export const getDeviceId = () => {
  const deviceName = Constants.deviceName ?? 'unknown-device'
  const sessionId = Constants.sessionId ?? 'unknown-session'

  return sanitizeDeviceId(`${Platform.OS}-${deviceName}-${sessionId}`)
}
