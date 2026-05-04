export const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return 'Chưa có'
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return JSON.stringify(value, null, 2)
}

export const getObjectKeys = (value: unknown) => {
  if (!value || typeof value !== 'object') {
    return []
  }

  return Object.keys(value)
}
