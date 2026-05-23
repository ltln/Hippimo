import type {
  CreateTransactionDto,
  DeleteTransactionResponse,
  Transaction,
  UpdateTransactionDto,
} from '@/features/transaction/domain/transaction.types'

export const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.example.com'

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

export const createTransaction = async (payload: CreateTransactionDto, accessToken: string) => {
  const response = await fetch(transactionsEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  })

  return (await readResponseBody(response)) as Transaction
}

export const listTransactions = async (accessToken: string) => {
  const response = await fetch(transactionsEndpoint, {
    method: 'GET',
    headers: buildAuthHeaders(accessToken),
  })

  return (await readResponseBody(response)) as Transaction[]
}

export const updateTransaction = async (
  id: string,
  payload: UpdateTransactionDto,
  accessToken: string,
) => {
  const response = await fetch(`${transactionsEndpoint}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  })

  return (await readResponseBody(response)) as Transaction
}

export const deleteTransaction = async (id: string, accessToken: string) => {
  const response = await fetch(`${transactionsEndpoint}/${id}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(accessToken),
  })

  return (await readResponseBody(response)) as DeleteTransactionResponse
}
