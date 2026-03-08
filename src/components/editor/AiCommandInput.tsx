import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, Wand2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onSubmit: (instruction: string, mode: "slide" | "project") => Promise<void>;
  isProcessing: boolean;
  slideTitle?: string;
}

const QUICK_ACTIONS = [
  { label: "더 짧게", instruction: "텍스트를 더 짧고 임팩트 있게 줄여주세요" },
  { label: "전문적으로", instruction: "톤을 더 전문적이고 신뢰감 있게 바꿔주세요" },
  { label: "캐주얼하게", instruction: "톤을 친근하고 캐주얼하게 바꿔주세요" },
  { label: "강조 추가", instruction: "핵심 키워드에 하이라이트 문구를 추가해주세요" },
];

export function AiCommandInput({ onSubmit, isProcessing, slideTitle }: Props) {
  const [instruction, setInstruction] = useState("");
  const [mode, setMode] = useState<"slide" | "project">("slide");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!instruction.trim() || isProcessing) return;
    const text = instruction.trim();
    setInstruction("");
    await onSubmit(text, mode);
  };

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-surface border-b border-border">
        <button
          onClick={() => setMode("slide")}
          className={cn(
            "px-2.5 py-1 rounded-md text-[10px] font-medium transition-all",
            mode === "slide"
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Wand2 className="w-3 h-3 inline mr-1" />
          현재 슬라이드
        </button>
        <button
          onClick={() => setMode("project")}
          className={cn(
            "px-2.5 py-1 rounded-md text-[10px] font-medium transition-all",
            mode === "project"
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <RotateCcw className="w-3 h-3 inline mr-1" />
          전체 프로젝트
        </button>
        {mode === "slide" && slideTitle && (
          <span className="text-[9px] text-muted-foreground ml-auto truncate max-w-[120px]">
            "{slideTitle}"
          </span>
        )}
      </div>

      {/* Quick actions */}
      {mode === "slide" && (
        <div className="flex gap-1 px-3 py-1.5 flex-wrap">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => onSubmit(action.instruction, "slide")}
              disabled={isProcessing}
              className="px-2 py-0.5 rounded text-[9px] font-medium bg-surface border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2">
        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
        <input
          ref={inputRef}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={
            mode === "slide"
              ? "예: 제목을 더 강렬하게 바꿔줘"
              : "예: 전체적으로 톤을 캐주얼하게, 5장으로 줄여줘"
          }
          disabled={isProcessing}
          className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!instruction.trim() || isProcessing}
          className="p-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {isProcessing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {isProcessing && (
        <div className="px-3 py-1.5 bg-primary/5 border-t border-border">
          <span className="text-[10px] text-primary animate-pulse">
            {mode === "slide" ? "슬라이드 수정 중..." : "전체 프로젝트 재구성 중..."}
          </span>
        </div>
      )}
    </div>
  );
}
