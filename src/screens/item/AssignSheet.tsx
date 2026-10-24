import { useRef, useState, type FormEvent } from 'react'
import { useParams } from 'react-router'
import { Sheet } from '../../components/Sheet'
import { useCloseSheet } from '../../components/sheetNavigation'
import { UnsavedChangesGuard } from '../../components/UnsavedChangesGuard'
import { useToast } from '../../components/useToast'
import { useAssign } from '../../data/assignments'
import { useContributors, useRecentContributors, type Contributor } from '../../data/contributors'
import { findItem, useMenu } from '../../data/menu'
import type { AssignmentStatus } from '../../data/status'
import { unitName } from '../../data/units'
import { AgreedChoice } from '../../components/StatusChoice'
import styles from './AssignmentSheets.module.css'

/**
 * /events/:eventId/items/:itemId/assign: pick a contributor (search, recent
 * ones, or a new one typed in), a quantity and whether they've agreed.
 * A new assignment is pending unless the organizer says they've agreed.
 */
export function AssignSheet() {
  const { eventId = '', itemId = '' } = useParams()
  const menu = useMenu(eventId)
  const item = menu.data ? findItem(menu.data, itemId) : null
  const close = useCloseSheet(`/events/${eventId}/items/${itemId}`)

  return (
    <Sheet title={item ? `${item.name} — දායකයා` : 'දායකයා'} onClose={close}>
      {menu.data && !item && <p className={styles.missing}>මෙම Item එක හමු නොවීය.</p>}
      {item && <AssignForm eventId={eventId} itemId={item.id} itemName={item.name} unit={unitName(item)} onDone={close} />}
    </Sheet>
  )
}

type Pick = { kind: 'existing'; contributor: Contributor } | { kind: 'new' } | null

function AssignForm({ eventId, itemId, itemName, unit, onDone }: { eventId: string; itemId: string; itemName: string; unit: string; onDone: () => void }) {
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<Pick>(null)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [quantity, setQuantity] = useState('')
  const [status, setStatus] = useState<AssignmentStatus>('pending')
  const recent = useRecentContributors()
  const searching = q.trim() !== '' || (recent.data !== undefined && recent.data.length === 0)
  const found = useContributors(q)
  const assign = useAssign(eventId)
  const toast = useToast()
  const done = useRef(false)
  const isDirty = () => !done.current && (pick !== null || quantity.trim() !== '' || status !== 'pending')

  const options: (Contributor & { meta: string | null })[] = searching
    ? (found.data ?? []).map((c) => ({ ...c, meta: c.phone }))
    : (recent.data ?? []).map((c) => ({ ...c, meta: `අවසන්: ${c.lastItem}` }))

  const name = pick?.kind === 'existing' ? pick.contributor.name : pick?.kind === 'new' ? newName.trim() : ''
  const firstName = name.split(' ')[0]

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!pick || !name) return
    assign.mutate(
      {
        itemId,
        contributor: pick.kind === 'existing' ? { id: pick.contributor.id } : { name, phone: newPhone.trim() || null },
        quantity: quantity.trim() === '' ? null : Number(quantity),
        status,
      },
      {
        onSuccess: (assigned) => {
          done.current = true
          toast(`${itemName} ${assigned}ට පැවරුණා`)
          onDone()
        },
      },
    )
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <UnsavedChangesGuard isDirty={isDirty} />
      <input
        type="search"
        aria-label="දායකයා සොයන්න"
        placeholder="දායකයා සොයන්න"
        className={styles.input}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>{searching ? 'දායකයන්' : 'මෑතදී පැවරූ අය'}</legend>
        {searching && found.data?.length === 0 && <p className={styles.empty}>“{q.trim()}” නමින් දායකයෙක් නැත</p>}
        <div className={styles.options}>
          {options.map((c) => (
            <label key={c.id} className={styles.option}>
              <input
                type="radio"
                name="contributor"
                checked={pick?.kind === 'existing' && pick.contributor.id === c.id}
                onChange={() => setPick({ kind: 'existing', contributor: c })}
              />
              <span className={styles.optionText}>
                <span className={styles.optionName}>{c.name}</span>
                {c.meta && <span className={styles.optionMeta}>{c.meta}</span>}
              </span>
            </label>
          ))}
          <label className={styles.option}>
            <input
              type="radio"
              name="contributor"
              checked={pick?.kind === 'new'}
              onChange={() => {
                setPick({ kind: 'new' })
                if (!newName) setNewName(q.trim())
              }}
            />
            <span className={styles.optionName}>+ නව දායකයෙක් එක් කරන්න</span>
          </label>
        </div>
      </fieldset>

      {pick?.kind === 'new' && (
        <div className={styles.newContributor}>
          <label className={styles.field}>
            <span className={styles.label}>නම</span>
            <input className={styles.input} value={newName} onChange={(e) => setNewName(e.target.value)} required />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>දුරකථන අංකය (optional)</span>
            <input className={styles.input} type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          </label>
        </div>
      )}

      <label className={styles.field}>
        <span className={styles.label}>ප්‍රමාණය{unit && ` (${unit})`}</span>
        <input
          className={styles.input}
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </label>

      <AgreedChoice value={status} onChange={setStatus} />

      {assign.isError && <p role="alert" className={styles.error}>පැවරීමට නොහැකි විය. නැවත උත්සාහ කරන්න.</p>}

      <button type="submit" className={styles.submit} disabled={!name || assign.isPending}>
        {name ? `${firstName} ට පවරන්න` : 'පවරන්න'}
      </button>
    </form>
  )
}
