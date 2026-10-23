import { useState, type FormEvent } from 'react'
import { BackHeader } from '../../components/BackHeader'
import {
  useAddCategoryTemplate,
  useCategoryTemplates,
  useRenameCategoryTemplate,
  type CategoryTemplate,
} from '../../data/categoryTemplates'
import styles from './CategoryTemplatesScreen.module.css'

/** /settings/categories: the default categories copied into new events. */
export function CategoryTemplatesScreen() {
  const templates = useCategoryTemplates()
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <main className={styles.screen}>
      <BackHeader title="Edit Categories" backTo="/settings" />
      <p className={styles.intro}>අළුත් දානවලට මෙම කාණ්ඩ එකතු වේ. දැනට ඇති දානවල කාණ්ඩ වෙනස් නොවේ.</p>
      {templates.isPending && <p className={styles.message}>…</p>}
      {templates.isError && <p role="alert" className={styles.message}>පූරණය කිරීමට නොහැකි විය</p>}
      {templates.data && (
        <ol aria-label="කාණ්ඩ" className={styles.list}>
          {templates.data.map((template) => (
            <li key={template.id} className={styles.row}>
              {editingId === template.id ? (
                <RenameForm template={template} onDone={() => setEditingId(null)} />
              ) : (
                <>
                  <span className={styles.name}>{template.name}</span>
                  <button
                    type="button"
                    aria-label={`${template.name} නම වෙනස් කරන්න`}
                    className={styles.iconButton}
                    onClick={() => setEditingId(template.id)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" /></svg>
                  </button>
                </>
              )}
            </li>
          ))}
        </ol>
      )}
      {templates.data && <AddForm />}
    </main>
  )
}

function AddForm() {
  const [name, setName] = useState('')
  const add = useAddCategoryTemplate()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    add.mutate(name, { onSuccess: () => setName('') })
  }

  return (
    <form className={styles.addForm} onSubmit={handleSubmit}>
      <label htmlFor="new-template" className={styles.label}>අළුත් කාණ්ඩයක්</label>
      <div className={styles.addRow}>
        <input
          id="new-template"
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

function RenameForm({ template, onDone }: { template: CategoryTemplate; onDone: () => void }) {
  const [name, setName] = useState(template.name)
  const rename = useRenameCategoryTemplate()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    rename.mutate({ id: template.id, name }, { onSuccess: onDone })
  }

  return (
    <form className={styles.editForm} onSubmit={handleSubmit}>
      <label htmlFor={`template-${template.id}`} className={styles.visuallyHidden}>කාණ්ඩයේ නම</label>
      <input
        id={`template-${template.id}`}
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
