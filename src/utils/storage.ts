export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return fallback
  }

  try {
    const parsed = JSON.parse(raw)
    return parsed === null ? fallback : (parsed as T)
  } catch {
    return fallback
  }
}

export function saveToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}
