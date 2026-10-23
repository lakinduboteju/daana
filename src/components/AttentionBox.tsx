import type { EventProgress } from '../data/events'
import styles from './AttentionBox.module.css'

/**
 * What to chase on an upcoming, non-cancelled event: unassigned and pending
 * items, then short (partial) items on a softer line. Renders nothing when
 * there's nothing to chase (the view reports 0 for past or cancelled events).
 */
export function AttentionBox({ progress }: { progress: EventProgress }) {
  if (progress.attention_count === 0 && progress.short_count === 0) return null
  return (
    <section aria-labelledby="attention-title" className={styles.box}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={styles.icon}><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></svg>
      <div>
        <h3 id="attention-title" className={styles.title}>අවධානය අවශ්‍යයි</h3>
        {progress.attention_count > 0 && <p className={styles.line}>{attentionText(progress)}</p>}
        {progress.short_count > 0 && (
          <p className={styles.soft}>අයිතම {progress.short_count}ක් අර්ධ වශයෙන් පමණක් තහවුරුයි</p>
        )}
      </div>
    </section>
  )
}

function attentionText({ unassigned_count, pending_count }: EventProgress): string {
  const parts: string[] = []
  if (unassigned_count > 0) parts.push(`අයිතම ${unassigned_count}කට දායකයන් නැත`)
  if (pending_count > 0) parts.push(`${parts.length ? '' : 'අයිතම '}${pending_count}ක් තවම තහවුරු කර නැත`)
  return parts.join(' · ')
}
