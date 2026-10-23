import { Link, useSearchParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { useContributors } from '../../data/contributors'
import styles from './ContributorsScreen.module.css'

export function ContributorsScreen() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const contributors = useContributors(q)

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
            <Link to={`/contributors/${contributor.id}/edit`} className={styles.name}>
              <span className={styles.nameText}>{contributor.name}</span>
              {contributor.phone && <span className={styles.phone}>{contributor.phone}</span>}
            </Link>
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

/** First letter, keeping Sinhala vowel signs with their consonant. */
function initial(name: string): string {
  const segmenter = new Intl.Segmenter('si', { granularity: 'grapheme' })
  const first = segmenter.segment(name.trim())[Symbol.iterator]().next().value
  return first?.segment ?? ''
}
