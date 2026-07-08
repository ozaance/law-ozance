"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");

    const next: Msg[] = [...messages, { role: "user", content: text }];
    // On ajoute une bulle assistant vide qu'on remplira en streaming.
    setMessages([...next, { role: "assistant", content: "" }]);
    setBusy(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => null);
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: j?.error ?? "Une erreur est survenue.",
          };
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "Connexion à l'assistant impossible.",
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Assistant IA"
        className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-transform hover:scale-105 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3a9 9 0 0 0-9 9 9 9 0 0 0 1.3 4.6L3 21l4.4-1.3A9 9 0 1 0 12 3Z" />
          </svg>
        )}
      </button>

      {/* Panneau de chat */}
      {open && (
        <div className="fixed bottom-20 right-5 z-30 flex h-[32rem] max-h-[calc(100dvh-6rem)] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Assistant IA</p>
              <p className="text-xs text-muted">Vos données, en langage naturel</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="text-sm text-muted">
                <p>Posez une question sur votre cabinet, par exemple :</p>
                <ul className="mt-2 space-y-1.5">
                  {[
                    "Combien de dossiers ouverts ai-je ?",
                    "Quelles factures sont impayées ?",
                    "Quelles échéances cette semaine ?",
                  ].map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => setInput(s)}
                        className="rounded-md bg-black/[0.04] px-2 py-1 text-left text-xs transition-colors hover:bg-black/[0.08] dark:bg-white/5 dark:hover:bg-white/10"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-accent text-accent-foreground"
                      : "bg-black/[0.04] text-foreground dark:bg-white/5"
                  }`}
                >
                  {m.content || (busy && i === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-end gap-2 border-t border-border p-3"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder="Écrire un message…"
              className="max-h-28 flex-1 resize-none rounded-lg border border-border-strong bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:bg-zinc-900 dark:focus:border-zinc-100"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {busy ? "…" : "Envoyer"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
