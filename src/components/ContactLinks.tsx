import { callUrl, whatsappUrl } from '../lib/contact'
import styles from './ContactLinks.module.css'

type Contact = { name: string; phone: string | null; whatsapp: string | null }

/** Round call and WhatsApp buttons for a contributor, when they have the numbers. */
export function ContactLinks({ contributor }: { contributor: Contact }) {
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
