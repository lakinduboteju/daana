/** Statuses and how they read (docs/design.md, "Assignment status"). */

export type AssignmentStatus = 'pending' | 'confirmed' | 'received'

/** Worked out by the database's item_status view, never set by hand. */
export type ItemStatus = 'unassigned' | AssignmentStatus | 'partial'

export const STATUS_LABEL: Record<ItemStatus, string> = {
  unassigned: 'පවරා නැත',
  pending: 'තහවුරු කර නැත',
  partial: 'අර්ධ වශයෙන් තහවුරුයි',
  confirmed: 'තහවුරුයි',
  received: 'ලැබී ඇත',
}

export const STATUS_SYMBOL: Record<ItemStatus, string> = {
  unassigned: '○',
  pending: '◔',
  partial: '◑',
  confirmed: '✓',
  received: '✓✓',
}

/** An assignment moves from pending to confirmed to received. */
export const ASSIGNMENT_STATUSES: AssignmentStatus[] = ['pending', 'confirmed', 'received']
