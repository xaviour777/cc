"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { cx } from "@/lib/utils";

type ActionResult = { ok: boolean; error?: string };

export function FormShell({
  action,
  children,
  submitLabel = "Save",
  className,
  resetOnSuccess = false,
  onSuccess,
}: {
  action: (fd: FormData) => Promise<ActionResult>;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setError(null);
        try {
          const res = await action(new FormData(e.currentTarget));
          if (!res.ok) {
            setError(res.error ?? "Something went wrong");
            return;
          }
          if (resetOnSuccess) ref.current?.reset();
          setFlash(true);
          setTimeout(() => setFlash(false), 1600);
          onSuccess?.();
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
      <div className="flex items-center gap-3 mt-4">
        <button type="submit" disabled={busy} className="btn btn-primary !py-2.5 !px-6 text-sm">
          {busy ? <Loader2 size={15} className="animate-spin" /> : flash ? <Check size={15} /> : null}
          {flash ? "Saved" : submitLabel}
        </button>
        {error && <p className="text-sm font-medium">{error}</p>}
      </div>
    </form>
  );
}

export function ActionButton({
  action,
  children,
  variant = "ghost",
  confirm,
  className,
}: {
  action: () => Promise<ActionResult>;
  children: ReactNode;
  variant?: "ghost" | "primary" | "danger";
  confirm?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (confirm && !window.confirm(confirm)) return;
        setBusy(true);
        try {
          const res = await action();
          if (!res.ok) window.alert(res.error ?? "Something went wrong");
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium border transition-colors disabled:opacity-50",
        variant === "primary" && "bg-ink text-paper border-ink hover:opacity-85",
        variant === "ghost" && "border-line hover:border-ink",
        variant === "danger" && "border-line hover:border-ink text-ink",
        className
      )}
    >
      {busy && <Loader2 size={12} className="animate-spin" />}
      {children}
    </button>
  );
}

export function AdminBadge({ tone = "neutral", children }: { tone?: "neutral" | "dark" | "soft"; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] tracking-[0.1em] uppercase font-semibold",
        tone === "dark" && "bg-ink text-paper",
        tone === "neutral" && "bg-mist border border-line",
        tone === "soft" && "bg-line"
      )}
    >
      {children}
    </span>
  );
}
