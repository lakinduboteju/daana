import { BackHeader } from '../../components/BackHeader'
import { CategoryListEditor } from '../../components/CategoryListEditor'
import {
  useAddCategoryTemplate,
  useCategoryTemplates,
  useRemoveCategoryTemplate,
  useRenameCategoryTemplate,
  useSwapCategoryTemplates,
} from '../../data/categoryTemplates'
import styles from './CategoryTemplatesScreen.module.css'

/** /settings/categories: the default categories copied into new events. */
export function CategoryTemplatesScreen() {
  const templates = useCategoryTemplates()
  const add = useAddCategoryTemplate()
  const rename = useRenameCategoryTemplate()
  const swap = useSwapCategoryTemplates()
  const remove = useRemoveCategoryTemplate()

  return (
    <main className={styles.screen}>
      <BackHeader title="Edit Categories" backTo="/settings" />
      <p className={styles.intro}>අළුත් දානවලට මෙම කාණ්ඩ එකතු වේ. දැනට ඇති දානවල කාණ්ඩ වෙනස් නොවේ.</p>
      {templates.isPending && <p className={styles.message}>…</p>}
      {templates.isError && <p role="alert" className={styles.message}>පූරණය කිරීමට නොහැකි විය</p>}
      {templates.data && (
        <CategoryListEditor
          categories={templates.data}
          add={add}
          rename={rename}
          swap={swap}
          remove={remove}
          removeHint={() => 'අළුත් දානවලට මෙම කාණ්ඩය එකතු නොවේ. දැනට ඇති දානවල කාණ්ඩ වෙනස් නොවේ.'}
        />
      )}
    </main>
  )
}
