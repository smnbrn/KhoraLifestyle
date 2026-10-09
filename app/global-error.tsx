"use client";

// Rete di sicurezza per errori nel layout radice stesso (rarissimo: qui non
// sono disponibili né Tailwind né i componenti UI, per questo è HTML puro).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="it">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Qualcosa è andato storto</h1>
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>Riprova a ricaricare la pagina.</p>
        <button
          onClick={reset}
          style={{ padding: "0.5rem 1rem", borderRadius: "6px", border: "1px solid #ccc", cursor: "pointer" }}
        >
          Riprova
        </button>
      </body>
    </html>
  );
}
