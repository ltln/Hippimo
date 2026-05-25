export type ReceiptOcrFields = {
  amount: number | null
  amountDebug: {
    line: string
    lineIndex: number
    rowText: string
    rowIndex: number
    columnIndex: number
    matchedValue: string
    parsedValue: number
    score: number
    source: 'ocr-grid' | 'raw-line'
    frame?: {
      top: number
      left: number
      width: number
      height: number
    }
  } | null
  date: string | null
  merchantName: string | null
  currency: string | null
  rawOcrText: string
  receiptImageUri: string
  preprocessedImageUri: string
  preprocessDebug: {
    originalWidth: number
    originalHeight: number
    cropX: number
    cropY: number
    cropWidth: number
    cropHeight: number
  } | null
}
