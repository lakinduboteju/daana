import { useId, useState, type FormEvent } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { Sheet } from '../../components/Sheet'
import { useCloseSheet } from '../../components/sheetNavigation'
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
          onSubmit={(fields) => addItem.mutate(fields, { onSuccess: close })}
        />
      )}
    </Sheet>
  )
}

/** /events/:eventId/items/:itemId/edit: edit an item (or move it to another category), over the menu. */
export function EditItemSheet() {
  const { eventId = '', itemId = '' } = useParams()
  const menu = useMenu(eventId)
  const updateItem = useUpdateItem(eventId)
  const deleteItem = useDeleteItem(eventId)
  const [confirming, setConfirming] = useState(false)
  const confirmTitleId = useId()
  const close = useCloseSheet(`/events/${eventId}`)
  const item = menu.data ? findItem(menu.data, itemId) : null

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
            onSubmit={(fields) => updateItem.mutate({ itemId: item.id, fields }, { onSuccess: close })}
          />
          <button type="button" className={styles.danger} onClick={() => setConfirming(true)}>
            Item එක මකන්න
          </button>
          {confirming && (
            <dialog open aria-labelledby={confirmTitleId} className={styles.confirm}>
              <h3 id={confirmTitleId} className={styles.confirmTitle}>{item.name} මකන්නද?</h3>
              <p className={styles.confirmText}>
                එයට පැවරූ දායකයන්ද ඉවත් වේ. එයට අදාළ මුදල් වාර්තා හා ලේඛන දානයේ ඉතිරි වේ.
              </p>
              {deleteItem.isError && <p role="alert" className={styles.error}>මැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.</p>}
              <div className={styles.confirmActions}>
                <button type="button" className={styles.secondary} onClick={() => setConfirming(false)}>එපා</button>
                <button
                  type="button"
                  className={styles.dangerSolid}
                  disabled={deleteItem.isPending}
                  onClick={() => deleteItem.mutate(item.id, { onSuccess: close })}
                >
                  ඔව්, මකන්න
                </button>
              </div>
            </dialog>
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
  onSubmit: (fields: ItemFields) => void
}

function ItemForm({ categories, initial, saving, failed, onSubmit }: ItemFormProps) {
  const [categoryId, setCategoryId] = useState(initial.categoryId)
  const [name, setName] = useState(initial.name)
  const [quantity, setQuantity] = useState(initial.requiredQuantity?.toString() ?? '')
  const [unit, setUnit] = useState<Unit>(initial.unit)
  const [customUnit, setCustomUnit] = useState(initial.customUnit)
  const [notes, setNotes] = useState(initial.notes)

  function submit(e: FormEvent) {
    e.preventDefault()
    const requiredQuantity = quantity.trim() === '' ? null : Number(quantity)
    onSubmit({ categoryId, name, requiredQuantity, unit, customUnit, notes })
  }

  return (
    <form className={styles.form} onSubmit={submit}>
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
          <span className={styles.label}>අවශ්‍ය ප්‍රමාණය (අවශ්‍ය නම් පමණක්)</span>
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
        <span className={styles.label}>සටහන් (අවශ්‍ය නම් පමණක්)</span>
        <textarea className={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      {failed && <p role="alert" className={styles.error}>සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.</p>}

      <button type="submit" className={styles.submit} disabled={saving}>සුරකින්න</button>
    </form>
  )
}
