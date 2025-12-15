export function setWithTTL(key, value, ttlMinutes = 60) {
  try {
    const expires = Date.now() + ttlMinutes * 60 * 1000
    const payload = JSON.stringify({ value, expires })
    localStorage.setItem(key, payload)
  } catch (err) {
    console.warn('Falha ao salvar no localStorage com TTL', err)
  }
}

export function getWithTTL(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null

    const item = JSON.parse(raw)
    if (!item || typeof item !== 'object') return null
    if (!item.expires || Date.now() > item.expires) return null

    return item.value
  } catch (err) {
    console.warn('Falha ao ler do localStorage com TTL', err)
    return null
  }
}
