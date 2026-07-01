import type {
  CreateWalletDto,
  DeleteWalletResponse,
  UpdateWalletDto,
  Wallet,
} from '@/features/wallet/domain/wallet.types'
import { fetchWithAuthRetry } from '@/features/auth/data/authenticated-fetch'
import { apiBaseUrl } from '@/infrastructure/api/api-base-url'
import { logBackendRequest, logBackendResponse } from '@/shared/utils/http-debug'

const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, '')

export const walletsEndpoint = `${normalizedApiBaseUrl}/wallets`

class WalletApiError extends Error {
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
    throw new WalletApiError(
      getErrorMessage(responseBody, responseText) || `Backend returned HTTP ${response.status}`,
      response.status,
    )
  }

  return responseBody
}

const buildAuthHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
})

export const createWallet = async (payload: CreateWalletDto, accessToken: string) => {
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  }

  logBackendRequest('POST', walletsEndpoint, { body: payload, headers: requestInit.headers })
  const response = await fetchWithAuthRetry(walletsEndpoint, requestInit)
  logBackendResponse('POST', walletsEndpoint, response)

  return (await readResponseBody(response)) as Wallet
}

export const listWallets = async (accessToken: string) => {
  const requestInit: RequestInit = { method: 'GET', headers: buildAuthHeaders(accessToken) }

  logBackendRequest('GET', walletsEndpoint, { headers: requestInit.headers })
  const response = await fetchWithAuthRetry(walletsEndpoint, requestInit)
  logBackendResponse('GET', walletsEndpoint, response)

  return (await readResponseBody(response)) as Wallet[]
}

export const updateWallet = async (id: string, payload: UpdateWalletDto, accessToken: string) => {
  const url = `${walletsEndpoint}/${id}`
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

  return (await readResponseBody(response)) as Wallet
}

export const deleteWallet = async (id: string, accessToken: string) => {
  const url = `${walletsEndpoint}/${id}`
  const requestInit: RequestInit = { method: 'DELETE', headers: buildAuthHeaders(accessToken) }

  logBackendRequest('DELETE', url, { headers: requestInit.headers })
  const response = await fetchWithAuthRetry(url, requestInit)
  logBackendResponse('DELETE', url, response)

  return (await readResponseBody(response)) as DeleteWalletResponse
}
