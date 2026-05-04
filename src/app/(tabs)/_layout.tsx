import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'

import { HapticTab } from '@/shared/components/haptic-tab'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: true,
        tabBarStyle: {
          height: 72,
          borderTopWidth: 0,
          backgroundColor: '#0A251B',
          elevation: 0,
          shadowOpacity: 0,
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
        tabBarInactiveTintColor: '#8A9D93',
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
        name='chat_ai'
        options={{
          title: 'Chat AI',
          tabBarIcon: ({ color }) => <Ionicons name='bulb-outline' size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name='wallet'
        options={{
          title: 'Ví',
          tabBarIcon: ({ color }) => <Ionicons name='wallet-outline' size={23} color={color} />,
        }}
      />
      <Tabs.Screen name='limits' options={{ href: null }} />
      <Tabs.Screen name='settings' options={{ href: null }} />
    </Tabs>
  )
}
