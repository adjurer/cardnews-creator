import { clearAllData } from "@/lib/persistence/storage";
import { ArrowLeft, Moon, Sun, Monitor, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useThemeStore, type ThemeMode } from "@/store/useThemeStore";
import { cn } from "@/lib/utils";

const THEME_OPTIONS: { mode: ThemeMode; icon: typeof Sun; label: string; desc: string }[] = [
  { mode: "light", icon: Sun, label: "라이트", desc: "밝은 배경" },
  { mode: "dark", icon: Moon, label: "다크", desc: "어두운 배경" },
  { mode: "system", icon: Monitor, label: "시스템", desc: "OS 설정에 따름" },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { mode, setMode } = useThemeStore();

  return (
    <div className="h-full overflow-auto p-6 lg:p-8 scrollbar-thin">
      <div className="max-w-md mx-auto animate-fade-in">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> 작업 목록
        </button>

        <h1 className="text-xl font-bold text-foreground mb-6">설정</h1>

        <div className="space-y-4">
          {/* Theme selector */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground">테마</h3>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map(opt => (
                <button
                  key={opt.mode}
                  onClick={() => setMode(opt.mode)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all text-xs",
                    mode === opt.mode
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                  )}
                >
                  <opt.icon className="w-5 h-5" />
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                  {mode === opt.mode && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Data management */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground">데이터 관리</h3>
            <button onClick={() => { clearAllData(); toast.success("모든 데이터가 초기화되었습니다. 새로고침하세요."); }}
              className="w-full py-2 rounded-lg bg-destructive/10 text-sm text-destructive hover:bg-destructive/20 transition-colors">
              모든 데이터 초기화
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-1">AI CardNews Studio</h3>
            <p className="text-xs text-muted-foreground">v1.0.0 · 텍스트를 인스타그램 스타일 카드뉴스로 변환</p>
          </div>
        </div>
      </div>
    </div>
  );
}
