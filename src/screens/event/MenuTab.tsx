import { useState } from 'react'
import { Outlet, useParams } from 'react-router'
import { useMenu, type Category } from '../../data/menu'
import styles from './MenuTab.module.css'

/** /events/:eventId: the menu tab. Item sheets open over it through the outlet. */
export function MenuTab() {
  const { eventId = '' } = useParams()
  const menu = useMenu(eventId)

  return (
    <>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>මෙනුව</h2>
      </div>
      {menu.isPending && <p className={styles.status}>…</p>}
      {menu.isError && <p role="alert" className={styles.status}>මෙනුව පූරණය කිරීමට නොහැකි විය</p>}
      {menu.data && (
        <div className={styles.categories}>
          {menu.data.map((category) => (
            <CategorySection key={category.id} category={category} />
          ))}
        </div>
      )}
      <Outlet />
    </>
  )
}

function CategorySection({ category }: { category: Category }) {
  const [open, setOpen] = useState(true)
  const bodyId = `category-${category.id}`
  return (
    <section className={styles.category}>
      <button
        type="button"
        className={styles.categoryToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
      >
        <span className={styles.categoryName}>{category.name}</span>
        <svg className={open ? styles.chevronOpen : styles.chevron} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && <div id={bodyId} />}
    </section>
  )
}
