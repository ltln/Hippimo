import TextRecognition, {
  Frame,
  TextRecognitionResult,
  TextRecognitionScript,
} from '@react-native-ml-kit/text-recognition'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'

import { ReceiptOcrFields } from '@/features/scanner/domain/receipt-ocr.types'

const CURRENCY_CODES = ['VND', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CNY', 'AUD', 'CAD', 'SGD', 'THB']

const TOTAL_KEYWORDS = [
  'total',
  'amount due',
  'balance due',
  'grand total',
  'payment',
  'paid',
  'tong',
  'tong cong',
  'tong tien',
  'tong thanh toan',
  'can thanh toan',
  'phai tra',
  'cong tien hang',
  'thanh tien',
  'thanh toan',
  'tien thanh toan',
  'so tien',
]

const LINE_AMOUNT_SKIP_KEYWORDS = [
  'phone',
  'tel',
  'hotline',
  'mst',
  'ma so thue',
  'tax code',
  'invoice no',
  'bill no',
  'receipt no',
  'order',
  'table',
  'ban',
  'cashier',
  'thu ngan',
  'wifi',
]

const NON_MERCHANT_KEYWORDS = [
  'receipt',
  'invoice',
  'bill',
  'date',
  'time',
  'cashier',
  'total',
  'tax',
  'subtotal',
  'visa',
  'mastercard',
]

type PreprocessedImage = {
  uri: string
  debug: ReceiptOcrFields['preprocessDebug']
}

type OcrGridCell = {
  text: string
  lineIndex: number
  rowIndex: number
  columnIndex: number
  rowText: string
  source: 'ocr-grid' | 'raw-line'
  frame?: Frame
}

export async function extractReceiptFieldsFromImage(
  receiptImageUri: string,
): Promise<ReceiptOcrFields> {
  const preprocessedImage = await preprocessReceiptImage(receiptImageUri)
  const result = await TextRecognition.recognize(preprocessedImage.uri, TextRecognitionScript.LATIN)
  const rawOcrText = result.text.trim()

  return extractReceiptFieldsFromGrid(
    rawOcrText,
    receiptImageUri,
    preprocessedImage,
    createOcrGrid(result),
  )
}

export function extractReceiptFields(
  rawOcrText: string,
  receiptImageUri: string,
): ReceiptOcrFields {
  return extractReceiptFieldsFromGrid(
    rawOcrText,
    receiptImageUri,
    { uri: receiptImageUri, debug: null },
    createRawLineGrid(rawOcrText),
  )
}

function extractReceiptFieldsFromGrid(
  rawOcrText: string,
  receiptImageUri: string,
  preprocessedImage: PreprocessedImage,
  gridCells: OcrGridCell[],
): ReceiptOcrFields {
  const lines = gridCells.map((cell) => cell.rowText).filter(Boolean)
  const uniqueLines = [...new Set(lines)]
  const amountResult = extractAmount(gridCells)

  return {
    amount: amountResult?.parsedValue ?? null,
    amountDebug: amountResult,
    date: extractDate(rawOcrText),
    merchantName: extractMerchantName(uniqueLines),
    currency: extractCurrency(rawOcrText),
    rawOcrText,
    receiptImageUri,
    preprocessedImageUri: preprocessedImage.uri,
    preprocessDebug: preprocessedImage.debug,
  }
}

async function preprocessReceiptImage(receiptImageUri: string): Promise<PreprocessedImage> {
  const imageInfo = await manipulateAsync(receiptImageUri, [], {
    compress: 1,
    format: SaveFormat.JPEG,
  })

  const crop = getReceiptBodyCrop(imageInfo.width, imageInfo.height)

  if (!crop) {
    return { uri: imageInfo.uri, debug: null }
  }

  const preprocessedImage = await manipulateAsync(
    imageInfo.uri,
    [
      {
        crop: {
          originX: crop.cropX,
          originY: crop.cropY,
          width: crop.cropWidth,
          height: crop.cropHeight,
        },
      },
      { resize: { width: 1200 } },
    ],
    { compress: 0.95, format: SaveFormat.JPEG },
  )

  return { uri: preprocessedImage.uri, debug: crop }
}

function getReceiptBodyCrop(width: number, height: number): ReceiptOcrFields['preprocessDebug'] {
  if (width <= 0 || height <= 0) {
    return null
  }

  const isTallReceiptPhoto = height / width >= 1.05
  const cropWidthRatio = isTallReceiptPhoto ? 0.56 : 0.78
  const cropHeightRatio = isTallReceiptPhoto ? 0.68 : 0.78
  const cropYRatio = isTallReceiptPhoto ? 0.1 : 0.06
  const cropWidth = Math.round(width * cropWidthRatio)
  const cropHeight = Math.round(height * cropHeightRatio)
  const cropX = Math.round((width - cropWidth) / 2)
  const cropY = Math.round(height * cropYRatio)

  return {
    originalWidth: width,
    originalHeight: height,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
  }
}

function extractAmount(gridCells: OcrGridCell[]) {
  const receiptRightEdge = Math.max(
    ...gridCells.map((cell) => (cell.frame ? cell.frame.left + cell.frame.width : 0)),
    0,
  )
  const receiptBottomEdge = Math.max(
    ...gridCells.map((cell) => (cell.frame ? cell.frame.top + cell.frame.height : 0)),
    0,
  )

  const candidates = gridCells.flatMap((cell) => {
    const normalizedLine = normalizeSearchText(`${cell.rowText} ${cell.text}`)
    const shouldSkipLine = LINE_AMOUNT_SKIP_KEYWORDS.some((keyword) =>
      normalizedLine.includes(keyword),
    )

    if (shouldSkipLine) {
      return []
    }

    const keywordScore = TOTAL_KEYWORDS.some((keyword) => normalizedLine.includes(keyword))
      ? 100
      : 0
    const currencyScore = hasCurrencyMarker(`${cell.rowText} ${cell.text}`) ? 10 : 0
    const bottomScore = getBottomScore(cell, gridCells.length, receiptBottomEdge)
    const rightScore = getRightScore(cell, receiptRightEdge)
    const gridScore = cell.source === 'ocr-grid' ? 8 : 0

    return findMoneyValues(cell.text).map(({ matchedValue, parsedValue }) => ({
      line: cell.text,
      lineIndex: cell.lineIndex,
      rowText: cell.rowText,
      rowIndex: cell.rowIndex,
      columnIndex: cell.columnIndex,
      matchedValue,
      parsedValue,
      score: keywordScore + currencyScore + bottomScore + rightScore + gridScore,
      source: cell.source,
      frame: cell.frame,
    }))
  })

  if (!candidates.length) {
    return null
  }

  candidates.sort(
    (a, b) => b.score - a.score || b.rowIndex - a.rowIndex || b.parsedValue - a.parsedValue,
  )
  return candidates[0]
}

function createOcrGrid(result: TextRecognitionResult): OcrGridCell[] {
  const positionedCells = result.blocks
    .flatMap((block) => block.lines)
    .filter((line) => line.text.trim())
    .map((line, lineIndex) => ({
      text: line.text.trim(),
      frame: line.frame,
      lineIndex,
    }))
    .filter((line): line is { text: string; frame: Frame; lineIndex: number } =>
      Boolean(line.frame),
    )

  if (!positionedCells.length) {
    return createRawLineGrid(result.text)
  }

  const rows = positionedCells
    .sort((a, b) => a.frame.top - b.frame.top || a.frame.left - b.frame.left)
    .reduce<{ centerY: number; height: number; cells: typeof positionedCells }[]>((acc, cell) => {
      const centerY = cell.frame.top + cell.frame.height / 2
      const row = acc.find((candidate) => {
        const tolerance = Math.max(12, candidate.height * 0.75, cell.frame.height * 0.75)

        return Math.abs(candidate.centerY - centerY) <= tolerance
      })

      if (row) {
        row.cells.push(cell)
        row.centerY = (row.centerY + centerY) / 2
        row.height = Math.max(row.height, cell.frame.height)
      } else {
        acc.push({ centerY, height: cell.frame.height, cells: [cell] })
      }

      return acc
    }, [])
    .sort((a, b) => a.centerY - b.centerY)

  return rows.flatMap((row, rowIndex) => {
    const cells = row.cells.sort((a, b) => a.frame.left - b.frame.left)
    const rowText = cells.map((cell) => cell.text).join(' ')

    return cells.map((cell, columnIndex) => ({
      text: cell.text,
      lineIndex: cell.lineIndex,
      rowIndex,
      columnIndex,
      rowText,
      source: 'ocr-grid' as const,
      frame: cell.frame,
    }))
  })
}

function createRawLineGrid(rawOcrText: string): OcrGridCell[] {
  return rawOcrText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({
      text: line,
      lineIndex: index,
      rowIndex: index,
      columnIndex: 0,
      rowText: line,
      source: 'raw-line' as const,
    }))
}

function getBottomScore(cell: OcrGridCell, fallbackRowCount: number, receiptBottomEdge: number) {
  if (cell.frame && receiptBottomEdge > 0) {
    return Math.round(((cell.frame.top + cell.frame.height) / receiptBottomEdge) * 24)
  }

  return Math.min(cell.rowIndex, Math.min(fallbackRowCount, 24))
}

function getRightScore(cell: OcrGridCell, receiptRightEdge: number) {
  if (!cell.frame || receiptRightEdge <= 0) {
    return 0
  }

  const rightRatio = (cell.frame.left + cell.frame.width) / receiptRightEdge

  if (rightRatio >= 0.82) {
    return 24
  }

  if (rightRatio >= 0.68) {
    return 14
  }

  return 0
}

function findMoneyValues(text: string) {
  const values: { matchedValue: string; parsedValue: number }[] = []
  const matches = text.matchAll(
    /(?:[$]\s*)?(-?\d[\d., ]{1,18})(?:\s*(?:VND|USD|EUR|GBP|JPY|KRW|CNY|AUD|CAD|SGD|THB|d|\u0111))?/gi,
  )

  for (const match of matches) {
    const matchedValue = match[1]
    const parsedValue = parseReceiptNumber(matchedValue)

    if (parsedValue !== null && parsedValue > 0 && parsedValue <= 500000000) {
      values.push({ matchedValue, parsedValue })
    }
  }

  return values
}

function parseReceiptNumber(value: string) {
  const compactValue = value.replace(/\s/g, '')
  const hasComma = compactValue.includes(',')
  const hasDot = compactValue.includes('.')

  let normalizedValue = compactValue

  if (hasComma && hasDot) {
    const decimalSeparator =
      compactValue.lastIndexOf(',') > compactValue.lastIndexOf('.') ? ',' : '.'
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ','
    normalizedValue = compactValue.replaceAll(thousandsSeparator, '').replace(decimalSeparator, '.')
  } else if (hasComma) {
    normalizedValue = normalizeSingleSeparatorNumber(compactValue, ',')
  } else if (hasDot) {
    normalizedValue = normalizeSingleSeparatorNumber(compactValue, '.')
  }

  const amount = Number(normalizedValue)
  return Number.isFinite(amount) ? amount : null
}

function normalizeSingleSeparatorNumber(value: string, separator: ',' | '.') {
  const parts = value.split(separator)
  const lastPart = parts.at(-1)

  if (lastPart && parts.length > 1 && (lastPart.length === 3 || parts.length > 2)) {
    return parts.join('')
  }

  return value.replace(separator, '.')
}

function extractDate(text: string) {
  const datePatterns = [
    /\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/,
    /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/,
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{2,4}\b/i,
    /\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{2,4}\b/i,
  ]

  for (const pattern of datePatterns) {
    const match = text.match(pattern)

    if (match) {
      return match[0]
    }
  }

  return null
}

function extractCurrency(text: string) {
  const upperText = text.toUpperCase()
  const normalizedText = normalizeSearchText(text).toUpperCase()
  const code = CURRENCY_CODES.find((currencyCode) => upperText.includes(currencyCode))

  if (code || normalizedText.includes('VND')) {
    return code ?? 'VND'
  }

  if (hasCurrencyMarker(text)) {
    return 'VND'
  }

  return null
}

function extractMerchantName(lines: string[]) {
  for (const line of lines.slice(0, 8)) {
    const normalizedLine = normalizeSearchText(line)
    const hasAmount = findMoneyValues(line).length > 0
    const hasDate = extractDate(line) !== null
    const isMetadata = NON_MERCHANT_KEYWORDS.some((keyword) => normalizedLine.includes(keyword))

    if (!hasAmount && !hasDate && !isMetadata && line.length >= 2) {
      return line
    }
  }

  return lines[0] ?? null
}

function hasCurrencyMarker(text: string) {
  return (
    /(^|\s)\d[\d., ]+\s*(d|\u0111|vnd|vn\u0111)(?=\s|$)/i.test(text) || /vnd|vn\u0111/i.test(text)
  )
}

function normalizeSearchText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .toLowerCase()
}
