import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { extractReceiptFieldsFromImage } from '@/features/scanner/utils/receipt-ocr'

export default function ScannerScreen() {
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

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
        <Text style={styles.permissionTitle}>Camera permission needed</Text>
        <Text style={styles.permissionText}>
          Allow camera access to scan receipt images on this device.
        </Text>
        <Pressable style={styles.permissionButton} onPress={() => requestPermission()}>
          <Text style={styles.permissionButtonText}>Allow camera</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  const scanImage = async (receiptImageUri: string) => {
    try {
      setScanError(null)
      setIsScanning(true)
      const result = await extractReceiptFieldsFromImage(receiptImageUri)
      router.push({
        pathname: '/add-transaction',
        params: {
          amount: result.amount ? String(Math.round(result.amount)) : '',
          receiptImageUri: result.preprocessedImageUri,
        },
      } as never)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Receipt OCR failed.'
      setScanError(message)
    } finally {
      setIsScanning(false)
    }
  }

  const captureReceipt = async () => {
    if (!cameraRef.current || !isCameraReady || isScanning) {
      return
    }

    const photo = await cameraRef.current.takePictureAsync({ quality: 0.75 })

    if (photo?.uri) {
      await scanImage(photo.uri)
    }
  }

  const pickReceiptImage = async () => {
    if (isScanning) {
      return
    }

    const pickedImage = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    })

    if (!pickedImage.canceled && pickedImage.assets[0]?.uri) {
      await scanImage(pickedImage.assets[0].uri)
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing='back'
        onCameraReady={() => setIsCameraReady(true)}
      />

      <SafeAreaView style={styles.overlay} edges={['top', 'left', 'right']}>
        <View style={styles.topRow}>
          <Pressable style={styles.topIconButton} onPress={() => router.replace('/(tabs)')}>
            <Ionicons name='home-outline' size={18} color='#FFFFFF' />
          </Pressable>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanTitlePill}>
            <Text style={styles.scanTitle}>Quét hóa đơn</Text>
          </View>
          <ScanCorner position='topLeft' />
          <ScanCorner position='topRight' />
          <ScanCorner position='bottomLeft' />
          <ScanCorner position='bottomRight' />
        </View>

        <View style={styles.bottomArea}>
          {scanError ? <Text style={styles.errorText}>{scanError}</Text> : null}

          <View style={styles.actionsRow}>
            <View style={styles.sideAction}>
              <Pressable
                style={styles.actionButton}
                onPress={pickReceiptImage}
                disabled={isScanning}
              >
                <Ionicons name='image-outline' size={20} color='#1B1B1B' />
              </Pressable>
              <Text style={styles.actionLabel}>Chọn ảnh</Text>
            </View>

            <Pressable
              style={[
                styles.captureButton,
                (!isCameraReady || isScanning) && styles.disabledButton,
              ]}
              onPress={captureReceipt}
              disabled={!isCameraReady || isScanning}
            >
              {isScanning ? (
                <ActivityIndicator color='#FFFFFF' />
              ) : (
                <Ionicons name='scan-outline' size={30} color='#FFFFFF' />
              )}
            </Pressable>

            <View style={styles.sideAction} />
          </View>
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
    backgroundColor: '#79C77C',
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
  scanTitlePill: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    backgroundColor: '#79C77C',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    zIndex: 10,
  },
  scanTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  corner: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderColor: '#79C77C',
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
  bottomArea: {
    gap: 14,
  },
  actionsRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideAction: {
    width: 76,
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: -2,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.55,
  },
  errorText: {
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    backgroundColor: 'rgba(180,30,30,0.82)',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
})
