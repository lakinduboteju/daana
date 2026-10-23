import { Link, useSearchParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { useContributors, type Contributor } from '../../data/contributors'
import { callUrl, whatsappUrl } from '../../lib/contact'
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

function ContactLinks({ contributor }: { contributor: Contributor }) {
  const call = callUrl(contributor)
  const whatsapp = whatsappUrl(contributor)
  return (
    <>
      {call && (
        <a href={call} aria-label={`${contributor.name} අමතන්න`} className={styles.contact}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>
        </a>
      )}
      {whatsapp && (
        <a href={whatsapp} target="_blank" rel="noreferrer" aria-label={`${contributor.name}ට WhatsApp පණිවිඩයක්`} className={styles.contact}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" /></svg>
        </a>
      )}
    </>
  )
}

/** First letter, keeping Sinhala vowel signs with their consonant. */
function initial(name: string): string {
  const segmenter = new Intl.Segmenter('si', { granularity: 'grapheme' })
  const first = segmenter.segment(name.trim())[Symbol.iterator]().next().value
  return first?.segment ?? ''
}
