import { createContext, useContext } from 'react'

export const ToastContext = createContext<(message: string) => void>(() => {})

/** `toast('සුරැකිණි')` after every save. Rendered by `ToastProvider`. */
export function useToast() {
  return useContext(ToastContext)
}
