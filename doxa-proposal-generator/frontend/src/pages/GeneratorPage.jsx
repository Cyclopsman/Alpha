import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateProposal } from "../services/api";

const INDUSTRIES = [
  "Agriculture",
  "Education",
  "Finance",
  "Healthcare",
  "Hospitality",
  "Logistics",
  "Manufacturing",
  "Real Estate",
  "Retail",
  "Other",
];

const EMPTY_FORM = {
  company_name: "",
  industry: "",
  main_problem: "",
  current_process: "",
  desired_automation: "",
  estimated_monthly_customers: "",
};

export default function GeneratorPage({ onResult }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const canSubmit =
    form.company_name &&
    form.industry &&
    form.main_problem.length >= 10 &&
    form.current_process.length >= 10 &&
    form.desired_automation.length >= 10 &&
    Number(form.estimated_monthly_customers) > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await generateProposal({
        ...form,
        estimated_monthly_customers: Number(form.estimated_monthly_customers),
      });
      onResult(result, {
        ...form,
        estimated_monthly_customers: Number(form.estimated_monthly_customers),
      });
      navigate("/result");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    setForm({
      company_name: "Farmbora Ltd",
      industry: "Agriculture",
      main_problem:
        "Manual order processing takes 3 days and leads to frequent errors, causing customer complaints and revenue loss",
      current_process:
        "Orders come in via WhatsApp, staff manually enters them into Excel spreadsheets, then emails invoices one by one. Follow-ups are tracked on paper.",
      desired_automation:
        "Automated order intake from WhatsApp, auto-generated invoices, real-time inventory sync with their warehouse system, and automated payment reminders",
      estimated_monthly_customers: "500",
    });
  };

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 64 }}>
      {/* Hero */}
      <div style={styles.hero}>
        <span className="badge">Proposal Generator</span>
        <h1 style={styles.heroTitle}>
          Generate a Professional
          <br />
          <span style={{ color: "var(--teal)" }}>Automation Proposal</span>
        </h1>
        <p style={styles.heroSub}>
          Fill in the client details below. The system will produce an
          enterprise-ready proposal with pricing, ROI analysis, and a WhatsApp
          pitch — in seconds.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div className="card">
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Client Details</h2>
            <button type="button" className="btn btn-ghost" onClick={loadExample}>
              Load example
            </button>
          </div>

          <div style={styles.grid}>
            <div className="form-group">
              <label>Company Name</label>
              <input
                value={form.company_name}
                onChange={set("company_name")}
                placeholder="e.g. Farmbora Ltd"
              />
            </div>
            <div className="form-group">
              <label>Industry</label>
              <select value={form.industry} onChange={set("industry")}>
                <option value="">Select industry...</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Main Problem</label>
            <textarea
              value={form.main_problem}
              onChange={set("main_problem")}
              placeholder="Describe the core pain point this client faces..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Current Process</label>
            <textarea
              value={form.current_process}
              onChange={set("current_process")}
              placeholder="How does the client handle this process today?"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Desired Automation</label>
            <textarea
              value={form.desired_automation}
              onChange={set("desired_automation")}
              placeholder="What does the client want automated?"
              rows={3}
            />
          </div>

          <div style={{ maxWidth: 280 }}>
            <div className="form-group">
              <label>Est. Monthly Customers</label>
              <input
                type="number"
                min="1"
                value={form.estimated_monthly_customers}
                onChange={set("estimated_monthly_customers")}
                placeholder="e.g. 500"
              />
            </div>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.actions}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!canSubmit || loading}
            >
              {loading && <span className="spinner" />}
              {loading ? "Generating..." : "Generate Proposal"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const styles = {
  hero: { textAlign: "center", marginBottom: 40 },
  heroTitle: { fontSize: "2.2rem", fontWeight: 800, margin: "12px 0 16px", lineHeight: 1.2 },
  heroSub: { color: "var(--slate)", maxWidth: 560, margin: "0 auto", lineHeight: 1.6 },
  form: { maxWidth: 720, margin: "0 auto" },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  formTitle: { fontSize: "1.15rem", fontWeight: 700 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  error: { color: "var(--danger)", fontSize: "0.88rem", marginBottom: 12 },
  actions: { display: "flex", justifyContent: "flex-end", marginTop: 8 },
};
