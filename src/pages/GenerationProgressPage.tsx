import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "@/store/useProjectStore";
import { defaultProvider } from "@/lib/ai/mockProvider";
import { generateId } from "@/lib/utils/helpers";
import { MOCK_EXAMPLES } from "@/mocks/data";
import { Check, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

const STEPS = [
  { label: "입력 준비", desc: "소스 데이터를 정리하고 있습니다" },
  { label: "입력 분석", desc: "핵심 내용을 파악하고 있습니다" },
  { label: "핵심 포인트 추출", desc: "카드뉴스에 적합한 포인트를 선별합니다" },
  { label: "카드 구조 생성", desc: "슬라이드 구조를 만들고 있습니다" },
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
      for (let i = 0; i < STEPS.length - 1; i++) {
        setGenerationStep(i);
        await new Promise(r => setTimeout(r, 700 + Math.random() * 500));
      }

      if (source.sourceType === "example") {
        const ex = MOCK_EXAMPLES.find(e => e.title === source.title);
        if (ex) {
          const project: Project = {
            id: generateId(),
            title: ex.title,
            sourceType: "example",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "generated",
            themePreset: "cyan-accent",
            slides: ex.slides.map(s => ({ ...s, id: generateId() })),
            exportPreset: { format: "png", size: "1080x1350" },
          };
          setGenerationStep(4);
          await new Promise(r => setTimeout(r, 400));
          await createProject(project);
          setGenerationStatus("done");
          sessionStorage.removeItem("generation-source");
          navigate(`/editor/${project.id}`);
          return;
        }
      }

      const result = await defaultProvider.generate({
        sourceType: source.sourceType as any,
        content: source.content,
        title: source.title,
      });

      setGenerationStep(4);
      await new Promise(r => setTimeout(r, 400));

      const project: Project = {
        id: generateId(),
        title: result.title,
        sourceType: source.sourceType as any,
        sourceInput: source.content.slice(0, 200),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "generated",
        themePreset: result.themePreset,
        slides: result.slides,
        exportPreset: { format: "png", size: "1080x1350" },
      };

      await createProject(project);
      setGenerationStatus("done");
      sessionStorage.removeItem("generation-source");
      navigate(`/editor/${project.id}`);
    } catch {
      setGenerationStatus("error");
    }
  };

  const progress = ((generationStep + 1) / STEPS.length) * 100;

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
        </div>

        <h2 className="text-lg font-bold text-foreground mb-1 text-center">카드뉴스 생성 중</h2>
        <p className="text-xs text-muted-foreground mb-8 text-center">AI가 콘텐츠를 분석하고 있습니다</p>

        {/* Progress bar */}
        <div className="w-full h-1 bg-surface rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const isActive = generationStep === i && generationStatus === "generating";
            const isDone = generationStep > i || generationStatus === "done";
            return (
              <div key={i} className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                isActive && "bg-primary/5"
              )}>
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-all",
                  isDone ? "bg-primary text-primary-foreground" :
                  isActive ? "bg-primary/20 text-primary" :
                  "bg-surface text-muted-foreground"
                )}>
                  {isDone ? <Check className="w-3.5 h-3.5" /> :
                   isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                   i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-sm transition-colors block",
                    isDone ? "text-foreground" :
                    isActive ? "text-primary font-medium" :
                    "text-muted-foreground"
                  )}>{step.label}</span>
                  {isActive && (
                    <span className="text-[10px] text-muted-foreground">{step.desc}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {generationStatus === "error" && (
          <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-center gap-2 text-destructive text-sm mb-3">
              <AlertCircle className="w-4 h-4" />
              생성에 실패했습니다
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { started.current = false; setGenerationStatus("generating"); setGenerationStep(0); }}
                className="px-3 py-1.5 rounded-md bg-destructive/20 text-destructive text-xs hover:bg-destructive/30"
              >
                다시 시도
              </button>
              <button
                onClick={() => navigate("/create")}
                className="px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground"
              >
                돌아가기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
