import type {
  CreateTransactionDto,
  DeleteTransactionResponse,
  Transaction,
  UpdateTransactionDto,
} from '@/features/transaction/domain/transaction.types'
import { fetchWithAuthRetry } from '@/features/auth/data/authenticated-fetch'
import { apiBaseUrl } from '@/infrastructure/api/api-base-url'
import { logBackendRequest, logBackendResponse } from '@/shared/utils/http-debug'

const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, '')

export const transactionsEndpoint = `${normalizedApiBaseUrl}/transactions`

class TransactionApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

const parseResponseBody = (responseText: string) => {
  if (!responseText) {
    return null
  }

  try {
    return JSON.parse(responseText) as unknown
  } catch {
    return responseText
  }
}

const getErrorMessage = (responseBody: unknown, responseText: string) => {
  if (responseBody && typeof responseBody === 'object' && 'message' in responseBody) {
    const message = (responseBody as { message?: unknown }).message
    return typeof message === 'string' ? message : responseText
  }

  return responseText
}

const readResponseBody = async (response: Response) => {
  const responseText = await response.text()
  const responseBody = parseResponseBody(responseText)

  if (!response.ok) {
    throw new TransactionApiError(
      getErrorMessage(responseBody, responseText) || `Backend returned HTTP ${response.status}`,
      response.status,
    )
  }

  return responseBody
}

const buildAuthHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
})

const getReceiptMimeType = (uri: string) => {
  const normalizedUri = uri.toLowerCase()

  if (normalizedUri.endsWith('.png')) {
    return 'image/png'
  }

  if (normalizedUri.endsWith('.heic')) {
    return 'image/heic'
  }

  if (normalizedUri.endsWith('.webp')) {
    return 'image/webp'
  }

  return 'image/jpeg'
}

const getReceiptFilename = (uri: string) => {
  const sanitizedUri = uri.split('?')[0] ?? uri
  const segments = sanitizedUri.split('/')
  const candidate = segments.at(-1)

  return candidate && candidate.includes('.')
    ? candidate
    : `receipt.${getReceiptMimeType(uri).split('/')[1]}`
}

const createTransactionFormData = (payload: CreateTransactionDto) => {
  const formData = new FormData()

  formData.append('walletId', payload.walletId)

  if (payload.type !== 'TRANSFER') {
    formData.append('categoryId', payload.categoryId ?? '')
  }

  if (payload.aiSuggestedCategoryId) {
    formData.append('aiSuggestedCategoryId', payload.aiSuggestedCategoryId)
  }

  if (payload.toWalletId) {
    formData.append('toWalletId', payload.toWalletId)
  }

  formData.append('amount', String(payload.amount))
  formData.append('type', payload.type)
  formData.append('transactionDate', payload.transactionDate)
  formData.append('notes', payload.notes ?? '')
  formData.append('isExcludedFromReport', String(payload.isExcludedFromReport ?? false))
  formData.append('isEssential', String(payload.isEssential ?? false))

  if (payload.receiptImageUri) {
    formData.append('receiptImage', {
      uri: payload.receiptImageUri,
      name: getReceiptFilename(payload.receiptImageUri),
      type: getReceiptMimeType(payload.receiptImageUri),
    } as unknown as Blob)
  } else {
    formData.append('receiptImage', '')
  }

  return formData
}

export const createTransaction = async (payload: CreateTransactionDto, accessToken: string) => {
  const startedAt = Date.now()
  const formData = createTransactionFormData(payload)
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      ...buildAuthHeaders(accessToken),
    },
    body: formData,
  }

  logBackendRequest('POST', transactionsEndpoint, { body: payload, headers: requestInit.headers })
  const response = await fetchWithAuthRetry(transactionsEndpoint, requestInit)
  console.log('[AddTransactionTiming] POST /transactions response', {
    durationMs: Date.now() - startedAt,
    status: response.status,
    hasReceiptImage: Boolean(payload.receiptImageUri),
  })
  logBackendResponse('POST', transactionsEndpoint, response)

  const transaction = (await readResponseBody(response)) as Transaction
  console.log('[AddTransactionTiming] POST /transactions parsed', {
    durationMs: Date.now() - startedAt,
  })

  return transaction
}

export const listTransactions = async (accessToken: string) => {
  const requestInit: RequestInit = { method: 'GET', headers: buildAuthHeaders(accessToken) }

  logBackendRequest('GET', transactionsEndpoint, { headers: requestInit.headers })
  const response = await fetchWithAuthRetry(transactionsEndpoint, requestInit)
  logBackendResponse('GET', transactionsEndpoint, response)

  return (await readResponseBody(response)) as Transaction[]
}

export const updateTransaction = async (
  id: string,
  payload: UpdateTransactionDto,
  accessToken: string,
) => {
  const url = `${transactionsEndpoint}/${id}`
  const requestInit: RequestInit = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  }

  logBackendRequest('PATCH', url, { body: payload, headers: requestInit.headers })
  const response = await fetchWithAuthRetry(url, requestInit)
  logBackendResponse('PATCH', url, response)

  return (await readResponseBody(response)) as Transaction
}

export const deleteTransaction = async (id: string, accessToken: string) => {
  const url = `${transactionsEndpoint}/${id}`
  const requestInit: RequestInit = { method: 'DELETE', headers: buildAuthHeaders(accessToken) }

  logBackendRequest('DELETE', url, { headers: requestInit.headers })
  const response = await fetchWithAuthRetry(url, requestInit)
  logBackendResponse('DELETE', url, response)

  return (await readResponseBody(response)) as DeleteTransactionResponse
}
