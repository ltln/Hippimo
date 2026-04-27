import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { useColorScheme } from '@/shared/hooks/use-color-scheme'
import { TransactionProvider } from '@/shared/contexts/transaction-context'
import { WalletProvider } from '@/shared/contexts/wallet-context'

export const unstable_settings = {
  anchor: '(tabs)',
}

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <SafeAreaProvider>
      <WalletProvider>
        <TransactionProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
              <Stack.Screen name='add-transaction' options={{ headerShown: false }} />
              <Stack.Screen name='edit-transaction' options={{ headerShown: false }} />
              <Stack.Screen name='add-wallet' options={{ headerShown: false }} />
              <Stack.Screen name='edit-wallet' options={{ headerShown: false }} />
              <Stack.Screen name='account-info' options={{ headerShown: false }} />
              <Stack.Screen name='modal' options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style='auto' />
          </ThemeProvider>
        </TransactionProvider>
      </WalletProvider>
    </SafeAreaProvider>
  )
}
