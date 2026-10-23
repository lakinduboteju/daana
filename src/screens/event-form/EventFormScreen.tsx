import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { BackHeader } from '../../components/BackHeader'
import { useCreateEvent } from '../../data/events'
import { useHouseholds } from '../../data/household'
import { MEAL_LABEL, type Meal } from '../../data/meal'
import { useRecentMonasteries } from '../../data/monasteries'
import styles from './EventFormScreen.module.css'

const NEW_MONASTERY = 'new'

/** /events/new: create an event, then go to its menu. */
export function EventFormScreen() {
  const navigate = useNavigate()
  const households = useHouseholds()
  const monasteries = useRecentMonasteries()
  const createEvent = useCreateEvent()

  const [date, setDate] = useState('')
  const [meal, setMeal] = useState<Meal>('lunch')
  const [pickedMonastery, setPickedMonastery] = useState<string | null>(null)
  const [monasteryName, setMonasteryName] = useState('')
  const [monasteryLocation, setMonasteryLocation] = useState('')
  const [host, setHost] = useState('')
  const [monkCount, setMonkCount] = useState('0')
  const [laypersonCount, setLaypersonCount] = useState('0')
  const [organizerName, setOrganizerName] = useState('')
  const [organizerPhone, setOrganizerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [instructions, setInstructions] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recent = monasteries.data ?? []
  // With no monasteries yet, the new-monastery fields show straight away.
  const monasteryChoice = pickedMonastery ?? (monasteries.isSuccess && recent.length === 0 ? NEW_MONASTERY : null)
  const householdId = households.data?.[0]?.id

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!date) return setError('දිනය ඇතුළත් කරන්න.')
    if (!monasteryChoice) return setError('අසපුවක් තෝරන්න.')
    if (monasteryChoice === NEW_MONASTERY && !monasteryName.trim()) return setError('අසපුවේ නම ඇතුළත් කරන්න.')
    if (!householdId) return
    setError(null)

    try {
      const eventId = await createEvent.mutateAsync({
        householdId,
        date,
        meal,
        monastery:
          monasteryChoice === NEW_MONASTERY
            ? { name: monasteryName, location: monasteryLocation }
            : { id: monasteryChoice },
        host,
        monkCount: toCount(monkCount),
        laypersonCount: toCount(laypersonCount),
        organizerName,
        organizerPhone,
        notes,
        instructions,
      })
      navigate(`/events/${eventId}`)
    } catch {
      setError('සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.')
    }
  }

  return (
    <main className={styles.screen}>
      <BackHeader title="අළුත් දානයක්" backTo="/events" />
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="event-date" className={styles.label}>
            දිනය <span className={styles.required}>*</span>
          </label>
          <input id="event-date" type="date" className={styles.input} value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <fieldset className={styles.fieldset}>
          <legend className={styles.label}>
            දානය <span className={styles.required}>*</span>
          </legend>
          <div className={styles.meals}>
            {(Object.keys(MEAL_LABEL) as Meal[]).map((value) => (
              <label key={value} className={styles.meal}>
                <input type="radio" name="meal" value={value} checked={meal === value} onChange={() => setMeal(value)} />
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
                    onChange={() => setPickedMonastery(monastery.id)}
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
                  onChange={() => setPickedMonastery(NEW_MONASTERY)}
                />
                + අළුත් අසපුවක්
              </label>
            </div>
          )}
          {monasteryChoice === NEW_MONASTERY && (
            <div className={styles.newMonastery}>
              <label htmlFor="monastery-name" className={styles.subLabel}>අසපුවේ නම</label>
              <input id="monastery-name" className={styles.input} value={monasteryName} onChange={(e) => setMonasteryName(e.target.value)} placeholder="උදා: මාලබේ අසපුව" />
              <label htmlFor="monastery-location" className={styles.subLabel}>ස්ථානය (අවශ්‍ය නම් පමණක්)</label>
              <input id="monastery-location" className={styles.input} value={monasteryLocation} onChange={(e) => setMonasteryLocation(e.target.value)} />
            </div>
          )}
        </fieldset>

        <div className={styles.field}>
          <label htmlFor="event-host" className={styles.label}>දානය භාරගත් අය (අවශ්‍ය නම් පමණක්)</label>
          <input id="event-host" className={styles.input} value={host} onChange={(e) => setHost(e.target.value)} placeholder="උදා: බොතේජු පවුල" />
        </div>

        <div className={styles.counts}>
          <Stepper id="monk-count" label="ස්වාමීන් වහන්සේලා" value={monkCount} onChange={setMonkCount} />
          <Stepper id="layperson-count" label="ගිහි පිරිස" value={laypersonCount} onChange={setLaypersonCount} />
          <div className={styles.total}>
            <span>මුළු පිරිස (ස්වයංක්‍රීයව)</span>
            <b>{toCount(monkCount) + toCount(laypersonCount)}</b>
          </div>
        </div>

        <details className={styles.more}>
          <summary className={styles.moreSummary}>අමතර විස්තර (අවශ්‍ය නම් පමණක්)</summary>
          <div className={styles.moreBody}>
            <label htmlFor="organizer-name" className={styles.subLabel}>සංවිධායකගේ නම</label>
            <input id="organizer-name" className={styles.input} value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} />
            <label htmlFor="organizer-phone" className={styles.subLabel}>සංවිධායකගේ දුරකථනය</label>
            <input id="organizer-phone" type="tel" className={styles.input} value={organizerPhone} onChange={(e) => setOrganizerPhone(e.target.value)} />
            <label htmlFor="event-notes" className={styles.subLabel}>සටහන්</label>
            <textarea id="event-notes" className={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <label htmlFor="event-instructions" className={styles.subLabel}>විශේෂ ආහාර අවශ්‍යතා / අසපුවේ උපදෙස්</label>
            <textarea id="event-instructions" className={styles.textarea} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          </div>
        </details>

        {error && <p role="alert" className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Link to="/events" className={styles.cancel}>අවලංගු</Link>
          <button type="submit" className={styles.save} disabled={createEvent.isPending || !householdId}>
            සුරකින්න, මෙනුවට යන්න
          </button>
        </div>
      </form>
    </main>
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
