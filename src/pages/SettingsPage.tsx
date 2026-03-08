import { useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { clearAllData, clearRecentProjects } from "@/lib/persistence/storage";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { ExportSize } from "@/types/project";
import { cn } from "@/lib/utils";

const SIZES: { value: ExportSize; label: string }[] = [
  { value: "1080x1350", label: "1080 × 1350" },
  { value: "1080x1080", label: "1080 × 1080" },
  { value: "1080x1920", label: "1080 × 1920" },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [defaultSize, setDefaultSize] = useState<ExportSize>("1080x1350");
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div className="h-full overflow-auto p-8 scrollbar-thin">
      <div className="max-w-lg mx-auto animate-fade-in">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> 대시보드로 돌아가기
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-8">설정</h1>

        <div className="space-y-6">
          {/* Default export size */}
          <div className="glass-panel p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">기본 내보내기 사이즈</h3>
            <div className="flex gap-2">
              {SIZES.map(s => (
                <button key={s.value} onClick={() => setDefaultSize(s.value)}
                  className={cn("flex-1 py-2 rounded-md text-xs font-medium transition-all",
                    defaultSize === s.value ? "bg-primary/20 text-primary border border-primary/40" : "bg-surface text-muted-foreground border border-transparent"
                  )}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Auto save */}
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">자동 저장</h3>
                <p className="text-xs text-muted-foreground mt-0.5">편집 시 자동으로 저장합니다</p>
              </div>
              <button onClick={() => setAutoSave(!autoSave)}
                className={cn("w-10 h-6 rounded-full transition-all relative",
                  autoSave ? "bg-primary" : "bg-surface"
                )}>
                <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-foreground transition-all",
                  autoSave ? "left-5" : "left-1"
                )} />
              </button>
            </div>
          </div>

          {/* Data management */}
          <div className="glass-panel p-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground">데이터 관리</h3>
            <button onClick={() => { clearRecentProjects(); toast.success("최근 프로젝트 목록이 비워졌습니다"); }}
              className="w-full py-2 rounded-md bg-surface text-sm text-foreground hover:bg-muted transition-colors">
              최근 프로젝트 비우기
            </button>
            <button onClick={() => { clearAllData(); toast.success("모든 데이터가 초기화되었습니다. 새로고침하세요."); }}
              className="w-full py-2 rounded-md bg-destructive/20 text-sm text-destructive hover:bg-destructive/30 transition-colors">
              모든 데이터 초기화
            </button>
          </div>

          {/* About */}
          <div className="glass-panel p-4">
            <h3 className="text-sm font-medium text-foreground mb-2">AI CardNews Studio</h3>
            <p className="text-xs text-muted-foreground">AI 카드뉴스 스튜디오 v1.0.0</p>
            <p className="text-xs text-muted-foreground mt-1">텍스트를 인스타그램 스타일 카드뉴스로 자동 변환하는 도구입니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
