import { Link } from 'react-router'
import styles from './NotFoundScreen.module.css'

/**
 * Broken links, and records the organizer can't see (another household's
 * event looks exactly like one that doesn't exist).
 */
export function NotFoundScreen() {
  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>පිටුව හමු නොවීය</h1>
      <p className={styles.text}>මෙම සබැඳිය වැරදියි, නැතහොත් එය ඉවත් කර ඇත.</p>
      <Link to="/events" className={styles.home}>දාන වෙත යන්න</Link>
    </main>
  )
}
