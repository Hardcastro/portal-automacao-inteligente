import { buildSignedHeaders } from './activepiecesSigner.js'

const DEFAULT_ALLOWED_HOSTS = ['api.activepieces.com']

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const isAllowedUrl = (candidateUrl, allowedHostnames = DEFAULT_ALLOWED_HOSTS) => {
  const parsed = new URL(candidateUrl)
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http/https protocols are allowed for Activepieces webhook')
  }

  const allowed = allowedHostnames.length === 0
    ? true
    : allowedHostnames.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))

  if (!allowed) {
    throw new Error(`Hostname ${parsed.hostname} is not allowed for Activepieces webhook`)
  }

  return parsed
}

const fetchWithTimeout = async (url, options, timeoutMs, fetchImpl) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImpl(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timer)
  }
}

export const createActivepiecesClient = ({
  signingSecret,
  timeoutMs = 8000,
  retryMax = 3,
  allowedHostnames = DEFAULT_ALLOWED_HOSTS,
  fetchImpl = fetch,
} = {}) => {
  if (!signingSecret) {
    throw new Error('Activepieces signing secret is required')
  }

  const validateUrl = (url) => isAllowedUrl(url, allowedHostnames)

  const attemptRequest = async ({ url, body, requestId }) => {
    const parsedUrl = validateUrl(url)
    const rawBody = JSON.stringify(body || {})
    const signedHeaders = buildSignedHeaders({ secret: signingSecret, rawBody })

    const response = await fetchWithTimeout(parsedUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...signedHeaders,
        ...(requestId ? { 'X-Request-Id': requestId } : {}),
      },
      body: rawBody,
    }, timeoutMs, fetchImpl)

    return response
  }

  const postWithRetries = async (params) => {
    let attempt = 0
    let lastError

    while (attempt < retryMax) {
      try {
        const response = await attemptRequest(params)
        if (!response.ok && response.status >= 500 && attempt + 1 < retryMax) {
          attempt += 1
          await sleep(2 ** attempt * 100)
          continue
        }
        return response
      } catch (error) {
        lastError = error
        if (error.name === 'AbortError') {
          // retry on timeout
          if (attempt + 1 < retryMax) {
            attempt += 1
            await sleep(2 ** attempt * 100)
            continue
          }
        }
        throw error
      }
    }

    throw lastError || new Error('Failed to call Activepieces webhook')
  }

  return {
    async triggerWebhook({ url, payload, requestId }) {
      const response = await postWithRetries({ url, body: payload, requestId })
      let json
      try {
        json = await response.clone().json()
      } catch {
        json = null
      }
      return { ok: response.ok, status: response.status, data: json }
    },
  }
}
