import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "@/store/useProjectStore";
import { generateCardNews } from "@/lib/ai/aiService";
import { generateId } from "@/lib/utils/helpers";
import { MOCK_EXAMPLES } from "@/mocks/data";
import { Check, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project, SourceType } from "@/types/project";

const STEPS = [
  { label: "카드뉴스 기획", desc: "소스를 분석하고 구조를 설계합니다" },
  { label: "카피 작성", desc: "AI가 슬라이드 텍스트를 생성합니다" },
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
      setGenerationStep(0);

      // For "example" source type, use mock data directly
      if (source.sourceType === "example") {
        const ex = MOCK_EXAMPLES.find(e => e.title === source.title);
        if (ex) {
          await new Promise(r => setTimeout(r, 800));
          setGenerationStep(1);
          await new Promise(r => setTimeout(r, 500));

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

      // Real AI generation
      const result = await generateCardNews(
        source.sourceType as SourceType,
        source.content,
        source.title
      );

      setGenerationStep(1);
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

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {STEPS.map((step, i) => {
            const isActive = generationStep === i && generationStatus !== "done" && generationStatus !== "error";
            const isDone = generationStep > i || generationStatus === "done";
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isDone ? "bg-primary text-primary-foreground" : isActive ? "bg-primary/20 text-primary border-2 border-primary" : "bg-surface text-muted-foreground border border-border"
                  )}>
                    {isDone ? <Check className="w-4 h-4" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-xs">{i + 1}</span>}
                  </div>
                  <span className={cn("text-[11px] font-medium", isDone || isActive ? "text-primary" : "text-muted-foreground")}>{step.label}</span>
                  <span className={cn("text-[9px]", isActive ? "text-muted-foreground" : "text-transparent")}>{isDone ? "완료" : isActive ? step.desc : ""}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("w-12 h-0.5 rounded-full mb-8", isDone ? "bg-primary" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>

        <div className="w-full h-1 bg-surface rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>

        {generationStatus !== "error" && (
          <button onClick={() => { navigate("/create"); setGenerationStatus("idle"); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mx-auto">
            ✕ 취소
          </button>
        )}

        {generationStatus === "error" && (
          <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
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
