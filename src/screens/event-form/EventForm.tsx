import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { UnsavedChangesGuard } from '../../components/UnsavedChangesGuard'
import type { EventFields } from '../../data/events'
import { MEAL_LABEL, type Meal } from '../../data/meal'
import { toIsoDate } from '../../lib/dates'
import styles from './EventFormScreen.module.css'
import { type EventFormValues } from './eventFormValues'

type Props = {
  initial: EventFormValues
  submitLabel: string
  /** Where "අවලංගු" goes. */
  cancelTo: string
  /** Saves the event. Resolves to where to go next, or nothing to stay on the form. */
  onSave: (fields: EventFields) => Promise<string | void>
  /** Disables saving, e.g. while the household is still loading. */
  disabled?: boolean
  /** Shown below the fields, e.g. the edit form's cancel and delete actions. */
  children?: ReactNode
}

/** The create and edit event form (same fields, same layout). */
export function EventForm({ initial, submitLabel, cancelTo, onSave, disabled, children }: Props) {
  const navigate = useNavigate()
  const [values, setValues] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // What was last loaded or saved; leaving with anything else asks first.
  const saved = useRef(initial)
  const current = useRef(values)
  useEffect(() => {
    current.current = values
  }, [values])

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const isoDate = toIsoDate(values.date)
    if (!values.date.trim()) return setError('දිනය ඇතුළත් කරන්න.')
    if (!isoDate) return setError('වලංගු දිනයක් ඇතුළත් කරන්න.')
    if (!values.monasteryName.trim()) return setError('අසපුව ඇතුළත් කරන්න.')
    setError(null)
    setSaving(true)
    const submitted = values

    try {
      const next = await onSave({
        date: isoDate,
        meal: values.meal,
        monasteryName: values.monasteryName,
        host: values.host,
        monkCount: toCount(values.monkCount),
        laypersonCount: toCount(values.laypersonCount),
        organizerName: values.organizerName,
        organizerPhone: values.organizerPhone,
        notes: values.notes,
        instructions: values.instructions,
      })
      saved.current = submitted
      if (next) navigate(next)
    } catch {
      setError('සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <UnsavedChangesGuard isDirty={() => !sameValues(current.current, saved.current)} />
      <div className={styles.field}>
        <label htmlFor="event-date" className={styles.label}>
          දිනය <span className={styles.required}>*</span>
        </label>
        <input id="event-date" type="text" autoComplete="off" placeholder="dd/mm/yyyy" className={styles.input} value={values.date} onChange={(e) => set('date', e.target.value)} required />
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>
          දානය <span className={styles.required}>*</span>
        </legend>
        <div className={styles.meals}>
          {(Object.keys(MEAL_LABEL) as Meal[]).map((value) => (
            <label key={value} className={styles.meal}>
              <input type="radio" name="meal" value={value} checked={values.meal === value} onChange={() => set('meal', value)} />
              {MEAL_LABEL[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="event-monastery" className={styles.label}>
          අසපුව <span className={styles.required}>*</span>
        </label>
        <input id="event-monastery" className={styles.input} value={values.monasteryName} onChange={(e) => set('monasteryName', e.target.value)} required />
      </div>

      <div className={styles.field}>
        <label htmlFor="event-host" className={styles.label}>දානය භාරගත් අය (optional)</label>
        <input id="event-host" className={styles.input} value={values.host} onChange={(e) => set('host', e.target.value)} />
      </div>

      <details className={styles.more}>
        <summary className={styles.moreSummary}>අමතර විස්තර (optional)</summary>
        <div className={styles.moreBody}>
          <div className={styles.counts}>
            <Stepper id="monk-count" label="ස්වාමීන් වහන්සේලා" value={values.monkCount} onChange={(v) => set('monkCount', v)} />
            <Stepper id="layperson-count" label="ගිහි පිරිස" value={values.laypersonCount} onChange={(v) => set('laypersonCount', v)} />
            <div className={styles.total}>
              <span>මුළු පිරිස</span>
              <b>{toCount(values.monkCount) + toCount(values.laypersonCount)}</b>
            </div>
          </div>
          <label htmlFor="organizer-name" className={styles.subLabel}>සංවිධායකගේ නම</label>
          <input id="organizer-name" className={styles.input} value={values.organizerName} onChange={(e) => set('organizerName', e.target.value)} />
          <label htmlFor="organizer-phone" className={styles.subLabel}>සංවිධායකගේ දුරකථනය</label>
          <input id="organizer-phone" type="tel" className={styles.input} value={values.organizerPhone} onChange={(e) => set('organizerPhone', e.target.value)} />
          <label htmlFor="event-notes" className={styles.subLabel}>සටහන්</label>
          <textarea id="event-notes" className={styles.textarea} value={values.notes} onChange={(e) => set('notes', e.target.value)} />
          <label htmlFor="event-instructions" className={styles.subLabel}>විශේෂ ආහාර අවශ්‍යතා / අසපුවේ උපදෙස්</label>
          <textarea id="event-instructions" className={styles.textarea} value={values.instructions} onChange={(e) => set('instructions', e.target.value)} />
        </div>
      </details>

      {error && <p role="alert" className={styles.error}>{error}</p>}

      {children}

      <div className={styles.actions}>
        <Link to={cancelTo} className={styles.cancel}>අවලංගු</Link>
        <button type="submit" className={styles.save} disabled={saving || disabled}>
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

function Stepper({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  const count = toCount(value)
  return (
    <div className={styles.stepper}>
      <label htmlFor={id} className={styles.stepperLabel}>{label}</label>
      <button type="button" className={styles.step} aria-label={`${label} අඩු කරන්න`} onClick={() => onChange(String(Math.max(0, count - 1)))}>−</button>
      <input
        id={id}
        className={styles.stepValue}
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      />
      <button type="button" className={styles.step} aria-label={`${label} වැඩි කරන්න`} onClick={() => onChange(String(count + 1))}>+</button>
    </div>
  )
}

function sameValues(a: EventFormValues, b: EventFormValues): boolean {
  return (Object.keys(a) as (keyof EventFormValues)[]).every((key) => a[key] === b[key])
}

function toCount(value: string): number {
  const count = Number.parseInt(value, 10)
  return Number.isNaN(count) ? 0 : count
}
