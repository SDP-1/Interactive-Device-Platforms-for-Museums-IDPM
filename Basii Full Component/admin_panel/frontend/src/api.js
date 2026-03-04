/** Thin fetch wrapper – throws on non-ok, auto-attaches Bearer token */
export async function apiRequest(method, path, body, { onLogout } = {}) {
  const token = localStorage.getItem('admin_token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = 'Bearer ' + token

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    onLogout?.()
    return null
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export function fmtDate(s) {
  if (!s) return '–'
  const d = new Date(s.endsWith('Z') ? s : s + 'Z')
  return d.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
}
