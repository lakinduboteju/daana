import { Link, useParams } from 'react-router'
import { BackHeader } from '../../components/BackHeader'
import { CancelledBadge } from '../../components/CancelledBadge'
import { ContactLinks } from '../../components/ContactLinks'
import { StatusBadge } from '../../components/StatusBadge'
import { useSaveFailed, useToast } from '../../components/useToast'
import {
  useConfirmAssignment,
  useContributorActivity,
  useContributorAssignments,
  type ContributorAssignment,
  type ContributorEventGroup,
} from '../../data/contributorAssignments'
import { useContributor, type Contributor } from '../../data/contributors'
import { whatsappUrl } from '../../lib/contact'
import { MEAL_LABEL } from '../../data/meal'
import { STATUS_LABEL } from '../../data/status'
import { formatAmount } from '../../data/units'
import { formatDayMonth, formatWeekday } from '../../lib/dates'
import { NotFoundScreen } from '../not-found/NotFoundScreen'
import styles from './ContributorDetailScreen.module.css'

/**
 * /contributors/:contributorId: the contributor's profile and contact links,
 * and everything they've taken on across events, past events included.
 */
export function ContributorDetailScreen() {
  const { contributorId = '' } = useParams()
  const contributor = useContributor(contributorId)
  const groups = useContributorAssignments(contributorId)
  const counts = useContributorActivity().data?.get(contributorId)

  if (contributor.data === null) return <NotFoundScreen />
  if (contributor.isPending) return <p className={styles.message}>පූරණය වෙමින්…</p>
  if (contributor.isError) {
    return <p role="alert" className={styles.message}>දායකයා පූරණය කිරීමට නොහැකි විය.</p>
  }

  const profile = contributor.data
  const { name, phone, notes } = profile
  return (
    <main className={styles.screen}>
      <BackHeader title={name} backTo="/contributors" />
      <section aria-label="දායකයාගේ විස්තර" className={styles.profile}>
        <div className={styles.profileRow}>
          <div className={styles.profileText}>
            {phone && <p className={styles.phone}>{phone}</p>}
            <Link to="edit" className={styles.edit}>Edit</Link>
          </div>
          <ContactLinks contributor={profile} />
        </div>
        {notes && <p className={styles.notes}>සටහන: {notes}</p>}
      </section>

      {counts && (
        <ul aria-label="සංඛ්‍යා" className={styles.stats}>
          <li className={styles.stat}>සහාය වූ දාන {counts.events_helped}</li>
          <li className={styles.stat}>ගෙනා දේවල් {counts.items_brought}</li>
          {counts.pending_count > 0 && <li className={styles.stat}>තහවුරු නොවූ {counts.pending_count}</li>}
        </ul>
      )}

      {groups.isPending && <p className={styles.message}>පූරණය වෙමින්…</p>}
      {groups.isError && <p role="alert" className={styles.message}>පැවරුම් පූරණය කිරීමට නොහැකි විය.</p>}
      {groups.data?.length === 0 && <p className={styles.message}>තවම කිසිදු දානයකට පවරා නැත.</p>}
      {groups.data?.map((group) => (
        <EventGroup key={group.event.id} contributor={profile} group={group} />
      ))}
    </main>
  )
}

function EventGroup({ contributor, group }: { contributor: Contributor; group: ContributorEventGroup }) {
  const { event, assignments } = group
  const titleId = `contributor-event-${event.id}`
  const when = `${formatDayMonth(event.date)} · ${MEAL_LABEL[event.meal]}`
  // Only upcoming events still need the contributor to bring anything.
  const share = event.is_past || event.cancelled_at ? null : whatsappUrl(contributor, shareMessage(contributor, group))
  return (
    <section aria-labelledby={titleId} className={styles.group}>
      <div className={styles.groupHead}>
        <h2 id={titleId} className={styles.groupTitle}>
          <Link to={`/events/${event.id}`} className={styles.groupLink}>
            {event.is_past ? `පසුගිය · ${when}` : when}
          </Link>
        </h2>
        {event.cancelled_at && <CancelledBadge />}
      </div>
      <p className={styles.groupSub}>{[event.host, event.monastery_name].filter(Boolean).join(' · ')}</p>
      <ul className={styles.assignments}>
        {assignments.map((assignment) => (
          <AssignmentRow key={assignment.id} contributorId={contributor.id} assignment={assignment} />
        ))}
      </ul>
      {share && (
        // Opens WhatsApp with the list typed in; the organizer sends it themselves.
        <a href={share} target="_blank" rel="noreferrer" className={styles.share}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" /></svg>
          ලැයිස්තුව යවන්න
        </a>
      )}
    </section>
  )
}

/** The pre-filled WhatsApp message: what the contributor brings to this event. */
function shareMessage(contributor: Contributor, { event, assignments }: ContributorEventGroup): string {
  const where = `${formatDayMonth(event.date)} ${formatWeekday(event.date)} ${MEAL_LABEL[event.meal]} (${event.monastery_name})`
  const lines = assignments.map(({ item, quantity }) => {
    const amount = formatAmount(quantity, item)
    return amount ? `• ${item.name} — ${amount}` : `• ${item.name}`
  })
  return [
    `නමෝ බුද්ධාය! ${contributor.name},`,
    '',
    `${where} සඳහා ඔබ ගෙන එන දේවල්:`,
    ...lines,
    '',
    'බොහොම ස්තූතියි!',
  ].join('\n')
}

function AssignmentRow({ contributorId, assignment }: { contributorId: string; assignment: ContributorAssignment }) {
  const confirm = useConfirmAssignment(contributorId)
  const toast = useToast()
  const saveFailed = useSaveFailed()
  const { item } = assignment
  const what = `${item.name} — ${STATUS_LABEL.confirmed}`

  function agreed() {
    confirm.mutate(assignment.id, {
      onSuccess: () => toast(`${what} ලෙස සුරැකිණි`),
      onError: () => saveFailed(`${what} සුරැකීමට නොහැකි විය`, agreed),
    })
  }

  return (
    <li className={styles.assignment}>
      <div className={styles.assignmentText}>
        <span className={styles.itemName}>{item.name}</span>
        <span className={styles.quantity}>{formatAmount(assignment.quantity, item) ?? 'ප්‍රමාණය සඳහන් කර නැත'}</span>
      </div>
      {assignment.status === 'pending' && (
        <button type="button" className={styles.confirm} aria-label={`${item.name} — ✓ එකඟ වුණා`} onClick={agreed}>
          ✓ එකඟ වුණා
        </button>
      )}
      <StatusBadge status={assignment.status} />
    </li>
  )
}
