import { useRef } from 'react'
import { useNavigate } from 'react-router'
import { BackHeader } from '../../components/BackHeader'
import { useToast } from '../../components/useToast'
import { useAddContributor } from '../../data/contributors'
import { ContributorForm } from './ContributorForm'
import styles from './ContributorForm.module.css'

export function ContributorNewScreen() {
  const navigate = useNavigate()
  const add = useAddContributor()
  const toast = useToast()
  const done = useRef(false)

  return (
    <main className={styles.screen}>
      <BackHeader title="නව දායකයා" backTo="/contributors" />
      <ContributorForm
        saving={add.isPending}
        done={done}
        error={add.isError ? 'සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.' : null}
        onSave={(input) =>
          add.mutate(input, {
            onSuccess: () => {
              done.current = true
              toast('සුරැකිණි')
              navigate('/contributors')
            },
          })
        }
      />
    </main>
  )
}
