import styles from './LoginScreen.module.css'

export function LoginScreen() {
  return (
    <main className={styles.screen}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12h16a8 8 0 0 1-16 0z" />
            <path d="M9 8c0-2 1.5-3 3-4 1.5 1 3 2 3 4" />
            <path d="M8 21h8" />
          </svg>
        </div>
        <h1 className={styles.title}>දාන සංවිධායක</h1>
        <p className={styles.tagline}>දානයේ මෙනුව, දායකයන් සහ වියදම් එකම තැනක</p>
      </div>

      <form className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="username" className={styles.label}>නම</label>
          <input id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="username" required className={styles.input} />
        </div>
        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>මුරපදය</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className={styles.input} />
        </div>
        <button type="submit" className={styles.submit}>ඇතුළු වන්න</button>
      </form>

      <p className={styles.note}>දායකයන්ට ගිණුමක් අවශ්‍ය නැත. සංවිධායක පමණක් ඇතුළු වේ.</p>
    </main>
  )
}
