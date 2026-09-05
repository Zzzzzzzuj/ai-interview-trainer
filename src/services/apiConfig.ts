function defaultApiBaseUrl() {
  if (typeof window === 'undefined') return 'http://localhost:3001/api'
  return `${window.location.protocol}//${window.location.hostname}:3001/api`
}

export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()
  const baseUrl = configured || defaultApiBaseUrl()
  return baseUrl.replace(/\/$/, '').endsWith('/api')
    ? baseUrl.replace(/\/$/, '')
    : `${baseUrl.replace(/\/$/, '')}/api`
}
