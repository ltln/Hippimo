import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

// Vẫn giữ lại HapticTab để có hiệu ứng rung nhẹ khi bấm
import { HapticTab } from '@/shared/components/haptic-tab'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Sử dụng HapticTab cho mọi nút bấm trên thanh Navigation
        tabBarButton: HapticTab,

        // --- Bắt đầu phần Style theo Figma ---
        tabBarStyle: {
          backgroundColor: '#0A251B', // Màu nền xanh đen từ thiết kế của bạn
          height: 70, // Chiều cao tối ưu
          borderTopWidth: 0,
          elevation: 0, // Xóa bóng đổ Android
          shadowOpacity: 0, // Xóa bóng đổ iOS
        },
        tabBarActiveTintColor: '#FFFFFF', // Màu trắng khi đang chọn tab
        tabBarInactiveTintColor: '#8A9D93', // Màu xám xanh khi không chọn
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
          marginBottom: 10,
        },
      }}
    >
      {/* 1. Tab Tổng quan */}
      <Tabs.Screen
        name='index'
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <Ionicons name='home' size={24} color={color} />,
        }}
      />

      {/* 2. Tab Giao dịch */}
      <Tabs.Screen
        name='transaction'
        options={{
          title: 'Giao dịch',
          tabBarIcon: ({ color }) => <Ionicons name='add-circle-outline' size={28} color={color} />,
        }}
      />

      {/* 3. Tab Chat AI */}
      <Tabs.Screen
        name='chat_ai'
        options={{
          title: 'Chat AI',
          tabBarIcon: ({ color }) => <Ionicons name='bulb-outline' size={24} color={color} />,
        }}
      />

      {/* 4. Tab Ví */}
      <Tabs.Screen
        name='wallet'
        options={{
          title: 'Ví',
          tabBarIcon: ({ color }) => <Ionicons name='wallet-outline' size={24} color={color} />,
        }}
      />
    </Tabs>
  )
}
