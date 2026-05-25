import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { TamaguiProvider } from 'tamagui'
import appTamaguiConfig from 'tamagui.config'

import { AuthGate, AuthProvider } from '@/features/auth/data/auth-context'
import { TransactionProvider } from '@/features/transaction/data/transaction-context'
import { WalletProvider } from '@/features/wallet/data/wallet-context'
import { BudgetProvider } from '@/shared/contexts/budget-context'
import { useColorScheme } from '@/shared/hooks/use-color-scheme'

export const unstable_settings = {
  anchor: '(tabs)',
}

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <TamaguiProvider config={appTamaguiConfig} defaultTheme={colorScheme!}>
      <SafeAreaProvider>
        <AuthProvider>
          <WalletProvider>
            <BudgetProvider>
              <TransactionProvider>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <AuthGate>
                    <Stack
                      screenOptions={{
                        animation: 'slide_from_right',
                        animationDuration: 240,
                      }}
                    >
                      <Stack.Screen name='login' options={{ headerShown: false }} />
                      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
                      <Stack.Screen name='add-transaction' options={{ headerShown: false }} />
                      <Stack.Screen name='edit-transaction' options={{ headerShown: false }} />
                      <Stack.Screen name='add-wallet' options={{ headerShown: false }} />
                      <Stack.Screen name='edit-wallet' options={{ headerShown: false }} />
                      <Stack.Screen name='add-budget' options={{ headerShown: false }} />
                      <Stack.Screen name='edit-budget' options={{ headerShown: false }} />
                      <Stack.Screen name='account-info' options={{ headerShown: false }} />
                      <Stack.Screen name='oauthredirect' options={{ headerShown: false }} />
                      <Stack.Screen
                        name='modal'
                        options={{
                          animation: 'fade_from_bottom',
                          presentation: 'modal',
                          title: 'Modal',
                        }}
                      />
                    </Stack>
                  </AuthGate>
                  <StatusBar style='auto' />
                </ThemeProvider>
              </TransactionProvider>
            </BudgetProvider>
          </WalletProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </TamaguiProvider>
  )
}
