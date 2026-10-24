import { Link, Outlet, useParams, useSearchParams } from 'react-router'
import { OVER_PARENT } from '../../components/sheetNavigation'
import { KIND_LABEL, METHOD_LABEL, useEventMoney, type Transaction, type TransactionKind } from '../../data/money'
import { formatDayMonth } from '../../lib/dates'
import { formatRupees } from '../../lib/money'
import styles from './MoneyTab.module.css'

const FILTERS: { type: TransactionKind | null; label: string }[] = [
  { type: null, label: 'සියල්ල' },
  { type: 'given', label: 'ලබා දුන්' },
  { type: 'expense', label: 'වියදම්' },
]

/**
 * /events/:eventId/money?type=given|expense: total given and total expenses
 * (kept separate), reimbursements owed, and the event's transactions. Its
 * sheets (add, edit) open over it through the outlet.
 */
export function MoneyTab() {
  const { eventId = '' } = useParams()
  const [params] = useSearchParams()
  const type = params.get('type')
  const filter: TransactionKind | null = type === 'given' || type === 'expense' ? type : null
  const money = useEventMoney(eventId)
  const base = `/events/${eventId}/money`

  return (
    <>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>මුදල්</h2>
      </div>
      {money.isPending && <p className={styles.status}>…</p>}
      {money.isError && <p role="alert" className={styles.status}>පූරණය කිරීමට නොහැකි විය</p>}
      {money.data && (
        <div className={styles.body}>
          <section aria-label="එකතුව" className={styles.totals}>
            <div className={styles.total}>
              <span className={styles.totalLabel}>දායකයන්ට ලබා දුන් මුදල්</span>
              <span className={styles.totalAmount}>{formatRupees(money.data.totalGiven)}</span>
            </div>
            <div className={styles.total}>
              <span className={styles.totalLabel}>සත්‍ය වියදම්</span>
              <span className={styles.totalAmount}>{formatRupees(money.data.totalExpense)}</span>
            </div>
          </section>
          {money.data.reimbursements.length > 0 && (
            <ul aria-label="ආපසු ගෙවිය යුතුයි" className={styles.owed}>
              {money.data.reimbursements.map(({ contributor, amount }) => (
                <li key={contributor.id} className={styles.owedRow}>
                  <span className={styles.owedText}>
                    {contributor.name}ට {formatRupees(amount)} ආපසු ගෙවිය යුතුයි
                  </span>
                  <Link
                    to={`new?type=given&contributor=${contributor.id}&amount=${amount}`}
                    state={OVER_PARENT}
                    aria-label={`${contributor.name}ට ගෙවන්න`}
                    className={styles.settle}
                  >
                    ගෙවන්න
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className={styles.hint}>ලබා දුන් මුදල් සහ වියදම් වෙන වෙනම ගණනය වේ — එකම මුදල දෙවරක් ගණන් නොවේ.</p>

          <nav aria-label="ගනුදෙනු වර්ගය" className={styles.filters}>
            {FILTERS.map((f) => {
              const on = f.type === filter
              return (
                <Link
                  key={f.label}
                  to={f.type ? `${base}?type=${f.type}` : base}
                  replace
                  aria-current={on ? 'page' : undefined}
                  className={on ? styles.chipOn : styles.chip}
                >
                  {f.label}
                </Link>
              )
            })}
          </nav>

          <TransactionList
            transactions={money.data.transactions.filter((t) => !filter || t.kind === filter)}
            empty={money.data.transactions.length === 0 ? 'තවම මුදල් වාර්තා නැත.' : 'මෙම වර්ගයේ වාර්තා නැත.'}
          />

          <div className={styles.actions}>
            <Link to="new?type=given" state={OVER_PARENT} className={styles.add}>+ ලබා දුන් මුදලක්</Link>
            <Link to="new?type=expense" state={OVER_PARENT} className={styles.add}>+ වියදමක්</Link>
          </div>
        </div>
      )}
      <Outlet />
    </>
  )
}

/** Transactions as rows that open the edit sheet. Also used on item details. */
export function TransactionList({ transactions, empty, showItem = true }: { transactions: Transaction[]; empty: string; showItem?: boolean }) {
  const { eventId = '' } = useParams()
  if (transactions.length === 0) return <p className={styles.empty}>{empty}</p>
  return (
    <ul aria-label="ගනුදෙනු" className={styles.list}>
      {transactions.map((t) => (
        <li key={t.id} className={styles.row}>
          <Link to={`/events/${eventId}/money/${t.id}`} state={OVER_PARENT} className={styles.rowLink}>
            <span className={t.kind === 'given' ? styles.kindGiven : styles.kindExpense}>{KIND_LABEL[t.kind]}</span>
            <span className={styles.rowMain}>
              <span className={styles.who}>{t.contributor?.name ?? 'සංවිධායක'}</span>
              <span className={styles.meta}>{meta(t, showItem)}</span>
            </span>
            <span className={styles.amount}>{formatRupees(t.amount)}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function meta(t: Transaction, showItem: boolean): string {
  return [showItem ? t.item?.name : null, t.method ? METHOD_LABEL[t.method] : null, formatDayMonth(t.date), t.notes]
    .filter(Boolean)
    .join(' · ')
}
