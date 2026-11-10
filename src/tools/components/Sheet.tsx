import { useEffect, type ReactNode } from "react";
import "../css/sheet.css";
import { useDragDismiss } from "../hooks/LOCAL/useDragDismiss";

type Props = {
  label: string;
  header: ReactNode; // grab area: drag it down to close
  children: ReactNode;
  onClose: () => void;
};

// bottom sheet on phones, centered dialog on desktop
export default function Sheet({ label, header, children, onClose }: Props) {
  const { ref, handlers } = useDragDismiss<HTMLDivElement>({ onDismiss: onClose });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        ref={ref}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-drag" {...handlers}>
          <div className="sheet-grip">
            <span />
          </div>
          {header}
        </div>
        {children}
      </div>
    </div>
  );
}
