import { createClient } from '@supabase/supabase-js'
import { usernameToEmail } from '../auth/username'

// Service-role client for seeding test data. Bypasses row-level security,
// so it is only ever used to set up data, never to check what the app shows.
export const admin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

export type Organizer = {
  username: string
  password: string
  userId: string
}

export type SeededHousehold = {
  householdId: string
  organizer: Organizer
}

/**
 * Creates a fresh organizer and their household, the same way the household
 * setup script does in production. Every test seeds its own household, so
 * tests never see each other's data.
 */
export async function seedHousehold(name = 'බොතේජු පවුල'): Promise<SeededHousehold> {
  const username = `organizer-${crypto.randomUUID().slice(0, 8)}`
  const password = 'password123'

  const { data, error } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
  })
  if (error) throw error

  const { data: householdId, error: setupError } = await admin.rpc('setup_household', {
    p_name: name,
    p_username: username,
  })
  if (setupError) throw setupError

  return {
    householdId: householdId as string,
    organizer: { username, password, userId: data.user.id },
  }
}

type SeedEventOptions = {
  /** 'YYYY-MM-DD'. Use `colomboDate(offset)` for dates relative to today in Sri Lanka. */
  date: string
  meal?: 'breakfast' | 'lunch'
  host?: string | null
  monastery?: string
  monkCount?: number
  laypersonCount?: number
  /** The event's categories, in order. None by default. */
  categories?: string[]
}

/** Adds an event (and a new monastery for it) to a household. Returns the event's id. */
export async function seedEvent(householdId: string, options: SeedEventOptions): Promise<string> {
  const { data: monastery, error: monasteryError } = await admin
    .from('monastery')
    .insert({ household_id: householdId, name: options.monastery ?? 'මාලබේ අසපුව' })
    .select('id')
    .single()
  if (monasteryError) throw monasteryError

  const { data: event, error } = await admin
    .from('event')
    .insert({
      household_id: householdId,
      monastery_id: monastery.id,
      date: options.date,
      meal: options.meal ?? 'lunch',
      host: options.host ?? null,
      monk_count: options.monkCount ?? 10,
      layperson_count: options.laypersonCount ?? 5,
    })
    .select('id')
    .single()
  if (error) throw error

  if (options.categories?.length) {
    const { error: categoryError } = await admin
      .from('category')
      .insert(options.categories.map((name, i) => ({ event_id: event.id, name, position: i + 1 })))
    if (categoryError) throw categoryError
  }
  return event.id
}

/** Today's date in Sri Lanka plus `offsetDays`, as 'YYYY-MM-DD'. */
export function colomboDate(offsetDays = 0): string {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(new Date())
  const [year, month, day] = today.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + offsetDays)).toISOString().slice(0, 10)
}

type SeedItemOptions = {
  name: string
  requiredQuantity?: number | null
  unit?: 'kg' | 'l' | 'pieces' | 'other'
  customUnit?: string | null
  notes?: string | null
}

/** Adds an item to the event's category with this name. Returns the item's id. */
export async function seedItem(eventId: string, categoryName: string, options: SeedItemOptions): Promise<string> {
  const { data: category, error: categoryError } = await admin
    .from('category')
    .select('id')
    .eq('event_id', eventId)
    .eq('name', categoryName)
    .single()
  if (categoryError) throw categoryError

  const { data: item, error } = await admin
    .from('item')
    .insert({
      event_id: eventId,
      category_id: category.id,
      name: options.name,
      required_quantity: options.requiredQuantity ?? null,
      unit: options.unit ?? 'pieces',
      custom_unit: options.customUnit ?? null,
      notes: options.notes ?? null,
    })
    .select('id')
    .single()
  if (error) throw error
  return item.id
}

type SeedContributorOptions = {
  phone?: string | null
  whatsapp?: string | null
  archived?: boolean
}

/** Adds a contributor to a household. Returns the contributor's id. */
export async function seedContributor(
  householdId: string,
  name: string,
  options: SeedContributorOptions = {},
): Promise<string> {
  const { data, error } = await admin
    .from('contributor')
    .insert({
      household_id: householdId,
      name,
      phone: options.phone ?? null,
      whatsapp: options.whatsapp ?? null,
      archived_at: options.archived ? new Date().toISOString() : null,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

type SeedAssignmentOptions = {
  quantity?: number | null
  status?: 'pending' | 'confirmed' | 'received'
}

/** Assigns a contributor to an item. Returns the assignment's id. */
export async function seedAssignment(
  itemId: string,
  contributorId: string,
  options: SeedAssignmentOptions = {},
): Promise<string> {
  const { data: item, error: itemError } = await admin.from('item').select('event_id').eq('id', itemId).single()
  if (itemError) throw itemError
  const { data, error } = await admin
    .from('assignment')
    .insert({
      event_id: item.event_id,
      item_id: itemId,
      contributor_id: contributorId,
      quantity: options.quantity ?? null,
      status: options.status ?? 'pending',
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

type SeedTransactionOptions = {
  kind: 'given' | 'expense'
  /** Whole rupees. */
  amount: number
  contributorId?: string | null
  itemId?: string | null
  /** 'YYYY-MM-DD'. Today in Sri Lanka by default. */
  date?: string
  method?: 'cash' | 'bank_transfer' | null
  notes?: string | null
}

type SeedDocumentOptions = {
  name: string
  /** The file's content. */
  content?: string
  mimeType?: 'application/pdf' | 'image/jpeg'
  itemId?: string | null
  transactionId?: string | null
}

/**
 * Stores a file in the documents bucket under the event's household/event
 * folder and records it. Returns the document's id and storage path.
 */
export async function seedDocument(
  eventId: string,
  options: SeedDocumentOptions,
): Promise<{ documentId: string; storagePath: string }> {
  const { data: event, error: eventError } = await admin.from('event').select('household_id').eq('id', eventId).single()
  if (eventError) throw eventError
  const mimeType = options.mimeType ?? 'application/pdf'
  const content = new TextEncoder().encode(options.content ?? '%PDF-1.4 test')
  const storagePath = `${event.household_id}/${eventId}/${crypto.randomUUID()}.${mimeType === 'application/pdf' ? 'pdf' : 'jpg'}`
  const { error: uploadError } = await admin.storage.from('documents').upload(storagePath, content, { contentType: mimeType })
  if (uploadError) throw uploadError
  const { data, error } = await admin
    .from('document')
    .insert({
      event_id: eventId,
      item_id: options.itemId ?? null,
      transaction_id: options.transactionId ?? null,
      name: options.name,
      storage_path: storagePath,
      mime_type: mimeType,
      size: content.byteLength,
    })
    .select('id')
    .single()
  if (error) throw error
  return { documentId: data.id, storagePath }
}

/** Records a given or an expense on an event. Returns the transaction's id. */
export async function seedTransaction(eventId: string, options: SeedTransactionOptions): Promise<string> {
  const { data, error } = await admin
    .from('transaction')
    .insert({
      event_id: eventId,
      kind: options.kind,
      amount: options.amount,
      contributor_id: options.contributorId ?? null,
      item_id: options.itemId ?? null,
      date: options.date ?? colomboDate(),
      method: options.method ?? null,
      notes: options.notes ?? null,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}
