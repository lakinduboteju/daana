import { useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/useToast'
import { useDeleteEvent } from '../../data/events'
import { MEAL_LABEL, type Meal } from '../../data/meal'
import { formatDayMonth } from '../../lib/dates'

type Props = {
  event: { id: string; date: string; meal: Meal; host: string | null; monastery_name: string }
  onDeleted: () => void
  onCancel: () => void
}

/** "<monastery> · <host> · <date> <meal> මකන්නද?", naming everything that goes with it. */
export function DeleteEventDialog({ event, onDeleted, onCancel }: Props) {
  const deleteEvent = useDeleteEvent()
  const toast = useToast()
  const [failed, setFailed] = useState(false)
  const name = event.host ? `${event.monastery_name} · ${event.host}` : event.monastery_name

  async function onConfirm() {
    try {
      await deleteEvent.mutateAsync(event.id)
      toast('දානය මකා දැමුවා')
      onDeleted()
    } catch {
      setFailed(true)
    }
  }

  return (
    <ConfirmDialog
      title={`${name} · ${formatDayMonth(event.date)} ${MEAL_LABEL[event.meal]} මකන්නද?`}
      confirmLabel="ඔව්, මකන්න"
      destructive
      busy={deleteEvent.isPending}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p>
        මෙම දානයේ මෙනුව, දායකයන්ට කළ පැවරීම්, ගෙවීම් සහ ලේඛන සියල්ල ස්ථිරවම මැකී යයි. මෙය ආපසු
        හැරවිය නොහැක.
      </p>
      <p>ඉතිහාසය තබා ගැනීමට, මකනවා වෙනුවට දානය Cancel කරන්න.</p>
      {failed && <p role="alert">මැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.</p>}
    </ConfirmDialog>
  )
}
