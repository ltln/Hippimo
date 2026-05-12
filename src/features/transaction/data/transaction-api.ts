export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

export type TransactionRecord = {
  transactionId: string
  userId: string
  walletId: string
  toWalletId: string | null
  categoryId: string | null
  amount: number
  type: TransactionType
  transactionDate: string
  notes: string | null
  isExcludedFromReport: boolean | null
  aiSuggestedCategoryId: string | null
  isEssential: boolean | null
  createdAt: string
}

export type CreateTransactionDto = {
  walletId: string
  categoryId?: string
  toWalletId?: string
  amount: number
  type: TransactionType
  transactionDate: string
  notes?: string
  isExcludedFromReport?: boolean
  aiSuggestedCategoryId?: string
  isEssential?: boolean
}

export type UpdateTransactionDto = Partial<CreateTransactionDto>

type AuthConfig = {
  accessToken: string
  tokenType?: string
}

export const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.example.com'

const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, '')
const transactionsEndpoint = `${normalizedApiBaseUrl}/transactions`

class TransactionApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown,
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
    return String((responseBody as { message?: unknown }).message)
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
      responseBody,
    )
  }

  return responseBody
}

const buildAuthHeaders = (auth: AuthConfig) => ({
  Authorization: `${auth.tokenType ?? 'Bearer'} ${auth.accessToken}`,
})

export const fetchTransactions = async (auth: AuthConfig) => {
  const response = await fetch(transactionsEndpoint, {
    method: 'GET',
    headers: {
      ...buildAuthHeaders(auth),
    },
  })

  return (await readResponseBody(response)) as TransactionRecord[]
}

export const fetchTransactionById = async (id: string, auth: AuthConfig) => {
  const response = await fetch(`${transactionsEndpoint}/${id}`, {
    method: 'GET',
    headers: {
      ...buildAuthHeaders(auth),
    },
  })

  return (await readResponseBody(response)) as TransactionRecord
}

export const createTransaction = async (payload: CreateTransactionDto, auth: AuthConfig) => {
  const response = await fetch(transactionsEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(auth),
    },
    body: JSON.stringify(payload),
  })

  return (await readResponseBody(response)) as TransactionRecord
}

export const updateTransaction = async (
  id: string,
  payload: UpdateTransactionDto,
  auth: AuthConfig,
) => {
  const response = await fetch(`${transactionsEndpoint}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(auth),
    },
    body: JSON.stringify(payload),
  })

  return (await readResponseBody(response)) as TransactionRecord
}

export const deleteTransaction = async (id: string, auth: AuthConfig) => {
  const response = await fetch(`${transactionsEndpoint}/${id}`, {
    method: 'DELETE',
    headers: {
      ...buildAuthHeaders(auth),
    },
  })

  await readResponseBody(response)
}
