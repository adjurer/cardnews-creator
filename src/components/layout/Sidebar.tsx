import { useNavigate, useLocation } from "react-router-dom";
import { Plus, LayoutGrid, Settings, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore, type ThemeMode } from "@/store/useThemeStore";

const NAV_ITEMS = [
  { icon: Plus, label: "만들기", path: "/create" },
  { icon: LayoutGrid, label: "작업 목록", path: "/dashboard" },
  { icon: Settings, label: "설정", path: "/settings" },
];

const THEME_CYCLE: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: "dark", icon: Moon, label: "다크" },
  { mode: "light", icon: Sun, label: "라이트" },
  { mode: "system", icon: Monitor, label: "시스템" },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, setMode } = useThemeStore();

  const currentTheme = THEME_CYCLE.find(t => t.mode === mode) || THEME_CYCLE[0];
  const nextTheme = THEME_CYCLE[(THEME_CYCLE.findIndex(t => t.mode === mode) + 1) % THEME_CYCLE.length];

  return (
    <div className="flex items-center h-11 min-h-[44px] bg-sidebar border-b border-sidebar-border px-3 gap-1 shrink-0">
      {/* Traffic lights */}
      <div className="flex gap-1.5 items-center mr-3">
        <div className="w-3 h-3 rounded-full bg-destructive/70" />
        <div className="w-3 h-3 rounded-full bg-warning/70" />
        <div className="w-3 h-3 rounded-full bg-success/70" />
      </div>

      {NAV_ITEMS.map((item, i) => {
        const isActive = location.pathname === item.path ||
          (item.path === "/dashboard" && location.pathname === "/");
        return (
          <button
            key={i}
            onClick={() => navigate(item.path)}
            className={cn(
              "h-8 px-3 rounded-lg flex items-center gap-1.5 transition-all text-xs font-medium",
              "hover:bg-sidebar-accent",
              isActive
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground"
            )}
            title={item.label}
          >
            <item.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        );
      })}

      <div className="flex-1" />

      {/* Theme toggle */}
      <button
        onClick={() => setMode(nextTheme.mode)}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-sidebar-accent text-sidebar-foreground"
        title={`테마: ${currentTheme.label} → ${nextTheme.label}`}
      >
        <currentTheme.icon className="w-4 h-4" />
      </button>
    </div>
  );
}
