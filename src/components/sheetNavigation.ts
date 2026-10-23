import { useLocation, useNavigate } from 'react-router'

/** Link state for a sheet opened from its parent screen, so closing it goes back in history. */
export const OVER_PARENT = { overParent: true }

/**
 * Closes a sheet route. Opened from its parent (link state OVER_PARENT), it goes
 * back, so the back button and the close button do the same thing. Opened from a
 * direct link, it replaces itself with the parent.
 */
export function useCloseSheet(parentPath: string) {
  const navigate = useNavigate()
  const location = useLocation()
  const overParent = (location.state as typeof OVER_PARENT | null)?.overParent === true
  return () => {
    if (overParent) void navigate(-1)
    else void navigate(parentPath, { replace: true })
  }
}
