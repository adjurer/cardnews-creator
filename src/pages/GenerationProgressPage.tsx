import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "@/store/useProjectStore";
import { generateCardNews } from "@/lib/ai/aiService";
import { generateId } from "@/lib/utils/helpers";
import { MOCK_EXAMPLES } from "@/mocks/data";
import { Check, Loader2, AlertCircle, Sparkles, FileSearch, PenLine, LayoutDashboard, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project, SourceType } from "@/types/project";

const STEPS = [
  { label: "브리프 분석", desc: "소스와 브리프를 분석합니다", icon: FileSearch },
  { label: "스토리라인 설계", desc: "슬라이드 구조를 설계합니다", icon: LayoutDashboard },
  { label: "슬라이드 카피 생성", desc: "AI가 텍스트를 작성합니다", icon: PenLine },
  { label: "편집 준비", desc: "최종 점검 후 편집기를 준비합니다", icon: Wand2 },
];

export default function GenerationProgressPage() {
  const navigate = useNavigate();
  const { generationStatus, generationStep, setGenerationStatus, setGenerationStep, createProject } = useProjectStore();
  const started = useRef(false);
  const [currentStepInternal, setCurrentStepInternal] = useState(0);

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

  const advanceStep = (step: number) => {
    setCurrentStepInternal(step);
    setGenerationStep(Math.min(step, 1)); // map to store's 2-step system
  };

  const runGeneration = async (source: { sourceType: string; content: string; title?: string; brief?: any }) => {
    try {
      advanceStep(0);

      // For "example" source type, use mock data
      if (source.sourceType === "example") {
        const ex = MOCK_EXAMPLES.find(e => e.title === source.title);
        if (ex) {
          await new Promise(r => setTimeout(r, 600));
          advanceStep(1);
          await new Promise(r => setTimeout(r, 500));
          advanceStep(2);
          await new Promise(r => setTimeout(r, 400));
          advanceStep(3);
          await new Promise(r => setTimeout(r, 300));

          const project: Project = {
            id: generateId(),
            title: ex.title,
            sourceType: "example",
            sourceInput: source.content.slice(0, 200),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "generated",
            themePreset: "cyan-accent",
            slides: ex.slides.map(s => ({ ...s, id: generateId() })),
            exportPreset: { format: "png", size: "1080x1350" },
          };

          await createProject(project);
          setGenerationStatus("done");
          sessionStorage.removeItem("generation-source");
          navigate(`/editor/${project.id}`);
          return;
        }
      }

      // Step 0 -> 1: Analyzing
      await new Promise(r => setTimeout(r, 800));
      advanceStep(1);

      // Step 1 -> 2: AI generation
      const result = await generateCardNews(
        source.sourceType as SourceType,
        source.content,
        source.title,
        source.brief
      );

      advanceStep(2);
      await new Promise(r => setTimeout(r, 500));
      advanceStep(3);
      await new Promise(r => setTimeout(r, 400));

      const slides = result.slides.map(s => ({
        ...s,
        id: generateId(),
      }));

      const project: Project = {
        id: generateId(),
        title: result.title,
        sourceType: source.sourceType as SourceType,
        sourceInput: source.content.slice(0, 200),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "generated",
        themePreset: result.themePreset,
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

  const progress = ((currentStepInternal + 1) / STEPS.length) * 100;

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-foreground mb-1 text-center">AI가 카드뉴스를 만들고 있어요</h2>
        <p className="text-xs text-muted-foreground mb-10 text-center">브리프를 기반으로 최적의 콘텐츠를 생성합니다</p>

        {/* Step list */}
        <div className="space-y-3 mb-8">
          {STEPS.map((step, i) => {
            const isActive = currentStepInternal === i && generationStatus !== "done" && generationStatus !== "error";
            const isDone = currentStepInternal > i || generationStatus === "done";
            const Icon = step.icon;

            return (
              <div key={i} className={cn(
                "flex items-center gap-4 p-3 rounded-xl border transition-all",
                isDone ? "border-primary/30 bg-primary/5" : isActive ? "border-primary/50 bg-primary/10" : "border-border bg-card"
              )}>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all",
                  isDone ? "bg-primary text-primary-foreground" : isActive ? "bg-primary/20 text-primary" : "bg-surface text-muted-foreground"
                )}>
                  {isDone ? <Check className="w-4 h-4" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", isDone || isActive ? "text-foreground" : "text-muted-foreground")}>{step.label}</p>
                  <p className={cn("text-[11px]", isActive ? "text-muted-foreground" : "text-muted-foreground/50")}>{step.desc}</p>
                </div>
                {isDone && <span className="text-[10px] text-primary font-medium">완료</span>}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-surface rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>

        {generationStatus !== "error" && (
          <button onClick={() => { navigate("/create"); setGenerationStatus("idle"); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mx-auto">
            ✕ 취소
          </button>
        )}

        {generationStatus === "error" && (
          <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
            <div className="flex items-center gap-2 text-destructive text-sm mb-3">
              <AlertCircle className="w-4 h-4" /> 생성에 실패했습니다
            </div>
            <div className="flex gap-2">
              <button onClick={() => { started.current = false; setGenerationStatus("generating"); setGenerationStep(0); setCurrentStepInternal(0); }}
                className="px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive text-xs hover:bg-destructive/30">다시 시도</button>
              <button onClick={() => navigate("/create")}
                className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground">돌아가기</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
