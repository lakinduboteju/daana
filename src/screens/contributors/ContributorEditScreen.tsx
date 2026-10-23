import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { BackHeader } from '../../components/BackHeader'
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

  if (contributor.data === null) return <NotFoundScreen />

  const toList = { onSuccess: () => navigate('/contributors') }
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
          onSave={(input) => update.mutate(input, toList)}
        >
          <div className={styles.actions}>
            <p className={styles.hint}>
              Archive කළ දායකයන් ලැයිස්තුවෙන් සහ පවරන ලැයිස්තුවෙන් සැඟවේ. පෙර දානවල විස්තර එලෙසම පවතී.
            </p>
            <button type="button" className={styles.secondary} disabled={busy} onClick={() => archive.mutate(undefined, toList)}>
              Archive කරන්න
            </button>
            <button type="button" className={styles.danger} disabled={busy} onClick={() => setConfirmingDelete(true)}>
              මකන්න
            </button>
          </div>
          {confirmingDelete && (
            <dialog open aria-labelledby="delete-contributor-title" className={styles.confirm}>
              <h2 id="delete-contributor-title" className={styles.confirmTitle}>{contributor.data.name} මකන්නද?</h2>
              <p className={styles.hint}>
                කිසිදු දානයකට පවරා නැත්නම් සම්පූර්ණයෙන්ම මැකේ. පවරා ඇත්නම් Archive වේ.
              </p>
              <div className={styles.confirmButtons}>
                <button type="button" className={styles.secondary} onClick={() => setConfirmingDelete(false)}>එපා</button>
                <button type="button" className={styles.danger} disabled={busy} onClick={() => remove.mutate(undefined, toList)}>
                  ඔව්, මකන්න
                </button>
              </div>
            </dialog>
          )}
        </ContributorForm>
      )}
    </main>
  )
}
