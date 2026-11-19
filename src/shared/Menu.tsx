import { useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router";
import {
  FiChevronLeft,
  FiChevronRight,
  FiList,
  FiMusic,
  FiSearch,
  FiSettings,
} from "react-icons/fi";
import "../css/menu.css";
import smile from "./svg/smile.svg?raw"; // our singing emoji, inlined so its css animation runs
import { useTheme } from "../hooks/LOCAL/useTheme";
import { useShortcuts } from "../hooks/LOCAL/useShortcuts";
import { usePlayer } from "../hooks/LOCAL/usePlayer";

// same navbar as the django-react template (shared/Menu.tsx), with playlistGo's pages
export type MenuItem = {
  label: string;
  icon: ReactNode;
  href: string;
  mobile?: boolean; // bottom bar on phones: keep it to 5 at most
  bottom?: boolean; // pinned to the bottom of the sidebar on desktop, keep these last
  match?: (pathname: string) => boolean; // custom "active" check
};

export default function Menu({
  items = [
    {
      label: "Library",
      icon: <FiMusic />,
      href: "/",
      mobile: true,
      match: (p) => p === "/" || p.startsWith("/p/"), // playlist tabs live in the library
    },
    { label: "Moods", icon: <span className="svg-icon" dangerouslySetInnerHTML={{ __html: smile }} />, href: "/moods", mobile: true },
    { label: "Search", icon: <FiSearch />, href: "/search", mobile: true },
    { label: "Queue", icon: <FiList />, href: "/queue", mobile: true },
    { label: "Settings", icon: <FiSettings />, href: "/settings", mobile: true, bottom: true },
  ],
}: {
  items?: MenuItem[];
}) {
  const { playing } = usePlayer();
  const { toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("menu-collapsed") !== "false");

  const toggleMenu = () => {
    setCollapsed((value) => {
      localStorage.setItem("menu-collapsed", String(!value));
      return !value;
    });
  };

  // global shortcuts, listed on the Settings page: keep both in sync
  useShortcuts({ "ctrl+j": toggleTheme, "`": toggleMenu });

  return (
    // .is-playing: the Moods emoji bobs + sings only while music plays (svg/smile.svg)
    <nav className={`menu ${collapsed ? "menu-collapsed" : ""} ${playing ? "is-playing" : ""}`} aria-label="Main">
      <button
        type="button"
        className="menu-toggle"
        onClick={toggleMenu}
        aria-label="Toggle sidebar (`)"
        title="Toggle sidebar (`)"
      >
        {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
      </button>

      {items.map((item) => {
        const className = `menu-item ${item.mobile ? "menu-mobile-visible" : "menu-desktop-only"} ${
          item.bottom ? "menu-bottom" : ""
        }`;

        return (
          // NavLink adds .active on the current page; `end` so "/" isn't active everywhere
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/"}
            className={({ isActive }) =>
              `${className} ${(item.match ? item.match(pathname) : isActive) ? "active" : ""}`
            }
            title={item.label}
            aria-label={item.label}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
