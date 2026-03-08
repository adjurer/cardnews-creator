import { useNavigate, useLocation } from "react-router-dom";
import { Plus, LayoutGrid, Rss, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: Plus, label: "만들기", path: "/create" },
  { icon: LayoutGrid, label: "작업 목록", path: "/dashboard" },
  { icon: Rss, label: "소스", path: "/create" },
  { icon: Sparkles, label: "에디터", path: "/dashboard" },
  { icon: Settings, label: "설정", path: "/settings" },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex flex-col items-center w-[56px] min-w-[56px] bg-sidebar border-r border-sidebar-border py-4 gap-1">
      {/* Traffic lights placeholder */}
      <div className="flex flex-col gap-1.5 mb-6 items-center">
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
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
              "hover:bg-sidebar-accent",
              isActive
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground"
            )}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
}
