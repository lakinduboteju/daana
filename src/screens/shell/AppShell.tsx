import { NavLink, Outlet } from 'react-router'
import styles from './AppShell.module.css'

/** Top-level screens (/events, /search, /contributors) with the bottom tab bar. */
export function AppShell() {
  return (
    <div className={styles.shell}>
      <div className={styles.content}>
        <Outlet />
      </div>
      <nav aria-label="ප්‍රධාන" className={styles.tabBar}>
        <NavLink to="/events" className={tabClass}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" /></svg>
          දාන
        </NavLink>
        <NavLink to="/search" className={tabClass}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          Search
        </NavLink>
        <NavLink to="/contributors" className={tabClass}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-6 7-6s7 2 7 6M16 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-5.5" /></svg>
          දායකයන්
        </NavLink>
      </nav>
    </div>
  )
}

function tabClass({ isActive }: { isActive: boolean }) {
  return isActive ? `${styles.tab} ${styles.active}` : styles.tab
}
