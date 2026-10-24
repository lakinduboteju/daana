import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type TransactionKind = 'given' | 'expense'
export type PaymentMethod = 'cash' | 'bank_transfer'

export const KIND_LABEL: Record<TransactionKind, string> = {
  given: 'ලබා දුන්',
  expense: 'වියදම',
}

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'මුදල්',
  bank_transfer: 'බැංකු මාරුව',
}

export type Transaction = {
  id: string
  kind: TransactionKind
  /** Whole rupees. */
  amount: number
  date: string
  method: PaymentMethod | null
  notes: string | null
  item: { id: string; name: string } | null
  contributor: { id: string; name: string } | null
}

export type Reimbursement = {
  contributor: { id: string; name: string }
  /** Whole rupees the organizer still owes them. */
  amount: number
}

export type EventMoney = {
  totalGiven: number
  totalExpense: number
  /** Newest first. */
  transactions: Transaction[]
  reimbursements: Reimbursement[]
}

const TRANSACTION_COLUMNS = 'id, kind, amount, date, method, notes, item(id, name), contributor(id, name)'

export function moneyKey(eventId: string) {
  return ['events', eventId, 'money']
}

/** The event's totals (from the event_money view), transactions and reimbursements owed. */
export function useEventMoney(eventId: string) {
  return useQuery({
    queryKey: moneyKey(eventId),
    queryFn: async (): Promise<EventMoney> => {
      const [totals, transactions, reimbursements] = await Promise.all([
        supabase.from('event_money').select('total_given, total_expense').eq('event_id', eventId).maybeSingle(),
        supabase
          .from('transaction')
          .select(TRANSACTION_COLUMNS)
          .eq('event_id', eventId)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('reimbursement').select('amount, contributor(id, name)').eq('event_id', eventId),
      ])
      if (totals.error) throw totals.error
      if (transactions.error) throw transactions.error
      if (reimbursements.error) throw reimbursements.error
      return {
        totalGiven: totals.data?.total_given ?? 0,
        totalExpense: totals.data?.total_expense ?? 0,
        transactions: transactions.data as unknown as Transaction[],
        reimbursements: (reimbursements.data as unknown as Reimbursement[]).sort((a, b) =>
          a.contributor.name.localeCompare(b.contributor.name),
        ),
      }
    },
  })
}

export type TransactionFields = {
  kind: TransactionKind
  amount: number
  date: string
  method: PaymentMethod | null
  notes: string
  itemId: string | null
  contributorId: string | null
}

function toRow(fields: TransactionFields) {
  return {
    kind: fields.kind,
    amount: fields.amount,
    date: fields.date,
    method: fields.method,
    notes: fields.notes.trim() || null,
    item_id: fields.itemId,
    contributor_id: fields.contributorId,
  }
}

function useInvalidateEvent(eventId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['events', eventId] })
}

export function useAddTransaction(eventId: string) {
  const invalidate = useInvalidateEvent(eventId)
  return useMutation({
    mutationFn: async (fields: TransactionFields) => {
      const { error } = await supabase.from('transaction').insert({ ...toRow(fields), event_id: eventId })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useUpdateTransaction(eventId: string) {
  const invalidate = useInvalidateEvent(eventId)
  return useMutation({
    mutationFn: async ({ transactionId, fields }: { transactionId: string; fields: TransactionFields }) => {
      const { error } = await supabase.from('transaction').update(toRow(fields)).eq('id', transactionId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useDeleteTransaction(eventId: string) {
  const invalidate = useInvalidateEvent(eventId)
  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase.from('transaction').delete().eq('id', transactionId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}
