"use client";

import { useRef, useId, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./button";

/** Next.js signals a navigation (redirect) by throwing a tagged error. That is
 *  not a failure of the confirmation, so it must not be shown as one. */
function isNavigationSignal(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function ConfirmationDialog({
  title,
  message,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  trigger,
  onConfirm,
  open: controlledOpen,
  onOpenChange,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  trigger?: (open: () => void) => React.ReactNode;
  onConfirm: () => void | Promise<void>;
  /** Controlled visibility. When supplied, no `trigger` is rendered and the
   *  dialog stays mounted while the caller opens and closes it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [mounted, setMounted] = useState(false);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : uncontrolledOpen;

  useEffect(() => {
    setMounted(true);
  }, []);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );

  // Keep the native modal in step with React state. This runs whenever
  // visibility changes (including after mount), so a dialog that is rendered
  // up-front still opens correctly when the caller flips its prop.
  useEffect(() => {
    const dialog = ref.current;
    if (!mounted || !dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, mounted]);

  // Closing natively (Escape, form method="dialog") must sync back to state.
  useEffect(() => {
    const dialog = ref.current;
    if (!mounted || !dialog) return;
    const handleClose = () => setOpen(false);
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [mounted, setOpen]);

  const handleOpen = () => {
    setError(null);
    setOpen(true);
  };

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (e) {
      if (isNavigationSignal(e)) return;
      setError(e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!controlled &&
        (trigger ? (
          trigger(handleOpen)
        ) : (
          <button type="button" onClick={handleOpen}>
            Open Dialog
          </button>
        ))}
      {mounted &&
        createPortal(
          <dialog
            ref={ref}
            aria-labelledby={id}
            className="atlas-dialog m-auto max-h-[88vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-[28px] border border-white/80 bg-white p-0 text-slate-900 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.55)]"
            onClick={(event) => {
              if (event.target === ref.current) {
                const bounds = ref.current!.getBoundingClientRect();
                if (
                  event.clientX < bounds.left ||
                  event.clientX > bounds.right ||
                  event.clientY < bounds.top ||
                  event.clientY > bounds.bottom
                ) {
                  ref.current?.close();
                }
              }
            }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <h2 id={id} className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
              <button
                type="button"
                onClick={() => ref.current?.close()}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-6">{message}</p>
              {error && (
                <p role="alert" className="mb-4 rounded-xl bg-[var(--color-status-danger-soft,#fee2e2)] px-3 py-2 text-sm text-[var(--color-status-danger,#b91c1c)]">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => ref.current?.close()} disabled={busy}>
                  Cancel
                </Button>
                <Button
                  variant={confirmVariant === "danger" ? "danger" : "primary"}
                  onClick={handleConfirm}
                  disabled={busy}
                >
                  {busy ? "Working…" : confirmLabel}
                </Button>
              </div>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
