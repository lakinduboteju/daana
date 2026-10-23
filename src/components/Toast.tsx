import { useCallback, useEffect, useState, type ReactNode } from 'react'
import styles from './Toast.module.css'
import { SaveFailedContext, ToastContext } from './useToast'

const SHOW_MS = 3000

/**
 * Shows one short message at a time ("සුරැකිණි") that outlives navigation,
 * and a retry banner when a save fails. A new save replaces the banner.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null)
  const [failure, setFailure] = useState<{ message: string; retry: () => void; key: number } | null>(null)
  const show = useCallback((message: string) => {
    setFailure(null)
    setToast({ message, key: Date.now() })
  }, [])
  const saveFailed = useCallback((message: string, retry: () => void) => {
    setToast(null)
    setFailure({ message, retry, key: Date.now() })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), SHOW_MS)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={show}>
      <SaveFailedContext.Provider value={saveFailed}>
        {children}
        {toast && (
          <div key={toast.key} role="status" className={styles.toast}>
            {toast.message}
          </div>
        )}
        {failure && (
          <div key={failure.key} role="alert" className={styles.banner}>
            <span className={styles.bannerText}>{failure.message}</span>
            <button
              type="button"
              className={styles.retry}
              onClick={() => {
                setFailure(null)
                failure.retry()
              }}
            >
              නැවත උත්සාහ කරන්න
            </button>
            <button type="button" aria-label="දැනුම්දීම වසන්න" className={styles.dismiss} onClick={() => setFailure(null)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
        )}
      </SaveFailedContext.Provider>
    </ToastContext.Provider>
  )
}
