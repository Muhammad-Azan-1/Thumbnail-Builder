import styles from "./loader.module.css";

export default function AuthLinkLoader() {
  return (
    <div className={styles.overlay} role="status" aria-label="Verifying your email">
      <div className={styles.spinner} aria-hidden="true">
        <div className={styles.spinnerInner} />
      </div>
      <span className={styles.label}>Verifying your email...</span>
    </div>
  );
}
