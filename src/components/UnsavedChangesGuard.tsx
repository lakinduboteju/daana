import { useBeforeUnload, useBlocker } from 'react-router'
import { ConfirmDialog } from './ConfirmDialog'

/**
 * While `isDirty()` is true, leaving the screen asks "වෙනස්කම් ඉවත දමන්නද?" first.
 * `isDirty` is read at the moment of leaving, so a form can mark itself saved
 * and navigate away in the same tick.
 */
export function UnsavedChangesGuard({ isDirty }: { isDirty: () => boolean }) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => currentLocation.pathname !== nextLocation.pathname && isDirty(),
  )
  useBeforeUnload((e) => {
    if (isDirty()) e.preventDefault()
  })

  if (blocker.state !== 'blocked') return null
  return (
    <ConfirmDialog
      title="වෙනස්කම් ඉවත දමන්නද?"
      confirmLabel="ඉවත දමන්න"
      destructive
      onConfirm={() => blocker.proceed()}
      onCancel={() => blocker.reset()}
    >
      <p>ඔබ කළ වෙනස්කම් සුරැකී නැත.</p>
    </ConfirmDialog>
  )
}
