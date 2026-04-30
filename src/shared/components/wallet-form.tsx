import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  getWalletTypeMeta,
  type WalletItem,
  type WalletType,
  walletTypes,
} from '@/shared/contexts/wallet-context'
import { formatCurrencyInput } from '@/shared/utils/transaction-form'

type WalletFormProps = {
  title: string
  submitLabel: string
  initialWallet?: WalletItem
  onSubmit: (wallet: WalletItem) => void
}

export function WalletForm({ title, submitLabel, initialWallet, onSubmit }: WalletFormProps) {
  const insets = useSafeAreaInsets()
  const amountInputRef = useRef<TextInput>(null)
  const [name, setName] = useState(initialWallet?.name ?? '')
  const [type, setType] = useState<WalletType>(initialWallet?.type ?? 'cash')
  const [balance, setBalance] = useState(String(initialWallet?.balance ?? 400000))
  const [balanceFocused, setBalanceFocused] = useState(false)

  const displayBalance = useMemo(() => formatCurrencyInput(balance), [balance])

  useEffect(() => {
    if (!balanceFocused) {
      return
    }

    const timeout = setTimeout(() => {
      amountInputRef.current?.focus()
    }, 0)

    return () => clearTimeout(timeout)
  }, [balanceFocused])

  const adjustBalance = (delta: number) => {
    const numericBalance = Number.parseInt(balance || '0', 10)
    setBalance(String(Math.max(0, numericBalance + delta)))
  }

  const handleSave = () => {
    const trimmedName = name.trim()
    const numericBalance = Number.parseInt(balance || '0', 10)

    if (!trimmedName) {
      Alert.alert('Thiếu tên ví', 'Bạn hãy nhập tên ví trước khi lưu.')
      return
    }

    onSubmit({
      id: initialWallet?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmedName,
      type,
      balance: Number.isNaN(numericBalance) ? 0 : numericBalance,
      spent: initialWallet?.spent ?? 0,
    })
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 20, 34) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
            <Ionicons name='arrow-back' size={28} color='#0B1D17' />
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>TÊN VÍ</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder='Nhập tên ví'
            placeholderTextColor='#C7D2CB'
            style={styles.nameInput}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>CHỌN LOẠI VÍ</Text>
          <View style={styles.typeGrid}>
            {walletTypes.map((walletType) => {
              const active = walletType.type === type
              return (
                <Pressable
                  key={walletType.type}
                  onPress={() => setType(walletType.type)}
                  style={[styles.typePill, active && styles.typePillActive]}
                >
                  <MaterialCommunityIcons
                    name={walletType.icon}
                    size={25}
                    color={active ? '#FFFFFF' : '#0B1D17'}
                  />
                  <Text style={[styles.typeText, active && styles.typeTextActive]}>
                    {walletType.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={[styles.card, styles.amountCard]}>
          <Text style={styles.sectionTitle}>SỐ DƯ BAN ĐẦU</Text>
          <View style={styles.amountControls}>
            <Pressable style={styles.amountButton} onPress={() => adjustBalance(-1000)}>
              <Ionicons name='remove' size={26} color='#FF5148' />
            </Pressable>

            <Pressable style={styles.amountCenter} onPress={() => setBalanceFocused(true)}>
              {balanceFocused ? (
                <TextInput
                  ref={amountInputRef}
                  value={balance}
                  onChangeText={(value) => setBalance(value.replace(/[^0-9]/g, ''))}
                  keyboardType='numeric'
                  onFocus={() => setBalanceFocused(true)}
                  onBlur={() => setBalanceFocused(false)}
                  style={styles.amountInput}
                />
              ) : (
                <Text style={styles.amountDisplay}>{displayBalance}</Text>
              )}
              <Text style={styles.amountCurrency}>VND</Text>
            </Pressable>

            <Pressable style={styles.amountButton} onPress={() => adjustBalance(1000)}>
              <Ionicons name='add' size={28} color='#F6C63D' />
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{submitLabel}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

export function WalletTypeIcon({
  type,
  size = 18,
  color = '#FFFFFF',
}: {
  type: WalletType
  size?: number
  color?: string
}) {
  const meta = getWalletTypeMeta(type)
  return <MaterialCommunityIcons name={meta.icon} size={size} color={color} />
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 32,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    width: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '900',
    color: '#0B1D17',
  },
  headerSpacer: {
    width: 42,
  },
  card: {
    backgroundColor: '#128A3D',
    borderRadius: 6,
    padding: 14,
    marginBottom: 34,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  nameInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '800',
    color: '#0B1D17',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  typePill: {
    width: '46%',
    minHeight: 45,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 8,
  },
  typePillActive: {
    backgroundColor: '#063629',
  },
  typeText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0B1D17',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  amountCard: {
    paddingVertical: 22,
  },
  amountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#128A3D',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#073B2C',
  },
  amountCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInput: {
    minWidth: 160,
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    paddingVertical: 0,
    textAlign: 'center',
  },
  amountDisplay: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  amountCurrency: {
    marginTop: 1,
    fontSize: 18,
    color: '#E8FFF0',
  },
  saveButton: {
    backgroundColor: '#063629',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
})
