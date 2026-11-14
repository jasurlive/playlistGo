import { useSyncExternalStore } from "react";

// app-styled replacement for window.confirm(): `if (await confirmDialog({...})) doIt()`
// rendered by <ConfirmHost /> in Layout

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string; // default "OK"
  cancelLabel?: string; // default "Cancel"
  danger?: boolean; // red confirm button for destructive actions
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

let pending: Pending | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  pending?.resolve(false); // a newer dialog replaces an open one
  return new Promise((resolve) => {
    pending = { ...options, resolve };
    emit();
  });
}

export function answerConfirm(ok: boolean) {
  const current = pending;
  pending = null;
  emit();
  current?.resolve(ok);
}

export function usePendingConfirm() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => pending,
  );
}
