import { useCallback, useEffect, useState, type ReactNode } from 'react'
import styles from './Toast.module.css'
import { ToastContext } from './useToast'

const SHOW_MS = 3000

/** Shows one short message at a time ("සුරැකිණි") that outlives navigation. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null)
  const show = useCallback((message: string) => setToast({ message, key: Date.now() }), [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), SHOW_MS)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div key={toast.key} role="status" className={styles.toast}>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}
