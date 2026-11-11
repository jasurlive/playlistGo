import { useNavigate } from "react-router";
import { FiArrowLeft } from "react-icons/fi";

// top-left back arrow: the way out of a page when embedded without the navbar (lib/embed.ts)
// goes back where you came from; opened directly (no in-app history) -> the library
export default function BackButton() {
  const navigate = useNavigate();
  const goBack = () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate("/", { replace: true }));

  return (
    <button type="button" className="icon-btn back-btn" onClick={goBack} aria-label="Back">
      <FiArrowLeft />
    </button>
  );
}
