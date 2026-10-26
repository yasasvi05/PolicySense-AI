import { API_URL } from '../config'

export const tokenStore = {
  get: () => localStorage.getItem('ps_token'),
  set: (t) => localStorage.setItem('ps_token', t),
  clear: () => localStorage.removeItem('ps_token'),
}

export async function http(path, { method = 'GET', body, form } = {}) {
  const headers = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'
  let res
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: form ?? (body ? JSON.stringify(body) : undefined) })
  } catch {
    throw new Error(`Cannot reach the API at ${API_URL}. Is the backend running?`)
  }
  if (res.status === 401 && token) {
    tokenStore.clear()
    window.dispatchEvent(new Event('ps:unauthorized'))
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = data.detail
    throw new Error(Array.isArray(detail) ? detail.map((e) => e.msg).join(', ') : detail || `Request failed (${res.status})`)
  }
  return data
}
