import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import SectionCard from "../components/SectionCard";
import { downloadPdf } from "../services/api";

export default function ResultPage({ result, formInput }) {
  const navigate = useNavigate();

  if (!result) {
    navigate("/");
    return null;
  }

  const s = result.sections;

  const handleDownloadPdf = async () => {
    try {
      await downloadPdf(formInput);
    } catch {
      alert("PDF download failed. Is the backend running?");
    }
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(s.whatsapp_pitch);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proposal_${result.proposal_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <div>
          <span className="badge">Generated</span>
          <h1 style={styles.title}>
            Proposal for{" "}
            <span style={{ color: "var(--teal)" }}>{result.client}</span>
          </h1>
          <p style={styles.meta}>
            ID: {result.proposal_id} &middot; {result.generated_date} &middot;{" "}
            {result.industry}
          </p>
        </div>
        <div style={styles.btnGroup}>
          <button className="btn btn-primary" onClick={handleDownloadPdf}>
            Download PDF
          </button>
          <button className="btn btn-outline" onClick={handleDownloadJson}>
            Export JSON
          </button>
          <button className="btn btn-ghost" onClick={() => navigate("/")}>
            New Proposal
          </button>
        </div>
      </div>

      {/* Pricing summary strip */}
      <div style={styles.pricingStrip}>
        <PriceBox label="Setup Fee" value={`${s.pricing.currency} ${s.pricing.setup_fee.toLocaleString()}`} />
        <div style={styles.divider} />
        <PriceBox label="Monthly" value={`${s.pricing.currency} ${s.pricing.monthly_subscription.toLocaleString()}`} />
        <div style={styles.divider} />
        <PriceBox
          label="Usage-Based"
          value={s.pricing.usage_based_pricing || "N/A"}
        />
      </div>

      {/* Sections */}
      <div style={{ marginTop: 32 }}>
        <SectionCard number={1} title="Executive Summary">
          <p>{s.executive_summary}</p>
        </SectionCard>

        <SectionCard number={2} title="Problem Analysis">
          <div className="md-preview">
            <ReactMarkdown>{s.problem_analysis}</ReactMarkdown>
          </div>
        </SectionCard>

        <SectionCard number={3} title="Proposed AI Automation Solution">
          <div className="md-preview">
            <ReactMarkdown>{s.proposed_solution}</ReactMarkdown>
          </div>
        </SectionCard>

        <SectionCard number={4} title="Technical Architecture">
          <div className="md-preview">
            <ReactMarkdown>{s.technical_architecture}</ReactMarkdown>
          </div>
        </SectionCard>

        <SectionCard number={5} title="Return on Investment">
          <div className="md-preview">
            <ReactMarkdown>{s.roi_explanation}</ReactMarkdown>
          </div>
        </SectionCard>

        <SectionCard number={6} title="Implementation Timeline">
          <div className="md-preview">
            <ReactMarkdown>{s.implementation_timeline}</ReactMarkdown>
          </div>
        </SectionCard>

        <SectionCard number={7} title="WhatsApp Pitch">
          <div style={styles.whatsappBox}>
            <pre style={styles.whatsappText}>{s.whatsapp_pitch}</pre>
            <button
              className="btn btn-outline"
              style={{ marginTop: 12 }}
              onClick={handleCopyWhatsApp}
            >
              Copy to clipboard
            </button>
          </div>
        </SectionCard>
      </div>

      {/* Full markdown toggle */}
      <details style={styles.details}>
        <summary style={styles.summary}>View full Markdown source</summary>
        <div className="md-preview" style={{ padding: 24 }}>
          <ReactMarkdown>{result.markdown}</ReactMarkdown>
        </div>
      </details>
    </div>
  );
}

function PriceBox({ label, value }) {
  return (
    <div style={styles.priceBox}>
      <span style={styles.priceLabel}>{label}</span>
      <span style={styles.priceValue}>{value}</span>
    </div>
  );
}

const styles = {
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  title: { fontSize: "1.6rem", fontWeight: 800, margin: "8px 0 6px" },
  meta: { fontSize: "0.82rem", color: "var(--slate-dark)" },
  btnGroup: { display: "flex", gap: 10, flexWrap: "wrap" },
  pricingStrip: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    background: "var(--navy-light)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "20px 0",
  },
  priceBox: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  priceLabel: {
    fontSize: "0.72rem",
    fontWeight: 600,
    color: "var(--slate-dark)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceValue: { fontSize: "1.15rem", fontWeight: 700, color: "var(--teal)" },
  divider: {
    width: 1,
    alignSelf: "stretch",
    background: "var(--border)",
  },
  whatsappBox: {
    background: "var(--navy)",
    borderRadius: "var(--radius)",
    padding: 20,
  },
  whatsappText: {
    fontFamily: "var(--font)",
    fontSize: "0.92rem",
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
    color: "var(--off-white)",
    margin: 0,
  },
  details: {
    marginTop: 24,
    background: "var(--navy-light)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
  },
  summary: {
    padding: "16px 24px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
    color: "var(--slate)",
  },
};
