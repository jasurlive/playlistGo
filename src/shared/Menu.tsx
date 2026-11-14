import { useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router";
import {
  FiChevronLeft,
  FiChevronRight,
  FiList,
  FiMusic,
  FiSearch,
  FiSettings,
  FiSmile,
} from "react-icons/fi";
import "../css/menu.css";
import { useTheme } from "../hooks/LOCAL/useTheme";
import { useShortcuts } from "../hooks/LOCAL/useShortcuts";

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
    { label: "Moods", icon: <FiSmile />, href: "/moods", mobile: true },
    { label: "Search", icon: <FiSearch />, href: "/search", mobile: true },
    { label: "Queue", icon: <FiList />, href: "/queue", mobile: true },
    { label: "Settings", icon: <FiSettings />, href: "/settings", mobile: true, bottom: true },
  ],
}: {
  items?: MenuItem[];
}) {
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
    <nav className={`menu ${collapsed ? "menu-collapsed" : ""}`} aria-label="Main">
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
