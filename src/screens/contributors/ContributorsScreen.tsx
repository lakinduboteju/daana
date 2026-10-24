import { Link, useSearchParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { ContactLinks } from '../../components/ContactLinks'
import { useContributorActivity } from '../../data/contributorAssignments'
import { useContributors } from '../../data/contributors'
import { STATUS_SYMBOL } from '../../data/status'
import styles from './ContributorsScreen.module.css'

export function ContributorsScreen() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const contributors = useContributors(q)
  const activity = useContributorActivity()

  function search(value: string) {
    setSearchParams(value ? { q: value } : {}, { replace: true })
  }

  return (
    <>
      <PageHeader title="දායකයන්" />
      <div className={styles.search}>
        <label htmlFor="contributor-q" className={styles.visuallyHidden}>දායකයන් සොයන්න</label>
        <input
          id="contributor-q"
          type="search"
          placeholder="නම හෝ දුරකථන අංකය"
          value={q}
          onChange={(event) => search(event.target.value)}
          className={styles.searchInput}
        />
        <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      </div>

      {contributors.isPending && <p className={styles.message}>පූරණය වෙමින්…</p>}
      {contributors.isError && (
        <p role="alert" className={styles.message}>දායකයන් පූරණය කිරීමට නොහැකි විය.</p>
      )}
      {contributors.data?.length === 0 && (
        <p className={styles.message}>
          {q.trim() ? `"${q.trim()}" ට ගැළපෙන දායකයන් නැත.` : 'තවම දායකයන් නැත. නව දායකයා එක් කරන්න.'}
        </p>
      )}

      <ul className={styles.list}>
        {contributors.data?.map((contributor) => (
          <li key={contributor.id} className={styles.row}>
            <span className={styles.initial} aria-hidden="true">{initial(contributor.name)}</span>
            <Link to={`/contributors/${contributor.id}`} className={styles.name}>
              <span className={styles.nameText}>{contributor.name}</span>
              {contributor.phone && <span className={styles.phone}>{contributor.phone}</span>}
              <PendingBadge count={activity.data?.get(contributor.id)?.pending_count ?? 0} />
            </Link>
            <ContactLinks contributor={contributor} />
          </li>
        ))}
      </ul>

      <Link to="/contributors/new" className={styles.fab}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        නව දායකයා
      </Link>
    </>
  )
}

/** "◔ තහවුරු නොවූ 2": pending assignments in upcoming events, to follow up on. */
function PendingBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className={styles.pending}>
      <span aria-hidden="true">{STATUS_SYMBOL.pending}</span>
      තහවුරු නොවූ {count}
    </span>
  )
}

/** First letter, keeping Sinhala vowel signs with their consonant. */
function initial(name: string): string {
  const segmenter = new Intl.Segmenter('si', { granularity: 'grapheme' })
  const first = segmenter.segment(name.trim())[Symbol.iterator]().next().value
  return first?.segment ?? ''
}
