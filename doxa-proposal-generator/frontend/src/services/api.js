const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function generateProposal(input) {
  const res = await fetch(`${API_BASE}/api/v1/proposals/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to generate proposal");
  }
  return res.json();
}

export function getPdfUrl(input) {
  return `${API_BASE}/api/v1/proposals/generate/pdf`;
}

export async function downloadPdf(input) {
  const res = await fetch(`${API_BASE}/api/v1/proposals/generate/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("PDF download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "doxa-proposal.pdf";
  a.click();
  URL.revokeObjectURL(url);
}
