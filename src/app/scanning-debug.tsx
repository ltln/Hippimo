import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { getScanningDebugResult } from '@/features/scanner/data/scanning-debug-store'

export default function ScanningDebugScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const result = id ? getScanningDebugResult(id) : null

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name='chevron-back' size={24} color='#0B2C20' />
          </Pressable>
          <Text style={styles.title}>Scanner Debug</Text>
        </View>

        {!result ? (
          <View style={styles.emptyState}>
            <Ionicons name='document-text-outline' size={36} color='#6B7D73' />
            <Text style={styles.emptyTitle}>No scan result</Text>
            <Text style={styles.emptyText}>
              Capture or pick a receipt image from scanner first.
            </Text>
          </View>
        ) : (
          <View style={styles.stack}>
            <Image
              source={{ uri: result.receiptImageUri }}
              style={styles.preview}
              resizeMode='cover'
            />
            <DebugRow label='receiptImageUri' value={result.receiptImageUri} />

            <Text style={styles.sectionTitle}>Preprocessed OCR image</Text>
            <Image
              source={{ uri: result.preprocessedImageUri }}
              style={styles.preview}
              resizeMode='cover'
            />
            <DebugRow label='preprocessedImageUri' value={result.preprocessedImageUri} />
            {result.preprocessDebug ? (
              <DebugRow
                label='crop'
                value={`x ${result.preprocessDebug.cropX}, y ${
                  result.preprocessDebug.cropY
                }, width ${result.preprocessDebug.cropWidth}, height ${
                  result.preprocessDebug.cropHeight
                } from ${result.preprocessDebug.originalWidth}x${
                  result.preprocessDebug.originalHeight
                }`}
              />
            ) : null}

            <DebugRow label='amount' value={formatNullable(result.amount)} />
            <View style={styles.debugBlock}>
              <Text style={styles.debugTitle}>amount source</Text>
              {result.amountDebug ? (
                <>
                  <DebugRow
                    label='line'
                    value={`${result.amountDebug.lineIndex + 1}: ${result.amountDebug.line}`}
                    compact
                  />
                  <DebugRow
                    label='rowText'
                    value={`${result.amountDebug.rowIndex + 1}: ${result.amountDebug.rowText}`}
                    compact
                  />
                  <DebugRow
                    label='columnIndex'
                    value={String(result.amountDebug.columnIndex)}
                    compact
                  />
                  <DebugRow label='matchedValue' value={result.amountDebug.matchedValue} compact />
                  <DebugRow
                    label='parsedValue'
                    value={String(result.amountDebug.parsedValue)}
                    compact
                  />
                  <DebugRow label='score' value={String(result.amountDebug.score)} compact />
                  <DebugRow label='source' value={result.amountDebug.source} compact />
                  {result.amountDebug.frame ? (
                    <DebugRow
                      label='frame'
                      value={`top ${Math.round(result.amountDebug.frame.top)}, left ${Math.round(
                        result.amountDebug.frame.left,
                      )}, width ${Math.round(result.amountDebug.frame.width)}, height ${Math.round(
                        result.amountDebug.frame.height,
                      )}`}
                      compact
                    />
                  ) : null}
                </>
              ) : (
                <Text style={styles.emptyDebugText}>(no amount candidate)</Text>
              )}
            </View>
            <DebugRow label='date' value={formatNullable(result.date)} />
            <DebugRow label='merchantName' value={formatNullable(result.merchantName)} />
            <DebugRow label='currency' value={formatNullable(result.currency)} />

            <View style={styles.rawBlock}>
              <Text style={styles.rawLabel}>rawOcrText</Text>
              <Text style={styles.rawText}>{result.rawOcrText || '(empty)'}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function DebugRow({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <View style={[styles.row, compact && styles.compactRow]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

function formatNullable(value: number | string | null) {
  if (value === null || value === '') {
    return '(null)'
  }

  return String(value)
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EF',
  },
  content: {
    padding: 18,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    marginRight: 40,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '900',
    color: '#081A13',
  },
  emptyState: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0B2C20',
  },
  emptyText: {
    maxWidth: 260,
    textAlign: 'center',
    color: '#5E7067',
    fontSize: 13,
  },
  stack: {
    gap: 12,
  },
  preview: {
    width: '100%',
    aspectRatio: 0.72,
    borderRadius: 12,
    backgroundColor: '#D8D1CA',
  },
  sectionTitle: {
    marginTop: 4,
    color: '#0B2C20',
    fontSize: 15,
    fontWeight: '900',
  },
  row: {
    gap: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  compactRow: {
    borderRadius: 8,
    padding: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    color: '#315245',
  },
  value: {
    color: '#10231B',
    fontSize: 14,
    fontWeight: '700',
  },
  debugBlock: {
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#DDE9E1',
    padding: 12,
  },
  debugTitle: {
    color: '#0B2C20',
    fontSize: 13,
    fontWeight: '900',
  },
  emptyDebugText: {
    color: '#5E7067',
    fontSize: 13,
    fontWeight: '700',
  },
  rawBlock: {
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#0B1D17',
    padding: 12,
  },
  rawLabel: {
    color: '#B7D8C6',
    fontSize: 12,
    fontWeight: '900',
  },
  rawText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
  },
})
