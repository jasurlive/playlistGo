import { useNavigate } from "react-router";
import { FiArrowLeft } from "react-icons/fi";
import { usePlayer } from "../hooks/LOCAL/usePlayer";
import { useShortcuts } from "../hooks/LOCAL/useShortcuts";

// top-left back arrow: the way out of a page when embedded without the navbar (lib/embed.ts)
// goes back where you came from; opened directly (no in-app history) -> the library
// Esc presses it too, unless something on top owns Esc (full player, sheet, confirm dialog)
export default function BackButton() {
  const navigate = useNavigate();
  const { expanded } = usePlayer();
  const goBack = () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate("/", { replace: true }));

  useShortcuts({
    escape: () => {
      if (expanded || document.querySelector(".sheet")) return;
      goBack();
    },
  });

  return (
    <button type="button" className="icon-btn back-btn" onClick={goBack} aria-label="Back (Esc)" title="Back (Esc)">
      <FiArrowLeft />
    </button>
  );
}
