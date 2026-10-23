import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

/** Title bar of a top-level screen. */
export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      {action}
    </header>
  )
}
