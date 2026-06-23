import type {
  Budget,
  CreateBudgetDto,
  DeleteBudgetResponse,
  UpdateBudgetDto,
} from '@/features/budget/domain/budget.types'
import { fetchWithAuthRetry } from '@/features/auth/data/authenticated-fetch'
import { logBackendRequest, logBackendResponse } from '@/shared/utils/http-debug'

const isAbortError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  (error as { name?: unknown }).name === 'AbortError'

export const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.example.com'

const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, '')

export const budgetsEndpoint = `${normalizedApiBaseUrl}/budgets`

const DEFAULT_TIMEOUT_MS = 15000

class BudgetApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  const method = init.method ?? 'GET'
  const url = typeof input === 'string' ? input : input.toString()
  const parsedBody = typeof init.body === 'string' ? JSON.parse(init.body) : init.body

  logBackendRequest(method, url, {
    body: parsedBody,
    headers: init.headers,
  })

  try {
    const response = await fetchWithAuthRetry(input, {
      ...init,
      signal: controller.signal,
    })

    logBackendResponse(method, url, response)
    return response
  } catch (error) {
    if (isAbortError(error)) {
      throw new BudgetApiError('Request timeout. Please try again.', 408)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
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
    throw new BudgetApiError(
      getErrorMessage(responseBody, responseText) || `Backend returned HTTP ${response.status}`,
      response.status,
    )
  }

  return responseBody
}

const buildAuthHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
})

export const createBudget = async (payload: CreateBudgetDto, accessToken: string) => {
  const response = await fetchWithTimeout(budgetsEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  })

  return (await readResponseBody(response)) as Budget
}

export const listBudgets = async (accessToken: string) => {
  const response = await fetchWithTimeout(budgetsEndpoint, {
    method: 'GET',
    headers: buildAuthHeaders(accessToken),
  })

  return (await readResponseBody(response)) as Budget[]
}

export const getBudgetById = async (id: string, accessToken: string) => {
  const response = await fetchWithTimeout(`${budgetsEndpoint}/${id}`, {
    method: 'GET',
    headers: buildAuthHeaders(accessToken),
  })

  return (await readResponseBody(response)) as Budget
}

export const updateBudget = async (id: string, payload: UpdateBudgetDto, accessToken: string) => {
  const response = await fetchWithTimeout(`${budgetsEndpoint}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  })

  return (await readResponseBody(response)) as Budget
}

export const deleteBudget = async (id: string, accessToken: string) => {
  const response = await fetchWithTimeout(`${budgetsEndpoint}/${id}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(accessToken),
  })

  return (await readResponseBody(response)) as DeleteBudgetResponse
}
