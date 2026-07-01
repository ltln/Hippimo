import Constants from 'expo-constants'
import { Platform } from 'react-native'

const fallbackApiBaseUrl = 'https://api.example.com'

export const apiBaseUrl = resolveApiBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackApiBaseUrl,
)

function resolveApiBaseUrl(value: string) {
  try {
    const url = new URL(value)

    if (isLocalhost(url.hostname) && Platform.OS !== 'web') {
      const devServerHost = getExpoDevServerHost()
      url.hostname = devServerHost ?? (Platform.OS === 'android' ? '10.0.2.2' : url.hostname)
    }

    return url.toString().replace(/\/$/, '')
  } catch {
    return value.replace(/\/$/, '')
  }
}

function isLocalhost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function getExpoDevServerHost() {
  const constants = Constants as typeof Constants & {
    manifest?: { debuggerHost?: string }
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } }
  }
  const expoConfig = Constants.expoConfig as { hostUri?: string } | null
  const hostUri =
    expoConfig?.hostUri ??
    constants.manifest2?.extra?.expoClient?.hostUri ??
    constants.manifest?.debuggerHost

  if (!hostUri) {
    return null
  }

  try {
    return new URL(`http://${hostUri}`).hostname
  } catch {
    return hostUri.split(':')[0] || null
  }
}
