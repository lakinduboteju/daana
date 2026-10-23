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

/** Adds a contributor to the organizer's household. */
export function useAddContributor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ContributorInput) => {
      const { data: household, error: householdError } = await supabase
        .from('household')
        .select('id')
        .limit(1)
        .single()
      if (householdError) throw householdError
      const { error } = await supabase
        .from('contributor')
        .insert({ ...input, household_id: household.id })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contributors'] }),
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

/** `%`, `_` and `\` match literally, so a search for "50%" isn't a wildcard. */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, '\\$&')
}
