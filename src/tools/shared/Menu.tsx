import { useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router";
import {
  FiChevronLeft,
  FiChevronRight,
  FiList,
  FiMaximize,
  FiMinimize,
  FiMusic,
  FiSearch,
  FiSettings,
  FiSmile,
} from "react-icons/fi";
import "../css/menu.css";
import { useTheme } from "../hooks/LOCAL/useTheme";
import { useShortcuts } from "../hooks/LOCAL/useShortcuts";
import { useFullscreen } from "../hooks/LOCAL/useFullscreen";
import { THEME_ICONS } from "./ThemeIcons";
import { THEME_LABELS } from "../lib/themes";

export type MenuItem = {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  mobile?: boolean; // bottom bar on phones: keep it to 5 at most
  match?: (pathname: string) => boolean;
};

const ITEMS: MenuItem[] = [
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
  { label: "Settings", icon: <FiSettings />, href: "/settings", mobile: true },
];

// sidebar on desktop, bottom tab bar (the very bottom, under the mini player) on phones
export default function Menu() {
  const { nextTheme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const { supported: canFullscreen, isFullscreen, toggleFullscreen } = useFullscreen();

  useShortcuts({ "ctrl+j": toggleTheme });

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("menu-collapsed") === "true");

  const toggleMenu = () => {
    setCollapsed((value) => {
      localStorage.setItem("menu-collapsed", String(!value));
      return !value;
    });
  };

  const menuItems: MenuItem[] = [
    ...ITEMS,
    // desktop only (sidebar bottom): whole page fullscreen, also in settings
    ...(canFullscreen
      ? [
          {
            label: isFullscreen ? "Exit full screen" : "Full screen",
            icon: isFullscreen ? <FiMinimize /> : <FiMaximize />,
            onClick: toggleFullscreen,
          },
        ]
      : []),
    {
      // shows the theme you'll switch to (ctrl+j cycles too)
      label: `${THEME_LABELS[nextTheme]} theme`,
      icon: THEME_ICONS[nextTheme],
      onClick: toggleTheme,
    },
  ];

  return (
    <nav className={`menu ${collapsed ? "menu-collapsed" : ""}`} aria-label="Main">
      <button type="button" className="menu-toggle" onClick={toggleMenu} aria-label="Toggle sidebar">
        {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        <span className="menu-label menu-brand">playlistGo</span>
      </button>

      {menuItems.map((item) => {
        const className = `menu-item ${item.mobile ? "menu-mobile-visible" : "menu-desktop-only"}`;
        const content = (
          <>
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
          </>
        );

        return item.onClick ? (
          <button key={item.label} type="button" className={className} onClick={item.onClick} title={item.label} aria-label={item.label}>
            {content}
          </button>
        ) : item.href ? (
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
            {content}
          </NavLink>
        ) : null;
      })}
    </nav>
  );
}
