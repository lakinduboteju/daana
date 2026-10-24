import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type Contributor = {
  id: string
  name: string
  phone: string | null
  whatsapp: string | null
  notes: string | null
}

export type ContributorInput = Omit<Contributor, 'id'>

const COLUMNS = 'id, name, phone, whatsapp, notes'

/**
 * The household's active (not archived) contributors, by name. `q` matches
 * the name or phone number, ignoring English capital letters.
 */
export function useContributors(q: string) {
  const term = q.trim()
  return useQuery({
    queryKey: ['contributors', 'list', term],
    queryFn: async (): Promise<Contributor[]> => {
      let query = supabase.from('contributor').select(COLUMNS).is('archived_at', null)
      if (term) {
        const pattern = `"%${escapeLike(term).replace(/["\\]/g, '\\$&')}%"`
        query = query.or(`name.ilike.${pattern},phone.ilike.${pattern}`)
      }
      const { data, error } = await query.order('name')
      if (error) throw error
      return data
    },
    placeholderData: (previous) => previous,
  })
}

export function useContributor(contributorId: string) {
  return useQuery({
    queryKey: ['contributors', 'one', contributorId],
    queryFn: async (): Promise<Contributor | null> => {
      const { data, error } = await supabase
        .from('contributor')
        .select(COLUMNS)
        .eq('id', contributorId)
        .maybeSingle()
      // A malformed id in the URL is a broken link, so it's not found too.
      if (error?.code === '22P02') return null
      if (error) throw error
      return data
    },
  })
}

/** Adds a contributor to the organizer's household. Resolves to the new contributor. */
export function useAddContributor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ContributorInput) => addContributor(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contributors'] }),
  })
}

export async function addContributor(input: ContributorInput): Promise<Contributor> {
  const { data: household, error: householdError } = await supabase
    .from('household')
    .select('id')
    .limit(1)
    .single()
  if (householdError) throw householdError
  const { data, error } = await supabase
    .from('contributor')
    .insert({ ...input, household_id: household.id })
    .select(COLUMNS)
    .single()
  if (error) throw error
  return data
}

/**
 * Active contributors most recently assigned to anything, newest first, with
 * what they were last assigned. For the assign sheet's "recent" list.
 */
export function useRecentContributors() {
  return useQuery({
    queryKey: ['contributors', 'recent'],
    queryFn: async (): Promise<(Contributor & { lastItem: string })[]> => {
      const { data, error } = await supabase
        .from('assignment')
        .select(`created_at, item(name), contributor!inner(${COLUMNS}, archived_at)`)
        .is('contributor.archived_at', null)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      const rows = data as unknown as { item: { name: string }; contributor: Contributor }[]
      const seen = new Map<string, Contributor & { lastItem: string }>()
      for (const row of rows) {
        if (seen.has(row.contributor.id)) continue
        const { id, name, phone, whatsapp, notes } = row.contributor
        seen.set(id, { id, name, phone, whatsapp, notes, lastItem: row.item.name })
      }
      return [...seen.values()].slice(0, 5)
    },
  })
}

export function useUpdateContributor(contributorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ContributorInput) => {
      const { error } = await supabase.from('contributor').update(input).eq('id', contributorId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contributors'] }),
  })
}

/** Hides the contributor from lists and pickers; their history stays. */
export function useArchiveContributor(contributorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('contributor')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', contributorId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contributors'] }),
  })
}

/**
 * Deletes a contributor who has never been assigned. One who has been is
 * archived instead (the database decides), so past events stay accurate.
 */
export function useRemoveContributor(contributorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<'deleted' | 'archived' | null> => {
      const { data, error } = await supabase.rpc('remove_contributor', {
        p_contributor_id: contributorId,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contributors'] }),
  })
}

/** `%`, `_` and `\` match literally, so a search for "50%" isn't a wildcard. */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, '\\$&')
}
