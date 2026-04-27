import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'

import { HapticTab } from '@/shared/components/haptic-tab'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#0A251B',
          height: 64,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 10,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#8A9D93',
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <Ionicons name='home' size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name='transaction'
        options={{
          title: 'Giao dịch',
          tabBarIcon: ({ color }) => <Ionicons name='swap-horizontal' size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name='limits'
        options={{
          title: 'Hạn mức',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name='chart-donut' size={25} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='chat_ai'
        options={{
          title: 'Chat AI',
          tabBarIcon: ({ color }) => <Ionicons name='bulb-outline' size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name='wallet'
        options={{
          title: 'Ví',
          tabBarIcon: ({ color }) => <Ionicons name='wallet-outline' size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name='settings'
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color }) => <Ionicons name='settings-outline' size={24} color={color} />,
        }}
      />
    </Tabs>
  )
}
