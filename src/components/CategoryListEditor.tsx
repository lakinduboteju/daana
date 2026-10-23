import { useState, type FormEvent, type ReactNode } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import styles from './CategoryListEditor.module.css'

type Named = { id: string; name: string }

type Mutation<Variables> = Pick<UseMutationResult<void, Error, Variables, unknown>, 'mutate' | 'isPending' | 'isError'>

type Props<T extends Named> = {
  categories: T[]
  add: Mutation<string>
  rename: Mutation<{ id: string; name: string }>
  /** Swaps two neighbouring categories. */
  swap: Mutation<[T, T]>
  remove: Mutation<string>
  /** What removing this category means, shown in the confirmation. */
  removeHint: (category: T) => ReactNode
}

/**
 * An ordered list of categories the organizer can add to, rename, move up and
 * down, and remove after confirming. Used for an event's categories and for
 * the household's category templates.
 */
export function CategoryListEditor<T extends Named>({ categories, add, rename, swap, remove, removeHint }: Props<T>) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [removing, setRemoving] = useState<T | null>(null)

  return (
    <>
      <ol aria-label="කාණ්ඩ" className={styles.list}>
        {categories.map((category, index, all) => (
          <li key={category.id} className={styles.row}>
            {editingId === category.id ? (
              <RenameForm category={category} rename={rename} onDone={() => setEditingId(null)} />
            ) : (
              <>
                <span className={styles.name}>{category.name}</span>
                <button
                  type="button"
                  aria-label={`${category.name} ඉහළට`}
                  className={styles.iconButton}
                  disabled={index === 0 || swap.isPending}
                  onClick={() => swap.mutate([category, all[index - 1]])}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 15 6-6 6 6" /></svg>
                </button>
                <button
                  type="button"
                  aria-label={`${category.name} පහළට`}
                  className={styles.iconButton}
                  disabled={index === all.length - 1 || swap.isPending}
                  onClick={() => swap.mutate([category, all[index + 1]])}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                <button
                  type="button"
                  aria-label={`${category.name} නම වෙනස් කරන්න`}
                  className={styles.iconButton}
                  onClick={() => setEditingId(category.id)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" /></svg>
                </button>
                <button
                  type="button"
                  aria-label={`${category.name} ඉවත් කරන්න`}
                  className={styles.iconButton}
                  onClick={() => setRemoving(category)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
                </button>
              </>
            )}
          </li>
        ))}
      </ol>
      <AddForm add={add} />
      {removing && (
        <dialog open aria-labelledby="remove-category-title" className={styles.confirm}>
          <h2 id="remove-category-title" className={styles.confirmTitle}>{removing.name} ඉවත් කරන්නද?</h2>
          <p className={styles.hint}>{removeHint(removing)}</p>
          {remove.isError && <p role="alert" className={styles.error}>ඉවත් කිරීමට නොහැකි විය</p>}
          <div className={styles.confirmButtons}>
            <button type="button" className={styles.secondary} onClick={() => setRemoving(null)}>එපා</button>
            <button
              type="button"
              className={styles.danger}
              disabled={remove.isPending}
              onClick={() => remove.mutate(removing.id, { onSuccess: () => setRemoving(null) })}
            >
              ඔව්, ඉවත් කරන්න
            </button>
          </div>
        </dialog>
      )}
    </>
  )
}

function AddForm({ add }: { add: Mutation<string> }) {
  const [name, setName] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    add.mutate(name, { onSuccess: () => setName('') })
  }

  return (
    <form className={styles.addForm} onSubmit={handleSubmit}>
      <label htmlFor="new-category" className={styles.label}>අළුත් කාණ්ඩයක්</label>
      <div className={styles.addRow}>
        <input
          id="new-category"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={styles.input}
        />
        <button type="submit" className={styles.primary} disabled={add.isPending || !name.trim()}>එක් කරන්න</button>
      </div>
      {add.isError && <p role="alert" className={styles.error}>එක් කිරීමට නොහැකි විය</p>}
    </form>
  )
}

function RenameForm({ category, rename, onDone }: { category: Named; rename: Mutation<{ id: string; name: string }>; onDone: () => void }) {
  const [name, setName] = useState(category.name)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    rename.mutate({ id: category.id, name }, { onSuccess: onDone })
  }

  return (
    <form className={styles.editForm} onSubmit={handleSubmit}>
      <label htmlFor={`category-${category.id}`} className={styles.visuallyHidden}>කාණ්ඩයේ නම</label>
      <input
        id={`category-${category.id}`}
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        autoFocus
        className={styles.input}
      />
      {rename.isError && <p role="alert" className={styles.error}>සුරැකීමට නොහැකි විය</p>}
      <div className={styles.editActions}>
        <button type="button" className={styles.secondary} onClick={onDone}>එපා</button>
        <button type="submit" className={styles.primary} disabled={rename.isPending || !name.trim()}>සුරකින්න</button>
      </div>
    </form>
  )
}
