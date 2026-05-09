import { useEffect } from 'react'
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function QrScreen() {
  const [permission, requestPermission] = useCameraPermissions()

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission()
    }
  }, [permission, requestPermission])

  if (!permission) {
    return <View style={styles.loading} />
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionWrap} edges={['top', 'left', 'right']}>
        <Ionicons name='camera-outline' size={48} color='#FFFFFF' />
        <Text style={styles.permissionTitle}>Can camera de quet QR</Text>
        <Text style={styles.permissionText}>
          Vui long cap quyen camera de su dung tinh nang quet QR.
        </Text>
        <Pressable style={styles.permissionButton} onPress={() => requestPermission()}>
          <Text style={styles.permissionButtonText}>Cap quyen camera</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFillObject} facing='back' />

      <SafeAreaView style={styles.overlay} edges={['top', 'left', 'right']}>
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <Ionicons name='arrow-back' size={20} color='#FFFFFF' />
            <Text style={styles.topTitle}>Quet ma</Text>
          </View>
          <View style={styles.topRight}>
            <Pressable style={styles.topIconButton}>
              <Ionicons name='apps-outline' size={18} color='#FFFFFF' />
            </Pressable>
            <Pressable style={styles.topIconButton}>
              <Ionicons name='home-outline' size={18} color='#FFFFFF' />
            </Pressable>
          </View>
        </View>

        <View style={styles.scanArea}>
          <ScanCorner position='topLeft' />
          <ScanCorner position='topRight' />
          <ScanCorner position='bottomLeft' />
          <ScanCorner position='bottomRight' />
          <View style={styles.scanPill}>
            <Text style={styles.scanPillText}>Quet moi ma QR ngan hang</Text>
            <Ionicons name='information-circle-outline' size={16} color='#FFFFFF' />
          </View>
        </View>

        <View style={styles.actionsColumn}>
          <Pressable style={styles.actionButton}>
            <Ionicons name='sparkles-outline' size={20} color='#1B1B1B' />
            <Text style={styles.actionLabel}>Nang cao</Text>
          </Pressable>
          <Pressable style={styles.actionButton}>
            <Ionicons name='image-outline' size={20} color='#1B1B1B' />
            <Text style={styles.actionLabel}>Chon anh QR</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  )
}

function ScanCorner({
  position,
}: {
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
}) {
  const cornerStyles: StyleProp<ViewStyle>[] = [styles.corner]

  if (position === 'topLeft') {
    cornerStyles.push(styles.cornerTop, styles.cornerLeft)
  }

  if (position === 'topRight') {
    cornerStyles.push(styles.cornerTop, styles.cornerRight)
  }

  if (position === 'bottomLeft') {
    cornerStyles.push(styles.cornerBottom, styles.cornerLeft)
  }

  if (position === 'bottomRight') {
    cornerStyles.push(styles.cornerBottom, styles.cornerRight)
  }

  return <View style={cornerStyles} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loading: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  permissionWrap: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  permissionText: {
    color: '#C9C9C9',
    textAlign: 'center',
    fontSize: 14,
  },
  permissionButton: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 20,
    backgroundColor: '#16A34A',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  topRight: {
    flexDirection: 'row',
    gap: 10,
  },
  topIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanPill: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
  },
  scanPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  corner: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderColor: '#16A34A',
  },
  cornerTop: {
    top: 0,
    borderTopWidth: 3,
  },
  cornerBottom: {
    bottom: 0,
    borderBottomWidth: 3,
  },
  cornerLeft: {
    left: 0,
    borderLeftWidth: 3,
  },
  cornerRight: {
    right: 0,
    borderRightWidth: 3,
  },
  actionsColumn: {
    alignItems: 'flex-end',
    gap: 12,
  },
  actionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionLabel: {
    fontSize: 11,
    color: '#1B1B1B',
    fontWeight: '700',
  },
})
