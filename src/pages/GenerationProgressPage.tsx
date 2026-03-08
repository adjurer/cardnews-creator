import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "@/store/useProjectStore";
import { generateId } from "@/lib/utils/helpers";
import { MOCK_EXAMPLES } from "@/mocks/data";
import { Check, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project, SourceType } from "@/types/project";

const STEPS = [
  { label: "입력 준비", desc: "소스 데이터를 정리하고 있습니다" },
  { label: "입력 분석", desc: "핵심 내용을 파악하고 있습니다" },
  { label: "핵심 포인트 추출", desc: "카드뉴스에 적합한 포인트를 선별합니다" },
  { label: "카드 구조 생성", desc: "AI가 슬라이드를 구성하고 있습니다" },
  { label: "편집 화면 준비", desc: "거의 완료되었습니다" },
];

export default function GenerationProgressPage() {
  const navigate = useNavigate();
  const { generationStatus, generationStep, setGenerationStatus, setGenerationStep, createProject } = useProjectStore();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const sourceRaw = sessionStorage.getItem("generation-source");
    if (!sourceRaw) {
      setGenerationStatus("error");
      return;
    }

    const source = JSON.parse(sourceRaw);
    runGeneration(source);
  }, []);

  const runGeneration = async (source: { sourceType: string; content: string; title?: string }) => {
    try {
      // Mock generation with steps
      for (let i = 0; i < STEPS.length; i++) {
        setGenerationStep(i);
        await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
      }

      // Use example data if available, otherwise generate mock
      let slides;
      let title = source.title || "새 카드뉴스";

      if (source.sourceType === "example") {
        const ex = MOCK_EXAMPLES.find(e => e.title === source.title);
        if (ex) {
          slides = ex.slides.map(s => ({ ...s, id: generateId() }));
          title = ex.title;
        }
      }

      if (!slides) {
        // Generate mock slides from content
        const contentPreview = source.content.slice(0, 50);
        slides = [
          { id: generateId(), type: "cover" as const, title: title || contentPreview, subtitle: "AI가 생성한 카드뉴스", layoutType: "center-title" as const, textAlign: "center" as const, themePreset: "cyan-accent" as const },
          { id: generateId(), type: "summary" as const, title: "핵심 요약", body: source.content.slice(0, 100) + "...", layoutType: "title-body" as const, textAlign: "center" as const, themePreset: "cyan-accent" as const },
          { id: generateId(), type: "detail" as const, title: "주요 포인트 1", body: "입력된 내용에서 추출한 첫 번째 핵심 포인트입니다.", layoutType: "title-body" as const, textAlign: "center" as const, themePreset: "cyan-accent" as const },
          { id: generateId(), type: "detail" as const, title: "주요 포인트 2", body: "두 번째 핵심 포인트를 설명합니다.", layoutType: "title-body" as const, textAlign: "center" as const, themePreset: "cyan-accent" as const },
          { id: generateId(), type: "list" as const, title: "정리", bullets: ["포인트 A", "포인트 B", "포인트 C"], layoutType: "bullet-list" as const, textAlign: "left" as const, themePreset: "cyan-accent" as const },
          { id: generateId(), type: "cta" as const, title: "다음 단계", cta: "자세히 알아보기", layoutType: "cta" as const, textAlign: "center" as const, themePreset: "cyan-accent" as const },
        ];
      }

      const project: Project = {
        id: generateId(),
        title,
        sourceType: source.sourceType as SourceType,
        sourceInput: source.content.slice(0, 200),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "generated",
        themePreset: "cyan-accent",
        slides,
        exportPreset: { format: "png", size: "1080x1350" },
      };

      await createProject(project);
      setGenerationStatus("done");
      sessionStorage.removeItem("generation-source");
      navigate(`/editor/${project.id}`);
    } catch (e) {
      console.error("Generation error:", e);
      setGenerationStatus("error");
    }
  };

  const progress = ((generationStep + 1) / STEPS.length) * 100;

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
        </div>

        <h2 className="text-lg font-bold text-foreground mb-1 text-center">AI가 카드뉴스를 만들고 있어요</h2>
        <p className="text-xs text-muted-foreground mb-8 text-center">잠시만 기다려주세요</p>

        <div className="w-full h-1 bg-surface rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const isActive = generationStep === i && generationStatus !== "done" && generationStatus !== "error";
            const isDone = generationStep > i || generationStatus === "done";
            return (
              <div key={i} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg transition-all", isActive && "bg-primary/5")}>
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-all",
                  isDone ? "bg-primary text-primary-foreground" : isActive ? "bg-primary/20 text-primary" : "bg-surface text-muted-foreground"
                )}>
                  {isDone ? <Check className="w-3.5 h-3.5" /> : isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn("text-sm transition-colors block",
                    isDone ? "text-foreground" : isActive ? "text-primary font-medium" : "text-muted-foreground"
                  )}>{step.label}</span>
                  {isActive && <span className="text-[10px] text-muted-foreground">{step.desc}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {generationStatus === "error" && (
          <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-center gap-2 text-destructive text-sm mb-3">
              <AlertCircle className="w-4 h-4" /> 생성에 실패했습니다
            </div>
            <div className="flex gap-2">
              <button onClick={() => { started.current = false; setGenerationStatus("generating"); setGenerationStep(0); }}
                className="px-3 py-1.5 rounded-md bg-destructive/20 text-destructive text-xs hover:bg-destructive/30">다시 시도</button>
              <button onClick={() => navigate("/create")}
                className="px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground">돌아가기</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
