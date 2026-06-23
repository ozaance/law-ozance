"use client";

import { useActionState, useEffect, type CSSProperties } from "react";
import { submitLead } from "./actions";

const field: CSSProperties = {
  width: "100%",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
  color: "var(--text)",
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
};

const label: CSSProperties = {
  fontSize: 12.5,
  fontWeight: 500,
  color: "var(--text-2)",
  marginBottom: 6,
  display: "block",
};

export function ContactDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(submitLead, {});
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(0,0,0,.55)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 440,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 18,
          padding: 28,
          boxShadow: "0 30px 80px -20px rgba(0,0,0,.6)",
          fontFamily: "var(--ui)",
          color: "var(--text)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "1px solid var(--hairline)",
            background: "transparent",
            color: "var(--text-2)",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          ✕
        </button>

        {state.ok ? (
          <div style={{ textAlign: "center", padding: "16px 4px" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--accent-soft)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 22,
              }}
            >
              ✓
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 600, margin: "0 0 8px" }}>
              Demande envoyée
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-2)", margin: 0 }}>
              Merci, un conseiller Ozance vous recontacte très rapidement.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: 20,
                background: "var(--accent)",
                color: "var(--accent-ink)",
                border: "none",
                borderRadius: 10,
                padding: "11px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 19, fontWeight: 600, margin: "0 0 4px" }}>
              Parler à un conseiller
            </h2>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--text-2)",
                margin: "0 0 18px",
              }}
            >
              Laissez vos coordonnées : on vous rappelle pour une démo
              personnalisée.
            </p>

            <form
              action={action}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {/* Honeypot anti-bot (caché) */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
              />

              <div>
                <label style={label}>Nom *</label>
                <input name="nom" required style={field} />
              </div>
              <div>
                <label style={label}>Cabinet</label>
                <input name="cabinet" style={field} />
              </div>
              <div>
                <label style={label}>Email *</label>
                <input name="email" type="email" required style={field} />
              </div>
              <div>
                <label style={label}>Téléphone</label>
                <input name="telephone" type="tel" style={field} />
              </div>
              <div>
                <label style={label}>Message</label>
                <textarea name="message" rows={3} style={{ ...field, resize: "vertical" }} />
              </div>

              {state.error && (
                <p
                  style={{
                    fontSize: 13,
                    color: "#d4624f",
                    margin: 0,
                  }}
                >
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-ink)",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 20px",
                  fontSize: 14.5,
                  fontWeight: 600,
                  cursor: pending ? "default" : "pointer",
                  opacity: pending ? 0.6 : 1,
                }}
              >
                {pending ? "Envoi…" : "Être rappelé"}
              </button>
            </form>

            {bookingUrl && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    margin: "18px 0",
                    color: "var(--text-3)",
                    fontSize: 12,
                  }}
                >
                  <span style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
                  ou
                  <span style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
                </div>
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    textAlign: "center",
                    textDecoration: "none",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    borderRadius: 10,
                    padding: "11px 20px",
                    fontSize: 14,
                    fontWeight: 550,
                  }}
                >
                  Réserver un créneau
                </a>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
