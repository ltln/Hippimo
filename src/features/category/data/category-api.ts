import type {
  Category,
  CreateCategoryDto,
  DeleteCategoryResponse,
  UpdateCategoryDto,
} from '@/features/category/domain/category.types'

export const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.example.com'

const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, '')

export const categoriesEndpoint = `${normalizedApiBaseUrl}/categories`

class CategoryApiError extends Error {
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
    throw new CategoryApiError(
      getErrorMessage(responseBody, responseText) || `Backend returned HTTP ${response.status}`,
      response.status,
    )
  }

  return responseBody
}

const buildAuthHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
})

export const createCategory = async (payload: CreateCategoryDto, accessToken: string) => {
  const response = await fetch(categoriesEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  })

  return (await readResponseBody(response)) as Category
}

export const listCategories = async (accessToken: string) => {
  const response = await fetch(categoriesEndpoint, {
    method: 'GET',
    headers: buildAuthHeaders(accessToken),
  })

  return (await readResponseBody(response)) as Category[]
}

export const getCategoryById = async (id: string, accessToken: string) => {
  const response = await fetch(`${categoriesEndpoint}/${id}`, {
    method: 'GET',
    headers: buildAuthHeaders(accessToken),
  })

  return (await readResponseBody(response)) as Category
}

export const updateCategory = async (
  id: string,
  payload: UpdateCategoryDto,
  accessToken: string,
) => {
  const response = await fetch(`${categoriesEndpoint}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  })

  return (await readResponseBody(response)) as Category
}

export const deleteCategory = async (id: string, accessToken: string) => {
  const response = await fetch(`${categoriesEndpoint}/${id}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(accessToken),
  })

  return (await readResponseBody(response)) as DeleteCategoryResponse
}
