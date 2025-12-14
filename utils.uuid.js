const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const validateUuid = (value) => typeof value === 'string' && UUID_V4_REGEX.test(value)

export const uuidVersion = (value) => {
  if (!validateUuid(value)) return null
  const versionChar = value.charAt(14)
  return Number.parseInt(versionChar, 16)
}
