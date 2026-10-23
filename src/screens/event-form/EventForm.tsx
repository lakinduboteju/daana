import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import type { EventFields } from '../../data/events'
import { MEAL_LABEL, type Meal } from '../../data/meal'
import { useRecentMonasteries } from '../../data/monasteries'
import styles from './EventFormScreen.module.css'
import { NEW_MONASTERY, type EventFormValues } from './eventFormValues'

type Props = {
  initial: EventFormValues
  submitLabel: string
  /** Where "අවලංගු" goes. */
  cancelTo: string
  /** Saves the event. Resolves to where to go next, or nothing to stay on the form. */
  onSave: (fields: EventFields) => Promise<string | void>
  /** Disables saving, e.g. while the household is still loading. */
  disabled?: boolean
}

/** The create and edit event form (same fields, same layout). */
export function EventForm({ initial, submitLabel, cancelTo, onSave, disabled }: Props) {
  const navigate = useNavigate()
  const monasteries = useRecentMonasteries()
  const [values, setValues] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const recent = monasteries.data ?? []
  // With no monasteries yet, the new-monastery fields show straight away.
  const monasteryChoice = values.monastery ?? (monasteries.isSuccess && recent.length === 0 ? NEW_MONASTERY : null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!values.date) return setError('දිනය ඇතුළත් කරන්න.')
    if (!monasteryChoice) return setError('අසපුවක් තෝරන්න.')
    if (monasteryChoice === NEW_MONASTERY && !values.monasteryName.trim()) return setError('අසපුවේ නම ඇතුළත් කරන්න.')
    setError(null)
    setSaving(true)

    try {
      const next = await onSave({
        date: values.date,
        meal: values.meal,
        monastery:
          monasteryChoice === NEW_MONASTERY
            ? { name: values.monasteryName, location: values.monasteryLocation }
            : { id: monasteryChoice },
        host: values.host,
        monkCount: toCount(values.monkCount),
        laypersonCount: toCount(values.laypersonCount),
        organizerName: values.organizerName,
        organizerPhone: values.organizerPhone,
        notes: values.notes,
        instructions: values.instructions,
      })
      if (next) navigate(next)
    } catch {
      setError('සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor="event-date" className={styles.label}>
          දිනය <span className={styles.required}>*</span>
        </label>
        <input id="event-date" type="date" className={styles.input} value={values.date} onChange={(e) => set('date', e.target.value)} required />
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

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>
          අසපුව <span className={styles.required}>*</span>
        </legend>
        {recent.length > 0 && (
          <div className={styles.chips}>
            <span className={styles.hint}>පෙර භාවිත:</span>
            {recent.map((monastery) => (
              <label key={monastery.id} className={styles.chip}>
                <input
                  type="radio"
                  name="monastery"
                  value={monastery.id}
                  checked={monasteryChoice === monastery.id}
                  onChange={() => set('monastery', monastery.id)}
                />
                {monastery.name}
              </label>
            ))}
            <label className={styles.chip}>
              <input
                type="radio"
                name="monastery"
                value={NEW_MONASTERY}
                checked={monasteryChoice === NEW_MONASTERY}
                onChange={() => set('monastery', NEW_MONASTERY)}
              />
              + අළුත් අසපුවක්
            </label>
          </div>
        )}
        {monasteryChoice === NEW_MONASTERY && (
          <div className={styles.newMonastery}>
            <label htmlFor="monastery-name" className={styles.subLabel}>අසපුවේ නම</label>
            <input id="monastery-name" className={styles.input} value={values.monasteryName} onChange={(e) => set('monasteryName', e.target.value)} placeholder="උදා: මාලබේ අසපුව" />
            <label htmlFor="monastery-location" className={styles.subLabel}>ස්ථානය (අවශ්‍ය නම් පමණක්)</label>
            <input id="monastery-location" className={styles.input} value={values.monasteryLocation} onChange={(e) => set('monasteryLocation', e.target.value)} />
          </div>
        )}
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="event-host" className={styles.label}>දානය භාරගත් අය (අවශ්‍ය නම් පමණක්)</label>
        <input id="event-host" className={styles.input} value={values.host} onChange={(e) => set('host', e.target.value)} placeholder="උදා: බොතේජු පවුල" />
      </div>

      <div className={styles.counts}>
        <Stepper id="monk-count" label="ස්වාමීන් වහන්සේලා" value={values.monkCount} onChange={(v) => set('monkCount', v)} />
        <Stepper id="layperson-count" label="ගිහි පිරිස" value={values.laypersonCount} onChange={(v) => set('laypersonCount', v)} />
        <div className={styles.total}>
          <span>මුළු පිරිස (ස්වයංක්‍රීයව)</span>
          <b>{toCount(values.monkCount) + toCount(values.laypersonCount)}</b>
        </div>
      </div>

      <details className={styles.more}>
        <summary className={styles.moreSummary}>අමතර විස්තර (අවශ්‍ය නම් පමණක්)</summary>
        <div className={styles.moreBody}>
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

function toCount(value: string): number {
  const count = Number.parseInt(value, 10)
  return Number.isNaN(count) ? 0 : count
}
