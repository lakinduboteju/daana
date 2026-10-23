import { useNavigate, useParams } from 'react-router'
import { BackHeader } from '../../components/BackHeader'
import { useContributor, useUpdateContributor } from '../../data/contributors'
import { NotFoundScreen } from '../not-found/NotFoundScreen'
import { ContributorForm } from './ContributorForm'
import styles from './ContributorForm.module.css'

export function ContributorEditScreen() {
  const { contributorId = '' } = useParams()
  const navigate = useNavigate()
  const contributor = useContributor(contributorId)
  const update = useUpdateContributor(contributorId)

  if (contributor.data === null) return <NotFoundScreen />

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
          saving={update.isPending}
          error={update.isError ? 'සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.' : null}
          onSave={(input) => update.mutate(input, { onSuccess: () => navigate('/contributors') })}
        />
      )}
    </main>
  )
}
