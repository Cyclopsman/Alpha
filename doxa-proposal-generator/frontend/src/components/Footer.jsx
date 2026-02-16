export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div className="container" style={styles.inner}>
        <span style={styles.text}>
          &copy; {new Date().getFullYear()} DOXA AI Automations
        </span>
        <span style={styles.text}>Proposal Generator v1.0</span>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    marginTop: "auto",
    borderTop: "1px solid var(--border)",
    padding: "16px 0",
  },
  inner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  text: { fontSize: "0.78rem", color: "var(--slate-dark)" },
};
