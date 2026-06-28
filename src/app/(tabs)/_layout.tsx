import { Ionicons } from '@expo/vector-icons'
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs'
import { PlatformPressable } from '@react-navigation/elements'
import { Tabs } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { HapticTab } from '@/shared/components/haptic-tab'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        animation: 'shift',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: true,
        tabBarStyle: {
          height: 72,
          borderTopWidth: 0,
          backgroundColor: '#12392C',
          elevation: 0,
          shadowOpacity: 0,
          overflow: 'visible',
        },
        tabBarItemStyle: {
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#DDF2D2',
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color }) => <Ionicons name='home' size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name='transaction'
        options={{
          title: 'Giao dịch',
          tabBarIcon: ({ color }) => <Ionicons name='swap-horizontal' size={25} color={color} />,
        }}
      />
      <Tabs.Screen
        name='scanner'
        options={{
          title: 'Scanner',
          tabBarStyle: { display: 'none' },
          tabBarLabel: () => null,
          tabBarItemStyle: { paddingTop: 0, paddingBottom: 0 },
          tabBarButton: (props: BottomTabBarButtonProps) => (
            <PlatformPressable {...props} style={[props.style, styles.qrButton]}>
              <View style={styles.qrButtonInner}>
                <Ionicons name='camera-outline' size={28} color='#FFFFFF' />
              </View>
            </PlatformPressable>
          ),
        }}
      />
      <Tabs.Screen
        name='budgets'
        options={{
          title: 'Ngân sách',
          tabBarIcon: ({ color }) => <Ionicons name='stats-chart' size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name='wallet'
        options={{
          title: 'Ví',
          tabBarIcon: ({ color }) => <Ionicons name='wallet-outline' size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name='chat_ai'
        options={{
          href: null,
          title: 'Chat AI',
        }}
      />
      <Tabs.Screen
        name='categories'
        options={{
          href: null,
          title: 'Danh mục',
        }}
      />
      <Tabs.Screen
        name='settings'
        options={{
          href: null,
          title: 'Cài đặt',
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  qrButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
  },
  qrButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#79C77C',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#79C77C',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
})
