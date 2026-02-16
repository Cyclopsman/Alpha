export default function SectionCard({ number, title, children }) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.number}>{String(number).padStart(2, "0")}</span>
        <h3 style={styles.title}>{title}</h3>
      </div>
      <div style={styles.body}>{children}</div>
    </div>
  );
}

const styles = {
  card: {
    background: "var(--navy-light)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    marginBottom: 16,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 24px",
    borderBottom: "1px solid var(--border)",
  },
  number: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--teal)",
    background: "rgba(45,212,191,0.1)",
    padding: "4px 8px",
    borderRadius: 4,
    fontFamily: "monospace",
  },
  title: { fontSize: "1rem", fontWeight: 600 },
  body: { padding: "20px 24px", lineHeight: 1.7, color: "var(--slate)" },
};
