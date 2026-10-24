import { useRef, useState, type FormEvent } from 'react'
import { useParams } from 'react-router'
import { Sheet } from '../../components/Sheet'
import { useCloseSheet } from '../../components/sheetNavigation'
import { StatusChoice } from '../../components/StatusChoice'
import { UnsavedChangesGuard } from '../../components/UnsavedChangesGuard'
import { useToast } from '../../components/useToast'
import { useRemoveAssignment, useUpdateAssignment } from '../../data/assignments'
import { findItem, useMenu, type Assignment } from '../../data/menu'
import type { AssignmentStatus } from '../../data/status'
import { unitName } from '../../data/units'
import styles from './AssignmentSheets.module.css'

/** /events/:eventId/items/:itemId/assignments/:assignmentId: change one assignment's quantity or status, or remove it. */
export function EditAssignmentSheet() {
  const { eventId = '', itemId = '', assignmentId = '' } = useParams()
  const menu = useMenu(eventId)
  const item = menu.data ? findItem(menu.data, itemId) : null
  const assignment = item?.assignments.find((a) => a.id === assignmentId)
  const close = useCloseSheet(`/events/${eventId}/items/${itemId}`)
  const [removed, setRemoved] = useState(false)

  return (
    <Sheet title="පැවරුම සංස්කරණය" onClose={close}>
      {menu.data && !assignment && !removed && <p className={styles.missing}>මෙම පැවරුම හමු නොවීය.</p>}
      {item && assignment && (
        <AssignmentForm
          key={assignment.id}
          eventId={eventId}
          itemName={item.name}
          unit={unitName(item)}
          assignment={assignment}
          onRemoved={() => setRemoved(true)}
          onDone={close}
        />
      )}
    </Sheet>
  )
}

type FormProps = {
  eventId: string
  itemName: string
  unit: string
  assignment: Assignment
  onRemoved: () => void
  onDone: () => void
}

function AssignmentForm({ eventId, itemName, unit, assignment, onRemoved, onDone }: FormProps) {
  const [quantity, setQuantity] = useState(assignment.quantity?.toString() ?? '')
  const [status, setStatus] = useState<AssignmentStatus>(assignment.status)
  const update = useUpdateAssignment(eventId)
  const remove = useRemoveAssignment(eventId)
  const toast = useToast()
  const { name } = assignment.contributor
  const done = useRef(false)
  const isDirty = () =>
    !done.current && (quantity !== (assignment.quantity?.toString() ?? '') || status !== assignment.status)

  function submit(e: FormEvent) {
    e.preventDefault()
    update.mutate(
      { assignmentId: assignment.id, quantity: quantity.trim() === '' ? null : Number(quantity), status },
      {
        onSuccess: () => {
          done.current = true
          toast(`${name}ගේ පැවරුම සුරැකිණි`)
          onDone()
        },
      },
    )
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <UnsavedChangesGuard isDirty={isDirty} />
      <p className={styles.optionName}>{name} · {itemName}</p>
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

      <StatusChoice label="තත්ත්වය" value={status} onChange={setStatus} />

      {(update.isError || remove.isError) && (
        <p role="alert" className={styles.error}>සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.</p>
      )}

      <button type="submit" className={styles.submit} disabled={update.isPending}>සුරකින්න</button>
      <button
        type="button"
        className={styles.remove}
        disabled={remove.isPending}
        onClick={() => {
          onRemoved()
          // mutateAsync, because this form unmounts once the menu no longer has the assignment.
          remove.mutateAsync(assignment.id).then(
            () => {
              done.current = true
              toast(`${name} ${itemName} වෙතින් ඉවත් කළා`)
              onDone()
            },
            () => {},
          )
        }}
      >
        පැවරුම ඉවත් කරන්න
      </button>
    </form>
  )
}
