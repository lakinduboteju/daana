import { useState } from 'react'
import { Link, Outlet, useParams } from 'react-router'
import { OVER_PARENT } from '../../components/sheetNavigation'
import { StatusBadge } from '../../components/StatusBadge'
import { useMenu, type Category, type Item } from '../../data/menu'
import { formatQuantity } from '../../data/units'
import { MenuFilterBar, useMenuFilters } from './MenuFilterBar'
import { filterMenu, isFiltered } from './menuFilters'
import styles from './MenuTab.module.css'

/** /events/:eventId: the menu tab. Item sheets open over it through the outlet. */
export function MenuTab() {
  const { eventId = '' } = useParams()
  const menu = useMenu(eventId)
  const menuFilters = useMenuFilters()
  const filtered = isFiltered(menuFilters.filters)
  const shown = menu.data ? filterMenu(menu.data, menuFilters.filters) : undefined

  return (
    <>
      {menu.data && shown && (
        <MenuFilterBar menu={menu.data} shown={shown.reduce((n, c) => n + c.items.length, 0)} filters={menuFilters} />
      )}
      <div className={styles.titleRow}>
        <h2 className={styles.title}>මෙනුව</h2>
        <Link to="categories" className={styles.editCategories}>Edit Categories</Link>
      </div>
      {menu.isPending && <p className={styles.status}>…</p>}
      {menu.isError && <p role="alert" className={styles.status}>මෙනුව පූරණය කිරීමට නොහැකි විය</p>}
      {shown && filtered && shown.length === 0 && <p className={styles.status}>ගැළපෙන Item නැත</p>}
      {shown && (
        <div className={styles.categories}>
          {shown.map((category) => (
            <CategorySection key={category.id} category={category} forceOpen={filtered} />
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

/** While the menu is filtered, every shown category is open (forceOpen). */
function CategorySection({ category, forceOpen = false }: { category: Category; forceOpen?: boolean }) {
  const [openState, setOpen] = useState(true)
  const open = forceOpen || openState
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
          {category.items.length > 0 && (
            <ul className={styles.items}>
              {category.items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </ul>
          )}
          <Link to={`items/new?category=${category.id}`} state={OVER_PARENT} className={styles.addRow}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            Item එකක් එක් කරන්න
          </Link>
        </div>
      )}
    </section>
  )
}

/** Name, who's bringing it and how much, and the item status. Unassigned items get a "පවරන්න" button. */
function ItemRow({ item }: { item: Item }) {
  const quantity = formatQuantity(item)
  const unassigned = item.assignments.length === 0
  return (
    <li className={styles.item}>
      <Link to={`items/${item.id}`} className={styles.itemLink}>
        <span className={styles.itemName}>{item.name}</span>
        <span className={unassigned ? styles.itemSubMissing : styles.itemSub}>
          {unassigned ? 'දායකයෙකු තවම නැත' : contributorNames(item)}
          {quantity && ` · ${quantity}`}
        </span>
        <StatusBadge status={item.status} className={styles.badge} />
      </Link>
      {unassigned && (
        <Link to={`items/${item.id}/assign`} state={OVER_PARENT} className={styles.assign}>
          පවරන්න
        </Link>
      )}
    </li>
  )
}

/** One contributor by full name; several by first names. */
function contributorNames(item: Item): string {
  const names = item.assignments.map((a) => a.contributor.name)
  if (names.length === 1) return names[0]
  return names.map((n) => n.split(' ')[0]).join(', ')
}
