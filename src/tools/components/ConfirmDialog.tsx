import { useEffect, useRef } from "react";
import Sheet from "./Sheet";
import { answerConfirm, usePendingConfirm } from "../lib/confirm";

const cancel = () => answerConfirm(false);

// shows whatever confirmDialog() asked for: bottom sheet on phones, small dialog on desktop
export default function ConfirmHost() {
  const dialog = usePendingConfirm();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus(); // Enter confirms, Esc / backdrop / swipe down cancels
  }, [dialog]);

  if (!dialog) return null;

  return (
    <Sheet
      label={dialog.title}
      onClose={cancel}
      header={
        <div className="confirm-head">
          <h2 className="confirm-title">{dialog.title}</h2>
          {dialog.message && <p className="confirm-message">{dialog.message}</p>}
        </div>
      }
    >
      <div className="confirm-actions">
        <button type="button" className="btn" onClick={cancel}>
          {dialog.cancelLabel ?? "Cancel"}
        </button>
        <button
          ref={confirmRef}
          type="button"
          className={`btn ${dialog.danger ? "btn-danger-solid" : "btn-accent"}`}
          onClick={() => answerConfirm(true)}
        >
          {dialog.confirmLabel ?? "OK"}
        </button>
      </div>
    </Sheet>
  );
}
