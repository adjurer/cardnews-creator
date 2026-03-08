import { useState } from "react";
import { clearAllData } from "@/lib/persistence/storage";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-auto p-6 lg:p-8 scrollbar-thin">
      <div className="max-w-md mx-auto animate-fade-in">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> 작업 목록
        </button>

        <h1 className="text-xl font-bold text-foreground mb-6">설정</h1>

        <div className="space-y-4">
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
