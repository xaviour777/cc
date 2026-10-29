"use client";

import { useState, type ReactNode } from "react";
import { cx } from "@/lib/utils";

type Mode = "both" | "ur" | "en";

const MODES: { key: Mode; label: string }[] = [
  { key: "both", label: "Parallel · دو لسانی" },
  { key: "ur", label: "اردو مکمل" },
  { key: "en", label: "English only" },
];

export type Chapter = { no: string; tag: string; en: ReactNode; ur: ReactNode };

/** Bilingual chapters that all follow one reading-mode switch. */
export default function ChapterReader({ chapters }: { chapters: Chapter[] }) {
  const [mode, setMode] = useState<Mode>("both");

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2 bg-mist border border-line mb-8">
        <span className="gz-label">Reading mode</span>
        <div className="flex flex-wrap gap-1">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={cx(
                "gz-label px-3 py-1.5 transition-colors",
                mode === m.key ? "bg-ink text-paper" : "bg-paper hover:bg-line"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-10">
        {chapters.map((c) => (
          <section key={c.no} className="bg-paper border border-line p-5 md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 mb-6 bg-mist">
              <span className="gz-label">{c.no}</span>
              <span className="gz-label text-ink-soft">{c.tag}</span>
            </div>
            <div className={cx("grid gap-10 items-start", mode === "both" ? "md:grid-cols-2" : "max-w-3xl mx-auto")}>
              {mode !== "ur" && <div className="space-y-4">{c.en}</div>}
              {mode !== "en" && (
                <div lang="ur" dir="rtl" className="space-y-4">
                  {c.ur}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
