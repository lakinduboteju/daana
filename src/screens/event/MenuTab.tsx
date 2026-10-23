import { useState } from 'react'
import { Link, Outlet, useParams } from 'react-router'
import { OVER_PARENT } from '../../components/sheetNavigation'
import { useMenu, type Category, type Item } from '../../data/menu'
import { formatQuantity } from '../../data/units'
import styles from './MenuTab.module.css'

/** /events/:eventId: the menu tab. Item sheets open over it through the outlet. */
export function MenuTab() {
  const { eventId = '' } = useParams()
  const menu = useMenu(eventId)

  return (
    <>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>මෙනුව</h2>
        <Link to="categories" className={styles.editCategories}>Edit Categories</Link>
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

      <Link to="items/new" state={OVER_PARENT} className={styles.fab}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        Item
      </Link>

      <Outlet />
    </>
  )
}

function CategorySection({ category }: { category: Category }) {
  const [open, setOpen] = useState(true)
  const nameId = `category-name-${category.id}`
  const bodyId = `category-body-${category.id}`
  return (
    <section aria-labelledby={nameId} className={styles.category}>
      <button
        type="button"
        className={styles.categoryToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
      >
        <span id={nameId} className={styles.categoryName}>{category.name}</span>
        <span className={styles.count}>{category.items.length}</span>
        <svg className={open ? styles.chevronOpen : styles.chevron} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div id={bodyId}>
          {category.items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
          <Link to={`items/new?category=${category.id}`} state={OVER_PARENT} className={styles.addRow}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            Item එකක් එක් කරන්න
          </Link>
        </div>
      )}
    </section>
  )
}

function ItemRow({ item }: { item: Item }) {
  const quantity = formatQuantity(item)
  return (
    <Link to={`items/${item.id}/edit`} state={OVER_PARENT} className={styles.item}>
      <span className={styles.itemName}>{item.name}</span>
      <span className={styles.itemSub}>
        {quantity ? `${quantity} · ` : ''}දායකයෙකු තවම නැත
      </span>
    </Link>
  )
}
