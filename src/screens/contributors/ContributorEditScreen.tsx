import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { BackHeader } from '../../components/BackHeader'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/useToast'
import {
  useArchiveContributor,
  useContributor,
  useRemoveContributor,
  useUpdateContributor,
} from '../../data/contributors'
import { NotFoundScreen } from '../not-found/NotFoundScreen'
import { ContributorForm } from './ContributorForm'
import styles from './ContributorForm.module.css'

export function ContributorEditScreen() {
  const { contributorId = '' } = useParams()
  const navigate = useNavigate()
  const contributor = useContributor(contributorId)
  const update = useUpdateContributor(contributorId)
  const archive = useArchiveContributor(contributorId)
  const remove = useRemoveContributor(contributorId)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const toast = useToast()

  if (contributor.data === null) return <NotFoundScreen />

  const name = contributor.data?.name ?? ''
  const toList = (message: string) => {
    toast(message)
    navigate('/contributors')
  }
  const failed = update.isError || archive.isError || remove.isError
  const busy = update.isPending || archive.isPending || remove.isPending

  return (
    <main className={styles.screen}>
      <BackHeader title="දායකයා සංස්කරණය" backTo="/contributors" />
      {contributor.isPending && <p className={styles.message}>පූරණය වෙමින්…</p>}
      {contributor.isError && (
        <p role="alert" className={styles.message}>දායකයා පූරණය කිරීමට නොහැකි විය.</p>
      )}
      {contributor.data && (
        <ContributorForm
          initial={contributor.data}
          saving={busy}
          error={failed ? 'සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.' : null}
          onSave={(input) => update.mutate(input, { onSuccess: () => toList('සුරැකිණි') })}
        >
          <div className={styles.actions}>
            <p className={styles.hint}>
              Archive කළ දායකයන් ලැයිස්තුවෙන් සහ පවරන ලැයිස්තුවෙන් සැඟවේ. පෙර දානවල විස්තර එලෙසම පවතී.
            </p>
            <button type="button" className={styles.secondary} disabled={busy} onClick={() => archive.mutate(undefined, { onSuccess: () => toList(`${name} Archive කළා`) })}>
              Archive කරන්න
            </button>
            <button type="button" className={styles.danger} disabled={busy} onClick={() => setConfirmingDelete(true)}>
              මකන්න
            </button>
          </div>
          {confirmingDelete && (
            <ConfirmDialog
              title={`${contributor.data.name} මකන්නද?`}
              confirmLabel="ඔව්, මකන්න"
              destructive
              busy={busy}
              onCancel={() => setConfirmingDelete(false)}
              onConfirm={() =>
                remove.mutate(undefined, {
                  onSuccess: (result) => toList(result === 'archived' ? `${name} Archive කළා` : `${name} මකා දැමුවා`),
                })
              }
            >
              <p>කිසිදු දානයකට පවරා නැත්නම් සම්පූර්ණයෙන්ම මැකේ. පවරා ඇත්නම් Archive වේ.</p>
            </ConfirmDialog>
          )}
        </ContributorForm>
      )}
    </main>
  )
}
