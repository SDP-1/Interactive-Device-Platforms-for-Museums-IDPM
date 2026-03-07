import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api'

/** Wraps apiRequest, auto-provides logout callback */
export function useApi() {
  const { logout } = useAuth()
  return useCallback(
    (method, path, body) => apiRequest(method, path, body, { onLogout: logout }),
    [logout]
  )
}
