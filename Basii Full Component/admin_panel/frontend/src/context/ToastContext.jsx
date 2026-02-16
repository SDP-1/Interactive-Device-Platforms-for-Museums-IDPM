import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const showToast = useCallback((msg, isError = false) => {
    clearTimeout(timerRef.current)
    setToast({ msg, isError })
    timerRef.current = setTimeout(() => setToast(null), 3500)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div className={`fixed bottom-6 right-6 text-sm px-5 py-3 rounded-xl shadow-lg z-50
          flex items-center gap-3 max-w-xs fade-in
          ${toast.isError ? 'bg-red-700' : 'bg-gray-900'} text-white`}>
          {toast.msg}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
