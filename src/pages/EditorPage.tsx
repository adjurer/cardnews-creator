import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectStore } from "@/store/useProjectStore";
import { useUiStore } from "@/store/useUiStore";
import { MobilePreview } from "@/components/preview/MobilePreview";
import { SlideForm } from "@/components/editor/SlideForm";
import { ExportDialog } from "@/components/export/ExportDialog";
import { regenerateSlide } from "@/lib/ai/aiService";
import {
  ArrowLeft, Save, RefreshCw, Download, ChevronLeft, ChevronRight,
  Plus, Trash2, Copy, MoveUp, MoveDown, Check, AlertCircle, Loader2, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { debounce } from "@/lib/utils/helpers";

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    currentProject, currentSlideIndex, saveStatus,
    openProject, setCurrentSlideIndex, saveCurrentProject,
    updateSlide, addSlide, deleteSlide, moveSlide, duplicateSlide,
    undo, redo,
  } = useProjectStore();
  const { exportDialogOpen, setExportDialogOpen } = useUiStore();
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (projectId) openProject(projectId);
  }, [projectId]);

  const debouncedSave = useCallback(
    debounce(() => { saveCurrentProject(); }, 1000),
    [saveCurrentProject]
  );

  useEffect(() => {
    if (currentProject && saveStatus === "idle") debouncedSave();
  }, [currentProject?.slides]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "s") { e.preventDefault(); saveCurrentProject(); toast.success("저장되었습니다"); }
        if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
        if (e.key === "z" && e.shiftKey) { e.preventDefault(); redo(); }
        if (e.key === "e") { e.preventDefault(); setExportDialogOpen(true); }
      }
      if (e.key === "ArrowLeft" && !e.metaKey && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "")) {
        setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
      }
      if (e.key === "ArrowRight" && !e.metaKey && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "")) {
        if (currentProject) setCurrentSlideIndex(Math.min(currentProject.slides.length - 1, currentSlideIndex + 1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentSlideIndex, currentProject]);

  const handleRegenerateSlide = async () => {
    if (!currentProject || regenerating) return;
    const slide = currentProject.slides[currentSlideIndex];
    setRegenerating(true);
    try {
      const updates = await regenerateSlide(
        slide,
        currentProject.title,
        currentProject.slides,
        "rewrite"
      );
      updateSlide(slide.id, updates);
      toast.success("슬라이드가 다시 생성되었습니다");
    } catch (e: any) {
      toast.error(e.message || "슬라이드 재생성에 실패했습니다");
    } finally {
      setRegenerating(false);
    }
  };

  const handleRegenerateAll = () => {
    // Re-generate entire project by going back to creation flow
    if (!currentProject) return;
    const source = {
      sourceType: currentProject.sourceType,
      content: currentProject.sourceInput || currentProject.slides.map(s => `${s.title}. ${s.body || ""}`).join("\n"),
      title: currentProject.title,
    };
    sessionStorage.setItem("generation-source", JSON.stringify(source));
    useProjectStore.getState().setGenerationStatus("generating");
    useProjectStore.getState().setGenerationStep(0);
    navigate("/generate");
  };

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">프로젝트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const currentSlide = currentProject.slides[currentSlideIndex];
  const totalSlides = currentProject.slides.length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card shrink-0">
        <button onClick={() => navigate("/dashboard")} className="p-1.5 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-medium text-foreground truncate max-w-[180px]">{currentProject.title}</h2>

        <span className="text-[10px] text-muted-foreground ml-1">
          {saveStatus === "saved" && <span className="flex items-center gap-1 text-success"><Check className="w-3 h-3" />저장됨</span>}
          {saveStatus === "saving" && "저장 중..."}
          {saveStatus === "error" && <span className="text-destructive">저장 실패</span>}
        </span>

        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => { saveCurrentProject(); toast.success("저장되었습니다"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-surface hover:bg-muted text-foreground border border-border">
            <Save className="w-3.5 h-3.5" /> 저장
          </button>
          <button onClick={handleRegenerateAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-surface hover:bg-muted text-foreground border border-border">
            <RefreshCw className="w-3.5 h-3.5" /> 다시 생성
          </button>
          <button onClick={() => setExportDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground hover:opacity-90">
            <Download className="w-3.5 h-3.5" /> 내보내기 (PNG)
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="flex-1 overflow-auto p-4 scrollbar-thin">
          {/* Slide nav */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">{currentSlide.type}</span>
              <button onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))} disabled={currentSlideIndex === 0}
                className="p-1 rounded-md hover:bg-surface text-muted-foreground disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-foreground tabular-nums">{currentSlideIndex + 1} / {totalSlides}</span>
              <button onClick={() => setCurrentSlideIndex(Math.min(totalSlides - 1, currentSlideIndex + 1))} disabled={currentSlideIndex === totalSlides - 1}
                className="p-1 rounded-md hover:bg-surface text-muted-foreground disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={() => addSlide()} title="추가" className="p-1.5 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => duplicateSlide(currentSlide.id)} title="복제" className="p-1.5 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground">
                <Copy className="w-3.5 h-3.5" />
              </button>
              {currentSlideIndex > 0 && (
                <button onClick={() => moveSlide(currentSlideIndex, currentSlideIndex - 1)} title="위로" className="p-1.5 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground">
                  <MoveUp className="w-3.5 h-3.5" />
                </button>
              )}
              {currentSlideIndex < totalSlides - 1 && (
                <button onClick={() => moveSlide(currentSlideIndex, currentSlideIndex + 1)} title="아래로" className="p-1.5 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground">
                  <MoveDown className="w-3.5 h-3.5" />
                </button>
              )}
              {totalSlides > 1 && (
                <button onClick={() => { deleteSlide(currentSlide.id); toast.success("삭제됨"); }} title="삭제"
                  className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Form */}
          <SlideForm
            slide={currentSlide}
            onUpdate={(updates) => updateSlide(currentSlide.id, updates)}
            projectTheme={currentProject.themePreset}
          />

          {/* Bottom actions */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <button
              onClick={handleRegenerateSlide}
              disabled={regenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface border border-border disabled:opacity-50"
            >
              {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              슬라이드 개선
            </button>
            {totalSlides > 1 && (
              <button onClick={() => { deleteSlide(currentSlide.id); toast.success("삭제됨"); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" /> 슬라이드 삭제
              </button>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="w-[360px] shrink-0 border-l border-border bg-background flex items-center justify-center p-6 overflow-hidden">
          <MobilePreview
            slides={currentProject.slides}
            currentIndex={currentSlideIndex}
            onIndexChange={setCurrentSlideIndex}
            exportSize={currentProject.exportPreset.size}
          />
        </div>
      </div>

      {exportDialogOpen && (
        <ExportDialog
          project={currentProject}
          currentSlideIndex={currentSlideIndex}
          onClose={() => setExportDialogOpen(false)}
        />
      )}
    </div>
  );
}
