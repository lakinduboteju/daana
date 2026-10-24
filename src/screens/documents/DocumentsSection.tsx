import { useId, useState, type ChangeEvent, type FormEvent } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/useToast'
import {
  downloadUrl,
  useDeleteDocument,
  useEventDocuments,
  useRenameDocument,
  useUploadDocument,
  type EventDocument,
} from '../../data/documents'
import { KIND_LABEL } from '../../data/money'
import { colomboDateOf, formatDayMonth } from '../../lib/dates'
import { DOCUMENT_ACCEPT, documentKind, documentName, documentProblem, formatFileSize, isPdf } from '../../lib/documentFiles'
import { formatRupees } from '../../lib/money'
import styles from './DocumentsSection.module.css'

type Props = {
  eventId: string
  /** Show only this item's documents, and link new uploads to it. */
  itemId?: string
  /** Show only this transaction's documents, and link new uploads to it (and to `itemId`). */
  transactionId?: string
  /** A list on the money tab; a grid of thumbnails on item details. */
  layout?: 'list' | 'grid'
  className?: string
}

const UPLOAD_LABEL = 'ඡායාරූපයක් හෝ PDF එකක් උඩුගත කරන්න'

/**
 * "ලේඛන (N)": an event's receipts, bills and other files (or one item's or
 * transaction's), with an upload button. Each document opens a sheet to
 * preview, download, rename or delete it.
 */
export function DocumentsSection({ eventId, itemId, transactionId, layout = 'list', className }: Props) {
  const titleId = useId()
  const documents = useEventDocuments(eventId)
  const upload = useUploadDocument(eventId)
  const toast = useToast()
  const [refused, setRefused] = useState<string | null>(null)
  const [failed, setFailed] = useState<File | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const shown = (documents.data ?? []).filter((d) =>
    transactionId ? d.transaction?.id === transactionId : itemId ? d.item?.id === itemId : true,
  )
  const open = shown.find((d) => d.id === openId)

  function send(file: File) {
    setFailed(null)
    upload.mutate(
      { file, name: documentName(file.name), itemId: itemId ?? null, transactionId: transactionId ?? null },
      {
        onSuccess: () => toast('ලේඛනය උඩුගත කළා'),
        onError: () => setFailed(file),
      },
    )
  }

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Clear it so picking the same file again still triggers a change.
    e.target.value = ''
    if (!file) return
    const problem = documentProblem(file)
    setRefused(problem)
    if (!problem) send(file)
  }

  return (
    <section aria-labelledby={titleId} className={className}>
      <h2 id={titleId} className={styles.title}>ලේඛන ({shown.length})</h2>
      {documents.isError && <p role="alert" className={styles.empty}>ලේඛන පූරණය කිරීමට නොහැකි විය</p>}
      {documents.data && shown.length === 0 && <p className={styles.empty}>තවම ලේඛන නැත.</p>}
      {shown.length > 0 && (
        <ul aria-label="ලේඛන" className={layout === 'grid' ? styles.grid : styles.list}>
          {shown.map((doc) => (
            <li key={doc.id} className={layout === 'grid' ? styles.tile : styles.row}>
              <button
                type="button"
                aria-label={`${doc.name} — විකල්ප`}
                className={layout === 'grid' ? styles.tileButton : styles.rowButton}
                onClick={() => setOpenId(doc.id)}
              >
                {layout === 'grid' ? <Thumbnail doc={doc} /> : <ListRow doc={doc} />}
              </button>
            </li>
          ))}
        </ul>
      )}
      {refused && (
        <p role="alert" className={styles.alert}>
          <span className={styles.alertText}>{refused}</span>
        </p>
      )}
      {failed && (
        <div role="alert" className={styles.alert}>
          <span className={styles.alertText}>
            <b>{failed.name}</b> උඩුගත කිරීම අසාර්ථකයි. අන්තර්ජාලය පරීක්ෂා කරන්න.
          </span>
          <button type="button" className={styles.retry} onClick={() => send(failed)}>
            නැවත උත්සාහ කරන්න
          </button>
        </div>
      )}
      {upload.isPending && <p className={styles.uploading}>උඩුගත කරමින්…</p>}
      <label className={styles.upload}>
        <input
          type="file"
          accept={DOCUMENT_ACCEPT}
          aria-label={UPLOAD_LABEL}
          className={styles.fileInput}
          onChange={pick}
          disabled={upload.isPending}
        />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></svg>
        {layout === 'grid' ? 'උඩුගත කරන්න' : UPLOAD_LABEL}
      </label>
      {open && <DocumentSheet eventId={eventId} doc={open} onClose={() => setOpenId(null)} />}
    </section>
  )
}

function ListRow({ doc }: { doc: EventDocument }) {
  return (
    <>
      <span className={styles.kind} aria-hidden="true">{documentKind(doc.mimeType)}</span>
      <span className={styles.rowMain}>
        <span className={styles.name}>{doc.name}</span>
        <span className={styles.meta}>{meta(doc)}</span>
      </span>
    </>
  )
}

function Thumbnail({ doc }: { doc: EventDocument }) {
  if (!isPdf(doc.mimeType) && doc.url) {
    return (
      <>
        <img src={doc.url} alt="" className={styles.thumb} />
        <span className={styles.tileName}>{doc.name}</span>
      </>
    )
  }
  return (
    <>
      <span className={styles.tileKind}>{documentKind(doc.mimeType)}</span>
      <span className={styles.tileName}>{doc.name}</span>
    </>
  )
}

function meta(doc: EventDocument): string {
  const links = [
    doc.item?.name,
    doc.transaction ? `${KIND_LABEL[doc.transaction.kind]} ${formatRupees(doc.transaction.amount)}` : null,
  ].filter(Boolean)
  return [...(links.length ? links : ['සාමාන්‍ය']), formatDayMonth(colomboDateOf(doc.createdAt))].join(' · ')
}

/** Preview, download, rename and delete one document. */
function DocumentSheet({ eventId, doc, onClose }: { eventId: string; doc: EventDocument; onClose: () => void }) {
  const rename = useRenameDocument(eventId)
  const remove = useDeleteDocument(eventId)
  const toast = useToast()
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(doc.name)
  const [confirming, setConfirming] = useState(false)
  const download = downloadUrl(doc)

  function saveName(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    rename.mutate(
      { documentId: doc.id, name },
      {
        onSuccess: () => {
          setRenaming(false)
          toast('සුරැකිණි')
        },
      },
    )
  }

  return (
    <Sheet title={doc.name} onClose={onClose}>
      <div className={styles.preview}>
        {!doc.url ? (
          <p className={styles.empty}>පෙරදසුන ලබා ගත නොහැක.</p>
        ) : isPdf(doc.mimeType) ? (
          <iframe src={doc.url} title={`${doc.name} — පෙරදසුන`} className={styles.pdf} />
        ) : (
          <img src={doc.url} alt={doc.name} className={styles.image} />
        )}
      </div>
      <p className={styles.sheetMeta}>
        {documentKind(doc.mimeType)} · {formatFileSize(doc.size)} · {meta(doc)}
      </p>
      <div className={styles.actions}>
        {doc.url && (
          <a href={doc.url} target="_blank" rel="noreferrer" className={styles.action}>විවෘත කරන්න</a>
        )}
        {download && (
          <a href={download} download className={styles.action}>බාගන්න</a>
        )}
      </div>

      {renaming ? (
        <form className={styles.renameForm} onSubmit={saveName}>
          <label className={styles.field}>
            <span className={styles.label}>ලේඛනයේ නම</span>
            <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </label>
          {rename.isError && <p role="alert" className={styles.error}>සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.</p>}
          <div className={styles.actions}>
            <button type="button" className={styles.action} onClick={() => { setRenaming(false); setName(doc.name) }}>එපා</button>
            <button type="submit" className={styles.primary} disabled={rename.isPending}>සුරකින්න</button>
          </div>
        </form>
      ) : (
        <div className={styles.actions}>
          <button type="button" className={styles.action} onClick={() => setRenaming(true)}>නම වෙනස් කරන්න</button>
          <button type="button" className={styles.danger} onClick={() => setConfirming(true)}>මකන්න</button>
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title={`${doc.name} මකන්නද?`}
          confirmLabel="ඔව්, මකන්න"
          destructive
          busy={remove.isPending}
          onCancel={() => setConfirming(false)}
          onConfirm={() =>
            // mutateAsync: the sheet unmounts once the refetched list no longer has the document.
            void remove.mutateAsync(doc).then(
              () => {
                toast('ලේඛනය මකා දැමුවා')
                onClose()
              },
              () => {},
            )
          }
        >
          <p>ගොනුව සම්පූර්ණයෙන්ම මැකී යයි.</p>
          {remove.isError && <p role="alert">මැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.</p>}
        </ConfirmDialog>
      )}
    </Sheet>
  )
}
