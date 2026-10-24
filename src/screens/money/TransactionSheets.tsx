import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Sheet } from '../../components/Sheet'
import { useCloseSheet } from '../../components/sheetNavigation'
import { UnsavedChangesGuard } from '../../components/UnsavedChangesGuard'
import { useToast } from '../../components/useToast'
import { useContributors } from '../../data/contributors'
import { useMenu } from '../../data/menu'
import {
  KIND_LABEL,
  METHOD_LABEL,
  useAddTransaction,
  useDeleteTransaction,
  useEventMoney,
  useUpdateTransaction,
  type PaymentMethod,
  type TransactionFields,
  type TransactionKind,
} from '../../data/money'
import { colomboToday } from '../../lib/dates'
import { DocumentsSection } from '../documents/DocumentsSection'
import styles from '../event/ItemSheets.module.css'
import sheetStyles from './TransactionSheets.module.css'

const NEW_TITLE: Record<TransactionKind, string> = { given: 'ලබා දුන් මුදලක්', expense: 'වියදමක්' }

/**
 * /events/:eventId/money/new?type=given|expense&item=<id>&contributor=<id>&amount=<n>:
 * record a given or an expense. `contributor` and `amount` prefill settling a
 * reimbursement.
 */
export function AddTransactionSheet() {
  const { eventId = '' } = useParams()
  const [params] = useSearchParams()
  const kind: TransactionKind = params.get('type') === 'expense' ? 'expense' : 'given'
  const add = useAddTransaction(eventId)
  const toast = useToast()
  const close = useCloseSheet(`/events/${eventId}/money`)
  const amount = Number(params.get('amount'))

  return (
    <TransactionForm
      title={NEW_TITLE[kind]}
      initial={{
        kind,
        amount: Number.isInteger(amount) && amount > 0 ? amount : 0,
        date: colomboToday(),
        method: null,
        notes: '',
        itemId: params.get('item'),
        contributorId: params.get('contributor'),
      }}
      saving={add.isPending}
      failed={add.isError}
      onClose={close}
      onSubmit={(fields, saved) =>
        add.mutate(fields, {
          onSuccess: () => {
            saved()
            toast('සුරැකිණි')
            close()
          },
        })
      }
    />
  )
}

/** /events/:eventId/money/:transactionId: view, edit or delete a transaction, and its documents. */
export function EditTransactionSheet() {
  const { eventId = '', transactionId = '' } = useParams()
  const money = useEventMoney(eventId)
  const update = useUpdateTransaction(eventId)
  const remove = useDeleteTransaction(eventId)
  const toast = useToast()
  const close = useCloseSheet(`/events/${eventId}/money`)
  const [confirming, setConfirming] = useState(false)
  const transaction = money.data?.transactions.find((t) => t.id === transactionId)

  if (!money.data || !transaction) {
    return (
      <Sheet title="Edit" onClose={close}>
        {money.isPending ? <p className={styles.missing}>…</p> : <p className={styles.missing}>මෙම ගනුදෙනුව හමු නොවීය.</p>}
      </Sheet>
    )
  }

  return (
    <TransactionForm
      key={transaction.id}
      title="Edit"
      initial={{
        kind: transaction.kind,
        amount: transaction.amount,
        date: transaction.date,
        method: transaction.method,
        notes: transaction.notes ?? '',
        itemId: transaction.item?.id ?? null,
        contributorId: transaction.contributor?.id ?? null,
      }}
      knownItem={transaction.item}
      knownContributor={transaction.contributor}
      saving={update.isPending}
      failed={update.isError}
      onClose={close}
      onSubmit={(fields, saved) =>
        update.mutate(
          { transactionId, fields },
          {
            onSuccess: () => {
              saved()
              toast('සුරැකිණි')
              close()
            },
          },
        )
      }
    >
      <>
        <DocumentsSection
          eventId={eventId}
          transactionId={transaction.id}
          itemId={transaction.item?.id}
          className={sheetStyles.documents}
        />
        <button type="button" className={styles.danger} onClick={() => setConfirming(true)}>
          මකන්න
        </button>
        {confirming && (
          <ConfirmDialog
            title="මෙම ගනුදෙනුව මකන්නද?"
            confirmLabel="ඔව්, මකන්න"
            destructive
            busy={remove.isPending}
            onCancel={() => setConfirming(false)}
            onConfirm={() =>
              // mutateAsync: the sheet (and its unsaved-changes guard) unmounts
              // once the refetched money no longer has the transaction.
              void remove.mutateAsync(transactionId).then(
                () => {
                  toast('ගනුදෙනුව මකා දැමුවා')
                  close()
                },
                () => {},
              )
            }
          >
            {remove.isError && <p role="alert">මැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.</p>}
          </ConfirmDialog>
        )}
      </>
  </TransactionForm>
  )
}

type FormProps = {
  title: string
  initial: TransactionFields
  /** The saved item and contributor, offered even if no longer in the pickers (archived). */
  knownItem?: { id: string; name: string } | null
  knownContributor?: { id: string; name: string } | null
  saving: boolean
  failed: boolean
  onClose: () => void
  /** `saved()` marks the form clean so closing doesn't ask about unsaved changes. */
  onSubmit: (fields: TransactionFields, saved: () => void) => void
  children?: ReactNode
}

function TransactionForm({ title, initial, knownItem, knownContributor, saving, failed, onClose, onSubmit, children }: FormProps) {
  const { eventId = '' } = useParams()
  const menu = useMenu(eventId)
  const contributors = useContributors('')
  const [kind, setKind] = useState(initial.kind)
  const [amount, setAmount] = useState(initial.amount ? String(initial.amount) : '')
  const [date, setDate] = useState(initial.date)
  const [method, setMethod] = useState<PaymentMethod | null>(initial.method)
  const [notes, setNotes] = useState(initial.notes)
  const [itemId, setItemId] = useState(initial.itemId ?? '')
  const [contributorId, setContributorId] = useState(initial.contributorId ?? '')
  const savedRef = useRef(false)
  const saved = () => {
    savedRef.current = true
  }
  const isDirty = () =>
    !savedRef.current &&
    (kind !== initial.kind ||
      amount !== (initial.amount ? String(initial.amount) : '') ||
      date !== initial.date ||
      method !== initial.method ||
      notes !== initial.notes ||
      itemId !== (initial.itemId ?? '') ||
      contributorId !== (initial.contributorId ?? ''))

  const items = (menu.data ?? []).flatMap((c) => c.items.map((i) => ({ id: i.id, name: i.name })))
  if (knownItem && !items.some((i) => i.id === knownItem.id)) items.push(knownItem)
  const people = (contributors.data ?? []).map((c) => ({ id: c.id, name: c.name }))
  if (knownContributor && !people.some((c) => c.id === knownContributor.id)) people.push(knownContributor)

  function submit(e: FormEvent) {
    e.preventDefault()
    onSubmit(
      {
        kind,
        amount: Number(amount),
        date,
        method: kind === 'given' ? method : null,
        notes,
        itemId: itemId || null,
        contributorId: contributorId || null,
      },
      saved,
    )
  }

  return (
    <Sheet title={title} onClose={onClose}>
      <UnsavedChangesGuard isDirty={isDirty} />
      <form className={styles.form} onSubmit={submit}>
        <fieldset className={sheetStyles.choice}>
          <legend className={styles.label}>වර්ගය</legend>
          <div className={sheetStyles.options}>
            {(['given', 'expense'] as const).map((k) => (
              <label key={k} className={sheetStyles.option}>
                <input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} />
                {KIND_LABEL[k]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>මුදල (Rs) <span className={styles.required}>*</span></span>
            <input
              className={styles.input}
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>දිනය <span className={styles.required}>*</span></span>
            <input className={styles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>දායකයා</span>
          <select className={styles.input} value={contributorId} onChange={(e) => setContributorId(e.target.value)}>
            <option value="">— සංවිධායක —</option>
            {people.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Item</span>
          <select className={styles.input} value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <option value="">— සාමාන්‍ය —</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </label>

        {kind === 'given' && (
          <fieldset className={sheetStyles.choice}>
            <legend className={styles.label}>ක්‍රමය (optional)</legend>
            <div className={sheetStyles.options}>
              {(['cash', 'bank_transfer'] as const).map((m) => (
                <label key={m} className={sheetStyles.option}>
                  <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} />
                  {METHOD_LABEL[m]}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <label className={styles.field}>
          <span className={styles.label}>සටහන් (optional)</span>
          <textarea className={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        {failed && <p role="alert" className={styles.error}>සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.</p>}

        <button type="submit" className={styles.submit} disabled={saving}>Save</button>
      </form>
      {children}
    </Sheet>
  )
}
