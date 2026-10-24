import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { extension, shrinkPhoto } from '../lib/documentFiles'
import { supabase } from '../lib/supabase'
import type { TransactionKind } from './money'

/** The private Storage bucket; objects live at `<household_id>/<event_id>/<file>`. */
const BUCKET = 'documents'

/** Signed links stay valid for an hour. */
const LINK_SECONDS = 60 * 60

export type EventDocument = {
  id: string
  name: string
  mimeType: string
  /** Bytes. */
  size: number
  createdAt: string
  storagePath: string
  /** A signed link to view the file. */
  url: string | null
  item: { id: string; name: string } | null
  transaction: { id: string; kind: TransactionKind; amount: number } | null
}

type Row = {
  id: string
  name: string
  mime_type: string
  size: number
  created_at: string
  storage_path: string
  item: { id: string; name: string } | null
  transaction: { id: string; kind: TransactionKind; amount: number } | null
}

export function documentsKey(eventId: string) {
  return ['events', eventId, 'documents']
}

/** The event's documents, newest first, each with a signed link to view it. */
export function useEventDocuments(eventId: string) {
  return useQuery({
    queryKey: documentsKey(eventId),
    queryFn: async (): Promise<EventDocument[]> => {
      const { data, error } = await supabase
        .from('document')
        .select('id, name, mime_type, size, created_at, storage_path, item(id, name), transaction(id, kind, amount)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
      if (error) throw error
      const rows = data as unknown as Row[]
      const urls = new Map<string, string>()
      if (rows.length > 0) {
        const signed = await supabase.storage.from(BUCKET).createSignedUrls(rows.map((r) => r.storage_path), LINK_SECONDS)
        if (signed.error) throw signed.error
        for (const s of signed.data) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl)
      }
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        mimeType: r.mime_type,
        size: r.size,
        createdAt: r.created_at,
        storagePath: r.storage_path,
        url: urls.get(r.storage_path) ?? null,
        item: r.item,
        transaction: r.transaction,
      }))
    },
  })
}

/** A link that downloads the document under its own name. */
export function downloadUrl(doc: EventDocument): string | null {
  if (!doc.url) return null
  return `${doc.url}&download=${encodeURIComponent(`${doc.name}.${extension(doc.mimeType)}`)}`
}

/** Storage paths of the event's documents. */
export async function eventDocumentPaths(eventId: string): Promise<string[]> {
  const { data, error } = await supabase.from('document').select('storage_path').eq('event_id', eventId)
  if (error) throw error
  return data.map((d) => d.storage_path as string)
}

/**
 * Removes stored files whose records are already gone (e.g. after deleting
 * their event). Best effort: a leftover file is private and harmless.
 */
export async function removeDocumentFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  await supabase.storage.from(BUCKET).remove(paths)
}

export type NewDocument = {
  file: File
  name: string
  itemId?: string | null
  transactionId?: string | null
}

function useInvalidateEvent(eventId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['events', eventId] })
}

/**
 * Shrinks a photo, stores the file under the event's household/event folder
 * and records it. The file is removed again if it can't be recorded.
 */
export function useUploadDocument(eventId: string) {
  const invalidate = useInvalidateEvent(eventId)
  return useMutation({
    mutationFn: async ({ file, name, itemId = null, transactionId = null }: NewDocument) => {
      const event = await supabase.from('event').select('household_id').eq('id', eventId).single()
      if (event.error) throw event.error
      const body = await shrinkPhoto(file)
      const mimeType = body.type || file.type
      const path = `${event.data.household_id}/${eventId}/${crypto.randomUUID()}.${extension(mimeType)}`
      // An ArrayBuffer rather than the Blob: supabase-js would wrap a Blob in
      // FormData, which not every fetch implementation sends as-is.
      const upload = await supabase.storage
        .from(BUCKET)
        .upload(path, await body.arrayBuffer(), { contentType: mimeType, upsert: false })
      if (upload.error) throw upload.error
      const { error } = await supabase.from('document').insert({
        event_id: eventId,
        item_id: itemId,
        transaction_id: transactionId,
        name,
        storage_path: path,
        mime_type: mimeType,
        size: body.size,
      })
      if (error) {
        await supabase.storage.from(BUCKET).remove([path])
        throw error
      }
    },
    onSuccess: invalidate,
  })
}

export function useRenameDocument(eventId: string) {
  const invalidate = useInvalidateEvent(eventId)
  return useMutation({
    mutationFn: async ({ documentId, name }: { documentId: string; name: string }) => {
      const { error } = await supabase.from('document').update({ name: name.trim() }).eq('id', documentId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

/** Deletes the record, then the file. */
export function useDeleteDocument(eventId: string) {
  const invalidate = useInvalidateEvent(eventId)
  return useMutation({
    mutationFn: async (doc: EventDocument) => {
      const { error } = await supabase.from('document').delete().eq('id', doc.id)
      if (error) throw error
      await supabase.storage.from(BUCKET).remove([doc.storagePath])
    },
    onSuccess: invalidate,
  })
}
