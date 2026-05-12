export type WalletTypeApi =
  | 'CASH'
  | 'BANK_ACCOUNT'
  | 'E_WALLET'
  | 'CREDIT_CARD'
  | 'SAVINGS'
  | 'OTHER'

export type WalletRecord = {
  walletId: string
  userId: string
  name: string
  type: WalletTypeApi
  balance: number
  isActive: boolean
  createdAt: string
}

export type CreateWalletDto = {
  name: string
  type: WalletTypeApi
  balance: number
}

export type UpdateWalletDto = {
  name?: string
  type?: WalletTypeApi
  isActive?: boolean
}

export type AddMoneyDto = {
  amount: number
}

type AuthConfig = {
  accessToken: string
  tokenType?: string
}

export const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.example.com'

const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, '')
const walletsEndpoint = `${normalizedApiBaseUrl}/wallets`

class WalletApiError extends Error {
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
    throw new WalletApiError(
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

export const fetchWallets = async (auth: AuthConfig) => {
  const response = await fetch(walletsEndpoint, {
    method: 'GET',
    headers: {
      ...buildAuthHeaders(auth),
    },
  })

  return (await readResponseBody(response)) as WalletRecord[]
}

export const createWallet = async (payload: CreateWalletDto, auth: AuthConfig) => {
  const response = await fetch(walletsEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(auth),
    },
    body: JSON.stringify(payload),
  })

  return (await readResponseBody(response)) as WalletRecord
}

export const updateWallet = async (id: string, payload: UpdateWalletDto, auth: AuthConfig) => {
  const response = await fetch(`${walletsEndpoint}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(auth),
    },
    body: JSON.stringify(payload),
  })

  return (await readResponseBody(response)) as WalletRecord
}

export const addMoneyToWallet = async (id: string, payload: AddMoneyDto, auth: AuthConfig) => {
  const response = await fetch(`${walletsEndpoint}/${id}/add-money`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(auth),
    },
    body: JSON.stringify(payload),
  })

  return (await readResponseBody(response)) as WalletRecord
}

export const deleteWallet = async (id: string, auth: AuthConfig) => {
  const response = await fetch(`${walletsEndpoint}/${id}`, {
    method: 'DELETE',
    headers: {
      ...buildAuthHeaders(auth),
    },
  })

  await readResponseBody(response)
}
