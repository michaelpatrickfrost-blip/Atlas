"use client";

import { useRef, useId, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./button";

export function ConfirmationDialog({
  title,
  message,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  trigger,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  trigger?: (open: () => void) => React.ReactNode;
  onConfirm: () => void | Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [mounted, setMounted] = useState(false);
  const [openRequest, setOpenRequest] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (openRequest) ref.current?.showModal();
  }, [openRequest]);

  const open = () => {
    setOpenRequest((value) => value + 1);
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
      ref.current?.close();
    } catch (e) {
      alert(e instanceof Error ? e.message : "An unexpected error occurred.");
    }
  };

  return (
    <>
      {trigger ? (
        trigger(open)
      ) : (
        <button type="button" onClick={open}>
          Open Dialog
        </button>
      )}
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
              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => ref.current?.close()}
                >
                  Cancel
                </Button>
                <Button
                  variant={confirmVariant === "danger" ? "danger" : "primary"}
                  onClick={handleConfirm}
                >
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </dialog>
          ,
          document.body
        )}
    </>
  );
}
