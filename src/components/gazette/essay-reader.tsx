"use client";

import { useState, type ReactNode } from "react";
import { cx } from "@/lib/utils";

type Mode = "both" | "en" | "ur";

const MODES: { key: Mode; label: string }[] = [
  { key: "both", label: "Side by side · دو لسانی" },
  { key: "en", label: "English" },
  { key: "ur", label: "اردو" },
];

/** Bilingual essay with a switch between both columns, English only and Urdu only. */
export default function EssayReader({ english, urdu }: { english: ReactNode; urdu: ReactNode }) {
  const [mode, setMode] = useState<Mode>("both");

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-8 border-b border-ink/20">
        <span className="gz-label">Reading mode</span>
        <div className="inline-flex flex-wrap bg-mist p-1 gap-1">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={cx(
                "gz-label px-4 py-1.5 transition-colors",
                mode === m.key ? "bg-ink text-paper" : "hover:bg-line"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className={cx(
          "relative grid gap-10",
          mode === "both" ? "md:grid-cols-2" : "max-w-3xl mx-auto"
        )}
      >
        {mode === "both" && (
          <div className="hidden md:block absolute inset-y-0 left-1/2 w-px bg-ink/20 pointer-events-none" />
        )}
        {mode !== "ur" && <article className="space-y-6 md:pr-4">{english}</article>}
        {mode !== "en" && (
          <article lang="ur" dir="rtl" className="space-y-6 md:pl-4">
            {urdu}
          </article>
        )}
      </div>
    </>
  );
}
