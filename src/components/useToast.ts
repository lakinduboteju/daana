import { createContext, useContext } from 'react'

export const ToastContext = createContext<(message: string) => void>(() => {})

/** `toast('සුරැකිණි')` after every save. Rendered by `ToastProvider`. */
export function useToast() {
  return useContext(ToastContext)
}

export type SaveFailed = (message: string, retry: () => void) => void

export const SaveFailedContext = createContext<SaveFailed>(() => {})

/**
 * `saveFailed('සුරැකීමට නොහැකි විය', retry)` when a save that the screen
 * already showed (a one-tap change) fails. Shows a retry banner that stays
 * until the organizer retries or dismisses it. Rendered by `ToastProvider`.
 */
export function useSaveFailed() {
  return useContext(SaveFailedContext)
}
