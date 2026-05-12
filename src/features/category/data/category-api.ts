type AuthConfig = {
  accessToken: string
  tokenType?: string
}

export type CategoryRecord = {
  categoryId: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  icon?: string | null
  color?: string | null
  status?: 'ACTIVE' | 'INACTIVE'
}

export const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.example.com'

const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, '')
const categoriesEndpoint = `${normalizedApiBaseUrl}/categories`

class CategoryApiError extends Error {
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
    throw new CategoryApiError(
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

export const fetchCategories = async (auth: AuthConfig) => {
  const response = await fetch(categoriesEndpoint, {
    method: 'GET',
    headers: {
      ...buildAuthHeaders(auth),
    },
  })

  return (await readResponseBody(response)) as CategoryRecord[]
}
