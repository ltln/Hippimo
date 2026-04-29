import * as WebBrowser from 'expo-web-browser'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

WebBrowser.maybeCompleteAuthSession()

export default function OAuthRedirectScreen() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (router.canGoBack()) {
        router.back()
        return
      }

      router.replace('/')
    }, 500)

    return () => {
      clearTimeout(timeout)
    }
  }, [])

  return (
    <View style={styles.container}>
      <ActivityIndicator />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
