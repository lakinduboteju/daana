import { useRef, useState, type FormEvent, type RefObject } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Sheet } from '../../components/Sheet'
import { useCloseSheet } from '../../components/sheetNavigation'
import { UnsavedChangesGuard } from '../../components/UnsavedChangesGuard'
import { useToast } from '../../components/useToast'
import { findItem, useAddItem, useDeleteItem, useMenu, useUpdateItem, type Category, type ItemFields, type Unit } from '../../data/menu'
import { UNIT_OPTIONS } from '../../data/units'
import styles from './ItemSheets.module.css'

/** /events/:eventId/items/new?category=<id>: add an item, over the menu. */
export function AddItemSheet() {
  const { eventId = '' } = useParams()
  const [params] = useSearchParams()
  const menu = useMenu(eventId)
  const addItem = useAddItem(eventId)
  const close = useCloseSheet(`/events/${eventId}`)
  const toast = useToast()
  const done = useRef(false)

  return (
    <Sheet title="අළුත් Item" onClose={close}>
      {menu.data && (
        <ItemForm
          categories={menu.data}
          initial={{
            categoryId: params.get('category') ?? menu.data[0]?.id ?? '',
            name: '',
            requiredQuantity: null,
            unit: 'pieces',
            customUnit: '',
            notes: '',
          }}
          saving={addItem.isPending}
          failed={addItem.isError}
          done={done}
          onSubmit={(fields) =>
            addItem.mutate(fields, {
              onSuccess: () => {
                done.current = true
                toast('සුරැකිණි')
                close()
              },
            })
          }
        />
      )}
    </Sheet>
  )
}

/** /events/:eventId/items/:itemId/edit: edit an item (or move it to another category), over its details. */
export function EditItemSheet() {
  const { eventId = '', itemId = '' } = useParams()
  const menu = useMenu(eventId)
  const updateItem = useUpdateItem(eventId)
  const deleteItem = useDeleteItem(eventId)
  const [confirming, setConfirming] = useState(false)
  const close = useCloseSheet(`/events/${eventId}/items/${itemId}`)
  const navigate = useNavigate()
  const toast = useToast()
  const done = useRef(false)
  // A deleted item has no details to go back to, so it's back to the menu.
  // mutateAsync, because the sheet unmounts once the menu no longer has the item.
  const item = menu.data ? findItem(menu.data, itemId) : null
  const remove = (name: string) =>
    deleteItem.mutateAsync(itemId).then(
      () => {
        done.current = true
        toast(`${name} මකා දැමුවා`)
        navigate(`/events/${eventId}`, { replace: true })
      },
      () => {},
    )

  return (
    <Sheet title="Item සංස්කරණය" onClose={close}>
      {menu.data && !item && !deleteItem.isSuccess && <p className={styles.missing}>මෙම Item එක හමු නොවීය.</p>}
      {menu.data && item && (
        <>
          <ItemForm
            key={item.id}
            categories={menu.data}
            initial={{
              categoryId: item.category_id,
              name: item.name,
              requiredQuantity: item.required_quantity,
              unit: item.unit,
              customUnit: item.custom_unit ?? '',
              notes: item.notes ?? '',
            }}
            saving={updateItem.isPending}
            failed={updateItem.isError}
            done={done}
            onSubmit={(fields) =>
              updateItem.mutate(
                { itemId: item.id, fields },
                {
                  onSuccess: () => {
                    done.current = true
                    toast('සුරැකිණි')
                    close()
                  },
                },
              )
            }
          />
          <button type="button" className={styles.danger} onClick={() => setConfirming(true)}>
            Item එක මකන්න
          </button>
          {confirming && (
            <ConfirmDialog
              title={`${item.name} මකන්නද?`}
              confirmLabel="ඔව්, මකන්න"
              destructive
              busy={deleteItem.isPending}
              onCancel={() => setConfirming(false)}
              onConfirm={() => void remove(item.name)}
            >
              <p>එයට පැවරූ දායකයන්ද ඉවත් වේ. එයට අදාළ මුදල් වාර්තා හා ලේඛන දානයේ ඉතිරි වේ.</p>
              {deleteItem.isError && <p role="alert">මැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.</p>}
            </ConfirmDialog>
          )}
        </>
      )}
    </Sheet>
  )
}

type ItemFormProps = {
  categories: Category[]
  initial: ItemFields
  saving: boolean
  failed: boolean
  /** Set once the sheet saved or deleted the item, so leaving doesn't ask about unsaved changes. */
  done: RefObject<boolean>
  onSubmit: (fields: ItemFields) => void
}

function ItemForm({ categories, initial, saving, failed, done, onSubmit }: ItemFormProps) {
  const [categoryId, setCategoryId] = useState(initial.categoryId)
  const [name, setName] = useState(initial.name)
  const [quantity, setQuantity] = useState(initial.requiredQuantity?.toString() ?? '')
  const [unit, setUnit] = useState<Unit>(initial.unit)
  const [customUnit, setCustomUnit] = useState(initial.customUnit)
  const [notes, setNotes] = useState(initial.notes)

  const isDirty = () =>
    !done.current &&
    (categoryId !== initial.categoryId ||
      name !== initial.name ||
      quantity !== (initial.requiredQuantity?.toString() ?? '') ||
      unit !== initial.unit ||
      customUnit !== initial.customUnit ||
      notes !== initial.notes)

  function submit(e: FormEvent) {
    e.preventDefault()
    const requiredQuantity = quantity.trim() === '' ? null : Number(quantity)
    onSubmit({ categoryId, name, requiredQuantity, unit, customUnit, notes })
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <UnsavedChangesGuard isDirty={isDirty} />
      <label className={styles.field}>
        <span className={styles.label}>නම <span className={styles.required}>*</span></span>
        <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>කාණ්ඩය <span className={styles.required}>*</span></span>
        <select className={styles.input} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>අවශ්‍ය ප්‍රමාණය (optional)</span>
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
        <label className={styles.field}>
          <span className={styles.label}>ඒකකය</span>
          <select className={styles.input} value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
            {UNIT_OPTIONS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </label>
      </div>

      {unit === 'other' && (
        <label className={styles.field}>
          <span className={styles.label}>ඒකකයේ නම</span>
          <input className={styles.input} value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} required />
        </label>
      )}

      <label className={styles.field}>
        <span className={styles.label}>සටහන් (optional)</span>
        <textarea className={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      {failed && <p role="alert" className={styles.error}>සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.</p>}

      <button type="submit" className={styles.submit} disabled={saving}>Save</button>
    </form>
  )
}
