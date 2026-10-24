import { useId, useState } from 'react'
import { useContributors, useRecentContributors } from '../../data/contributors'
import { useRecentMonasteries } from '../../data/monasteries'
import { STATUS_LABEL, STATUS_SYMBOL, type ItemStatus } from '../../data/status'
import { colomboToday } from '../../lib/dates'
import styles from './SearchFilters.module.css'

/** The filters as they are in the URL. */
export type Filters = {
  from: string | null
  to: string | null
  /** The raw `status` param, e.g. 'pending,partial'. */
  status: string
  monasteryId: string | null
  contributorId: string | null
}

type Changes = Record<string, string | null>

/** "තහවුරු නොවූ": everything not yet agreed in full, as the design's preset. */
const NOT_CONFIRMED = 'pending,partial'

const STATUS_OPTIONS: ItemStatus[] = ['unassigned', 'pending', 'partial', 'confirmed', 'received']

type DateRange = '' | 'upcoming' | 'past' | 'custom'

/** Quick presets, then one dropdown chip per filter. Every choice is a query param. */
export function SearchFilters({ filters, onChange }: { filters: Filters; onChange: (changes: Changes) => void }) {
  const monasteries = useRecentMonasteries()
  const contributors = useContributors('')
  const latest = useRecentContributors().data?.[0]
  return (
    <div className={styles.filters}>
      <div role="group" aria-label="ඉක්මන් පෙරහන්" className={styles.row}>
        <Preset label="තහවුරු නොවූ" pressed={filters.status === NOT_CONFIRMED} onToggle={(on) => onChange({ status: on ? NOT_CONFIRMED : null })} />
        <Preset label="පවරා නැති" pressed={filters.status === 'unassigned'} onToggle={(on) => onChange({ status: on ? 'unassigned' : null })} />
        {latest && (
          <Preset
            label={`${latest.name.split(' ')[0]}ගේ අයිතම`}
            pressed={filters.contributorId === latest.id}
            onToggle={(on) => onChange({ contributor: on ? latest.id : null })}
          />
        )}
      </div>
      <div className={styles.row}>
        <DateRangeChip from={filters.from} to={filters.to} onChange={onChange} />
        <ChipSelect
          label="අසපුව"
          value={filters.monasteryId ?? ''}
          onChange={(monastery) => onChange({ monastery })}
          options={[
            { value: '', label: 'සියලු අසපු' },
            ...(monasteries.data ?? []).map((m) => ({ value: m.id, label: m.name })),
          ]}
        />
        <ChipSelect
          label="දායකයා"
          value={filters.contributorId ?? ''}
          onChange={(contributor) => onChange({ contributor })}
          options={[
            { value: '', label: 'ඕනෑම දායකයෙක්' },
            ...(contributors.data ?? []).map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <ChipSelect
          label="තත්ත්වය"
          value={filters.status}
          onChange={(status) => onChange({ status })}
          options={[
            { value: '', label: 'ඕනෑම තත්ත්වයක්' },
            { value: NOT_CONFIRMED, label: 'තහවුරු නොවූ' },
            ...STATUS_OPTIONS.map((s) => ({ value: s, label: `${STATUS_SYMBOL[s]} ${STATUS_LABEL[s]}` })),
          ]}
        />
      </div>
    </div>
  )
}

function Preset({ label, pressed, onToggle }: { label: string; pressed: boolean; onToggle: (on: boolean) => void }) {
  return (
    <button type="button" aria-pressed={pressed} className={pressed ? styles.presetOn : styles.preset} onClick={() => onToggle(!pressed)}>
      {label}
    </button>
  )
}

type Option = { value: string; label: string }

/** A native select drawn as a chip; "on" when it isn't on its first (any) option. */
function ChipSelect({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (value: string) => void }) {
  const known = options.some((o) => o.value === value)
  const labelId = useId()
  return (
    <label className={value ? styles.chipOn : styles.chip}>
      <span id={labelId} className={styles.chipLabel}>{label}</span>
      <select aria-labelledby={labelId} value={known ? value : ''} onChange={(event) => onChange(event.target.value)} className={styles.select}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

/** Any date, upcoming (from today), past (to yesterday), or chosen dates. */
function DateRangeChip({ from, to, onChange }: { from: string | null; to: string | null; onChange: (changes: Changes) => void }) {
  const [choosing, setChoosing] = useState(false)
  const today = colomboToday()
  const yesterday = colomboToday(-1)
  let range: DateRange = ''
  if (from === today && !to) range = 'upcoming'
  else if (!from && to === yesterday) range = 'past'
  else if (from || to) range = 'custom'
  if (choosing && range !== 'upcoming' && range !== 'past') range = 'custom'

  function choose(value: DateRange) {
    setChoosing(value === 'custom')
    if (value === 'upcoming') onChange({ from: today, to: null })
    else if (value === 'past') onChange({ from: null, to: yesterday })
    else if (value === '') onChange({ from: null, to: null })
  }

  return (
    <>
      <ChipSelect
        label="දින පරාසය"
        value={range}
        onChange={(value) => choose(value as DateRange)}
        options={[
          { value: '', label: 'ඕනෑම දිනයක්' },
          { value: 'upcoming', label: 'ඉදිරි දාන' },
          { value: 'past', label: 'පසුගිය දාන' },
          { value: 'custom', label: 'දින තෝරන්න' },
        ]}
      />
      {range === 'custom' && (
        <div className={styles.dates}>
          <label className={styles.dateField}>
            සිට
            <input type="date" value={from ?? ''} onChange={(event) => onChange({ from: event.target.value || null })} />
          </label>
          <label className={styles.dateField}>
            දක්වා
            <input type="date" value={to ?? ''} onChange={(event) => onChange({ to: event.target.value || null })} />
          </label>
        </div>
      )}
    </>
  )
}
