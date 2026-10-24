import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, Outlet, useLocation, useParams } from 'react-router'
import { BackHeader } from '../../components/BackHeader'
import { ContactLinks } from '../../components/ContactLinks'
import { OVER_PARENT } from '../../components/sheetNavigation'
import { StatusBadge } from '../../components/StatusBadge'
import { StatusChoice } from '../../components/StatusChoice'
import { useSaveFailed, useToast } from '../../components/useToast'
import { useSetAssignmentStatus } from '../../data/assignments'
import { useEventMoney } from '../../data/money'
import { useMenu, type Assignment, type Category, type Item } from '../../data/menu'
import { STATUS_LABEL, type AssignmentStatus } from '../../data/status'
import { formatAmount, formatQuantity } from '../../data/units'
import { DocumentsSection } from '../documents/DocumentsSection'
import { menuPath } from '../event/menuFilters'
import { TransactionList } from '../money/MoneyTab'
import { NotFoundScreen } from '../not-found/NotFoundScreen'
import styles from './ItemDetailScreen.module.css'

/**
 * /events/:eventId/items/:itemId: one item's status, required versus
 * confirmed quantity, contributors (one-tap status, call, WhatsApp), notes,
 * money and documents.
 * It covers the menu, which stays mounted underneath; its sheets (edit, assign,
 * edit assignment) open over it through the outlet.
 */
export function ItemDetailScreen() {
  const { eventId = '', itemId = '' } = useParams()
  const menu = useMenu(eventId)
  const location = useLocation()
  const found = menu.data ? findWithCategory(menu.data, itemId) : null

  // A portal, so the covered event screen can be made inert without this.
  const cover = (content: ReactNode) => createPortal(<div className={styles.screen}>{content}</div>, document.body)
  if (menu.isPending) return cover(<p className={styles.loading}>…</p>)
  if (menu.isError) return cover(<p role="alert" className={styles.loading}>පූරණය කිරීමට නොහැකි විය</p>)
  if (!found) return cover(<NotFoundScreen />)

  const { item, category } = found
  return cover(
    <>
      <BackHeader title={item.name} backTo={menuPath(eventId, location.state)} />
      <p className={styles.category}>{category.name}</p>
      <StatusSection item={item} />
      <ContributorsSection eventId={eventId} item={item} />
      {item.notes && (
        <section aria-labelledby="item-notes" className={styles.card}>
          <h2 id="item-notes" className={styles.cardTitle}>සටහන්</h2>
          <p className={styles.notes}>{item.notes}</p>
        </section>
      )}
      <ItemMoney eventId={eventId} itemId={item.id} />
      <DocumentsSection eventId={eventId} itemId={item.id} layout="grid" className={styles.card} />
      <Link to="edit" state={OVER_PARENT} className={styles.edit}>Item එක සංස්කරණය කරන්න</Link>
      <Outlet />
    </>,
  )
}

function StatusSection({ item }: { item: Item }) {
  const required = item.required_quantity
  return (
    <section aria-labelledby="item-status" className={styles.card}>
      <div className={styles.statusRow}>
        <h2 id="item-status" className={styles.cardTitle}>අයිතමයේ තත්ත්වය</h2>
        <StatusBadge status={item.status} />
      </div>
      {required != null && (
        <div className={styles.coverage}>
          <div className={styles.coverageText}>
            <span>අවශ්‍ය ප්‍රමාණය {formatQuantity(item)}</span>
            <span className={styles.coverageCount}>තහවුරු {item.confirmed_quantity} / {required}</span>
          </div>
          <div
            role="progressbar"
            aria-label="තහවුරු ප්‍රමාණය"
            aria-valuemin={0}
            aria-valuemax={required}
            aria-valuenow={item.confirmed_quantity}
            className={styles.bar}
          >
            <div
              className={item.shortfall === 0 ? styles.barFillDone : styles.barFill}
              style={{ width: `${Math.min(100, (item.confirmed_quantity / required) * 100)}%` }}
            />
          </div>
          {item.shortfall != null && item.shortfall > 0 && (
            <p className={styles.shortfall}>තවම {formatAmount(item.shortfall, item)}ක් තහවුරු වී නැත</p>
          )}
        </div>
      )}
    </section>
  )
}

function ContributorsSection({ eventId, item }: { eventId: string; item: Item }) {
  return (
    <section aria-labelledby="item-contributors" className={styles.card}>
      <h2 id="item-contributors" className={styles.cardTitle}>දායකයන් ({item.assignments.length})</h2>
      {item.assignments.length > 0 && (
        <ul aria-label="දායකයන්" className={styles.contributors}>
          {item.assignments.map((assignment) => (
            <AssignmentRow key={assignment.id} eventId={eventId} item={item} assignment={assignment} />
          ))}
        </ul>
      )}
      <Link to="assign" state={OVER_PARENT} className={styles.addContributor}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        තවත් දායකයෙක් එක් කරන්න
      </Link>
    </section>
  )
}

function AssignmentRow({ eventId, item, assignment }: { eventId: string; item: Item; assignment: Assignment }) {
  const setStatus = useSetAssignmentStatus(eventId)
  const toast = useToast()
  const saveFailed = useSaveFailed()
  const { name } = assignment.contributor

  function change(status: AssignmentStatus) {
    const what = `${name} — ${STATUS_LABEL[status]}`
    setStatus.mutate(
      { assignmentId: assignment.id, status },
      {
        onSuccess: () => toast(`${what} ලෙස සුරැකිණි`),
        onError: () => saveFailed(`${what} සුරැකීමට නොහැකි විය`, () => change(status)),
      },
    )
  }

  return (
    <li className={styles.contributor}>
      <div className={styles.contributorHead}>
        <Link
          to={`assignments/${assignment.id}`}
          state={OVER_PARENT}
          aria-label={`${name} — පැවරුම සංස්කරණය`}
          className={styles.contributorName}
        >
          <span className={styles.name}>{name}</span>
          <span className={styles.quantity}>{formatAmount(assignment.quantity, item) ?? 'ප්‍රමාණය සඳහන් කර නැත'}</span>
        </Link>
        <ContactLinks contributor={assignment.contributor} />
      </div>
      <StatusChoice label={`${name} — තත්ත්වය`} hideLabel value={assignment.status} onChange={change} />
    </li>
  )
}

/** The item's givens and expenses (#13), with links to record more for it. */
function ItemMoney({ eventId, itemId }: { eventId: string; itemId: string }) {
  const money = useEventMoney(eventId)
  const newPath = (type: string) => `/events/${eventId}/money/new?type=${type}&item=${itemId}`
  return (
    <section aria-labelledby="item-money" className={styles.card}>
      <h2 id="item-money" className={styles.cardTitle}>මුදල්</h2>
      {money.data && (
        <TransactionList
          transactions={money.data.transactions.filter((t) => t.item?.id === itemId)}
          empty="මුදල් වාර්තා නැත."
          showItem={false}
        />
      )}
      <div className={styles.moneyActions}>
        <Link to={newPath('given')} state={OVER_PARENT} className={styles.addContributor}>+ ලබා දුන් මුදලක්</Link>
        <Link to={newPath('expense')} state={OVER_PARENT} className={styles.addContributor}>+ වියදමක්</Link>
      </div>
    </section>
  )
}

function findWithCategory(menu: Category[], itemId: string): { item: Item; category: Category } | null {
  for (const category of menu) {
    const item = category.items.find((i) => i.id === itemId)
    if (item) return { item, category }
  }
  return null
}
