import type { ComponentProps } from "react";
import { MdDragIndicator } from "react-icons/md";

// grip at the start of a song row, spread useDragReorder's handleProps(i) onto it
export default function DragHandle({ title, ...props }: ComponentProps<"button"> & { title: string }) {
  return (
    <button
      type="button"
      className="song-handle"
      aria-label={`Move ${title} (drag, or arrow up / down)`}
      title="Drag to reorder"
      {...props}
    >
      <MdDragIndicator />
    </button>
  );
}
