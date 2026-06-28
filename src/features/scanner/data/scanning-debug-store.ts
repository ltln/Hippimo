import { ReceiptOcrFields } from '@/features/scanner/domain/receipt-ocr.types'

const debugResults = new Map<string, ReceiptOcrFields>()

export function saveScanningDebugResult(result: ReceiptOcrFields) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  debugResults.set(id, result)

  return id
}

export function getScanningDebugResult(id: string) {
  return debugResults.get(id) ?? null
}
