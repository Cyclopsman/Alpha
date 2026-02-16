import { Link, useLocation } from "react-router-dom";
import logo from "../assets/doxa-logo.svg";

export default function Header() {
  const { pathname } = useLocation();

  return (
    <header style={styles.header}>
      <div className="container" style={styles.inner}>
        <Link to="/" style={styles.brand}>
          <img src={logo} alt="DOXA AI Automations" style={styles.logo} />
        </Link>

        <nav style={styles.nav}>
          <Link
            to="/"
            style={{
              ...styles.link,
              ...(pathname === "/" ? styles.active : {}),
            }}
          >
            Generator
          </Link>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            style={styles.link}
          >
            API Docs
          </a>
        </nav>
      </div>
    </header>
  );
}

const styles = {
  header: {
    background: "rgba(11,16,53,0.85)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid var(--border)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  inner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
  },
  brand: { display: "flex", alignItems: "center" },
  logo: { height: 36 },
  nav: { display: "flex", gap: 24 },
  link: {
    color: "var(--slate)",
    fontSize: "0.875rem",
    fontWeight: 500,
    textDecoration: "none",
    transition: "color 0.2s",
  },
  active: { color: "var(--teal)" },
};
