import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectStore } from "@/store/useProjectStore";
import { useUiStore } from "@/store/useUiStore";
import { useFontStore } from "@/store/useFontStore";
import { MobilePreview } from "@/components/preview/MobilePreview";
import { SlideForm } from "@/components/editor/SlideForm";
import { ExportDialog } from "@/components/export/ExportDialog";
import { SlideStrip } from "@/components/editor/SlideStrip";
import { AiCommandInput } from "@/components/editor/AiCommandInput";
import { StoryboardPanel } from "@/components/editor/StoryboardPanel";
import TemplateSaveDialog from "@/components/editor/TemplateSaveDialog";
import {
  ArrowLeft, Save, Download, Check, AlertCircle, Loader2, Sparkles,
  Monitor, Square, Smartphone, Clapperboard, BookTemplate
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { debounce } from "@/lib/utils/helpers";
import { supabase } from "@/integrations/supabase/client";
import type { ElementKey, ExportSize } from "@/types/project";

const ARTBOARD_PRESETS: { size: ExportSize; label: string; icon: any; desc: string }[] = [
  { size: "1080x1350", label: "세로형", icon: Smartphone, desc: "4:5" },
  { size: "1080x1080", label: "정방형", icon: Square, desc: "1:1" },
  { size: "1080x1920", label: "스토리", icon: Monitor, desc: "9:16" },
];

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    currentProject, currentSlideIndex, saveStatus,
    openProject, setCurrentSlideIndex, saveCurrentProject,
    updateSlide, addSlide, deleteSlide, moveSlide, duplicateSlide,
    updateExportSize, undo, redo,
  } = useProjectStore();
  const { exportDialogOpen, setExportDialogOpen, selectedElement, setSelectedElement, marginGuide } = useUiStore();
  const [regenerating, setRegenerating] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [showStoryboard, setShowStoryboard] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);

  useEffect(() => { useFontStore.getState().loadFonts(); }, []);

  useEffect(() => {
    if (projectId) openProject(projectId);
  }, [projectId]);

  // Calculate canvas scale for accurate resize
  useEffect(() => {
    if (!currentProject || !previewContainerRef.current) return;
    const [w] = currentProject.exportPreset.size.split("x").map(Number);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const previewWidth = entry.contentRect.width;
        // The mobile preview renders at max ~280px wide inside the phone frame
        setCanvasScale(Math.min(previewWidth * 0.85, 280) / w);
      }
    });
    observer.observe(previewContainerRef.current);
    return () => observer.disconnect();
  }, [currentProject?.exportPreset.size]);

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
      if (e.key === "Escape") setSelectedElement(null);

      if (!selectedElement && !e.metaKey && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "")) {
        if (e.key === "ArrowLeft") setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
        if (e.key === "ArrowRight" && currentProject) setCurrentSlideIndex(Math.min(currentProject.slides.length - 1, currentSlideIndex + 1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentSlideIndex, currentProject, selectedElement]);

  const handleRegenerateSlide = async () => {
    if (!currentProject || regenerating) return;
    setRegenerating(true);
    try {
      const { regenerateSlide } = await import("@/lib/ai/aiService");
      const slide = currentProject.slides[currentSlideIndex];
      const result = await regenerateSlide(
        slide,
        currentProject.title,
        currentProject.slides,
        "rewrite"
      );
      updateSlide(slide.id, result);
      toast.success("슬라이드가 개선되었습니다");
    } catch (e: any) {
      console.error("Regenerate error:", e);
      toast.error(e.message || "슬라이드 개선에 실패했습니다");
    } finally {
      setRegenerating(false);
    }
  };

  const handleAiCommand = useCallback(async (instruction: string, mode: "slide" | "project") => {
    if (!currentProject || aiProcessing) return;
    setAiProcessing(true);
    try {
      if (mode === "slide") {
        const { regenerateSlide } = await import("@/lib/ai/aiService");
        const slide = currentProject.slides[currentSlideIndex];
        const result = await regenerateSlide(slide, currentProject.title, currentProject.slides, "improve", instruction);
        updateSlide(slide.id, result);
        toast.success("슬라이드가 수정되었습니다");
      } else {
        const { rewriteProject } = await import("@/lib/ai/aiService");
        const result = await rewriteProject(currentProject.title, currentProject.slides, instruction);
        // Update each slide with new content, preserving ids and style
        result.slides.forEach((newSlide, i) => {
          if (i < currentProject.slides.length) {
            updateSlide(currentProject.slides[i].id, newSlide);
          }
        });
        toast.success("프로젝트가 재구성되었습니다");
      }
    } catch (e: any) {
      console.error("AI command error:", e);
      toast.error(e.message || "AI 처리에 실패했습니다");
    } finally {
      setAiProcessing(false);
    }
  }, [currentProject, currentSlideIndex, updateSlide, aiProcessing]);

  const handleElementSelect = useCallback((key: ElementKey | null) => {
    setSelectedElement(key);
  }, [setSelectedElement]);

  const handleUpdateElementOffset = useCallback((key: ElementKey, dx: number, dy: number) => {
    if (!currentProject) return;
    const slide = currentProject.slides[currentSlideIndex];
    const current = slide.elementOverrides?.[key] || {};
    // dx/dy are already clamped by CanvasOverlay based on actual DOM positions
    const newX = (current.offsetX || 0) + dx;
    const newY = (current.offsetY || 0) + dy;
    updateSlide(slide.id, {
      elementOverrides: {
        ...slide.elementOverrides,
        [key]: { ...current, offsetX: newX, offsetY: newY },
      },
    });
  }, [currentProject, currentSlideIndex, updateSlide]);

  const handleResizeElement = useCallback((key: ElementKey, dw: number, dh: number, handle: string) => {
    if (!currentProject) return;
    const slide = currentProject.slides[currentSlideIndex];
    const typo = slide.typography || {};

    // dw/dh are already in content-space coordinates (scaled by CanvasOverlay)
    if (key === "image") {
      const img = slide.image || { mode: "upload" as const, url: "" };
      const currentScale = img.scale ?? 1;
      const delta = (handle.includes("e") || handle.includes("w")) ? dw * 0.002 : dh * 0.002;
      updateSlide(slide.id, { image: { ...img, scale: Math.max(1, Math.min(3, currentScale + delta)) } });
      return;
    }

    // Logo resize: adjust logo.width directly
    if (key === "logo") {
      const logo = slide.logo;
      if (!logo) return;
      const currentW = logo.width ?? 60;
      const delta = (handle.includes("e") || handle.includes("w")) ? dw : dh;
      const newW = Math.max(20, Math.min(300, Math.round(currentW + delta)));
      if (newW !== currentW) {
        updateSlide(slide.id, { logo: { ...logo, width: newW } });
      }
      return;
    }

    const sizeMap: Record<string, { field: string; fallback: number; min: number; max: number }> = {
      title:       { field: "titleSize",       fallback: 28, min: 14, max: 80 },
      highlight:   { field: "highlightSize",   fallback: typo.bodySize ?? 16, min: 10, max: 80 },
      subtitle:    { field: "subtitleSize",     fallback: (typo.bodySize ?? 16) + 2, min: 10, max: 60 },
      category:    { field: "categorySize",     fallback: 12, min: 8, max: 48 },
      body:        { field: "bodySize",          fallback: 16, min: 8, max: 60 },
      bullets:     { field: "bulletSize",        fallback: (typo.bodySize ?? 16) - 1, min: 8, max: 48 },
      cta:         { field: "ctaSize",           fallback: typo.bodySize ?? 16, min: 10, max: 80 },
      sourceLabel: { field: "sourceLabelSize",   fallback: 11, min: 8, max: 36 },
    };

    const cfg = sizeMap[key];
    const isHorizontal = handle.includes("e") || handle.includes("w");
    const isVertical = handle.includes("n") || handle.includes("s");
    const updates: any = {};

    // Horizontal resize => per-element box width (independent from text size)
    if (isHorizontal) {
      const [canvasW] = currentProject.exportPreset.size.split("x").map(Number);
      const currentOverride = slide.elementOverrides?.[key] || {};
      const currentWidth = currentOverride.boxWidth ?? 100;
      const deltaPct = (dw / canvasW) * 100;
      const nextWidth = Math.max(10, Math.min(100, Math.round(currentWidth + deltaPct)));

      if (nextWidth !== currentWidth) {
        updates.elementOverrides = {
          ...slide.elementOverrides,
          [key]: { ...currentOverride, boxWidth: nextWidth },
        };
      }
    }

    // Vertical resize (or corner handles) => font size
    if (cfg && (!isHorizontal || isVertical)) {
      const currentSize = (typo as any)[cfg.field] ?? cfg.fallback;
      const rawDelta = dh * 0.5;
      const delta = Math.round(rawDelta);

      if (delta !== 0) {
        const newSize = Math.max(cfg.min, Math.min(cfg.max, currentSize + delta));
        updates.typography = { ...typo, [cfg.field]: newSize };
      }
    }

    if (Object.keys(updates).length > 0) {
      updateSlide(slide.id, updates);
    }
  }, [currentProject, currentSlideIndex, updateSlide]);

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
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card shrink-0">
        {/* Left: Back + Title */}
        <button onClick={() => navigate("/dashboard")} className="p-1.5 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground" title="작업 목록">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate max-w-[180px]">{currentProject.title}</h2>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {saveStatus === "saved" && <span className="flex items-center gap-0.5 text-success"><Check className="w-3 h-3" /></span>}
            {saveStatus === "saving" && <Loader2 className="w-3 h-3 animate-spin" />}
          </span>
        </div>

        {/* Center: Artboard + Slide counter */}
        <div className="flex items-center gap-2 mx-auto">
          <div className="flex items-center gap-0.5 p-0.5 bg-surface rounded-lg">
            {ARTBOARD_PRESETS.map(preset => (
              <button key={preset.size} onClick={() => updateExportSize(preset.size)}
                title={`${preset.label} (${preset.desc})`}
                className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                  currentProject.exportPreset.size === preset.size
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}>
                <preset.icon className="w-3 h-3" />
                <span className="hidden lg:inline">{preset.desc}</span>
              </button>
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums font-medium">
            {currentSlideIndex + 1} / {totalSlides}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={handleRegenerateSlide} disabled={regenerating}
            title="현재 슬라이드 AI 개선"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-surface hover:bg-muted text-foreground border border-border disabled:opacity-50 transition-all">
            {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
            <span className="hidden xl:inline">다시 생성</span>
          </button>
          <button onClick={() => setShowStoryboard(!showStoryboard)}
            className={cn("p-1.5 rounded-lg text-xs border transition-all",
              showStoryboard ? "bg-primary text-primary-foreground border-primary" : "bg-surface hover:bg-muted text-foreground border-border"
            )} title="숏폼 스토리보드">
            <Clapperboard className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { saveCurrentProject(); toast.success("저장되었습니다"); }}
            className="p-1.5 rounded-lg bg-surface hover:bg-muted text-foreground border border-border transition-all" title="저장">
            <Save className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setTemplateDialogOpen(true)}
            className="p-1.5 rounded-lg bg-surface hover:bg-muted text-foreground border border-border transition-all" title="템플릿 저장">
            <BookTemplate className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button onClick={() => setExportDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all">
            <Download className="w-3.5 h-3.5" /> 내보내기
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <SlideStrip
            slides={currentProject.slides}
            currentIndex={currentSlideIndex}
            onSelect={setCurrentSlideIndex}
            onAdd={() => addSlide()}
            onDelete={(id) => { deleteSlide(id); toast.success("삭제됨"); }}
            onDuplicate={(id) => duplicateSlide(id)}
            onMove={moveSlide}
            themePreset={currentProject.themePreset}
          />

          <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-primary uppercase">{currentSlide.type}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{currentSlideIndex + 1} / {totalSlides}</span>
            </div>
            {selectedElement && (
              <div className="flex items-center gap-1">
                <span className="text-[9px] bg-primary/15 text-primary px-2 py-0.5 rounded font-medium">{selectedElement} 선택됨</span>
                <button onClick={() => setSelectedElement(null)} className="text-[9px] text-muted-foreground hover:text-foreground">ESC</button>
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-b border-border shrink-0">
            <AiCommandInput
              onSubmit={handleAiCommand}
              isProcessing={aiProcessing}
              slideTitle={currentSlide.title}
            />
          </div>

          <div className="flex-1 overflow-auto p-4 scrollbar-thin">
            <SlideForm
              slide={currentSlide}
              onUpdate={(updates) => updateSlide(currentSlide.id, updates)}
              projectTheme={currentProject.themePreset}
              selectedElement={selectedElement}
              onSelectElement={handleElementSelect}
              exportSize={currentProject.exportPreset.size}
            />
          </div>
        </div>

        {/* Right: Preview or Storyboard */}
        {showStoryboard ? (
          <div className="w-[380px] shrink-0 overflow-hidden">
            <StoryboardPanel
              projectTitle={currentProject.title}
              slides={currentProject.slides}
              onClose={() => setShowStoryboard(false)}
            />
          </div>
        ) : (
          <div ref={previewContainerRef} className="w-[380px] shrink-0 border-l border-border bg-background flex items-center justify-center p-6 overflow-hidden">
            <MobilePreview
              slides={currentProject.slides}
              currentIndex={currentSlideIndex}
              onIndexChange={setCurrentSlideIndex}
              exportSize={currentProject.exportPreset.size}
              onElementSelect={handleElementSelect}
              onUpdateElementOffset={handleUpdateElementOffset}
              onResizeElement={handleResizeElement}
              canvasScale={canvasScale}
            />
          </div>
        )}
      </div>

      {exportDialogOpen && (
        <ExportDialog
          project={currentProject}
          currentSlideIndex={currentSlideIndex}
          onClose={() => setExportDialogOpen(false)}
        />
      )}

      <TemplateSaveDialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        saving={templateSaving}
        onSave={async (name, description) => {
          setTemplateSaving(true);
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { toast.error("로그인이 필요합니다"); return; }
            const { error } = await supabase.from("card_templates").insert({
              user_id: user.id,
              name,
              description: description || null,
              slides: currentProject.slides as any,
              theme_preset: currentProject.themePreset,
              source_type: currentProject.sourceType,
            });
            if (error) throw error;
            toast.success("템플릿이 저장되었습니다");
            setTemplateDialogOpen(false);
          } catch (e: any) {
            console.error("Template save error:", e);
            toast.error("템플릿 저장에 실패했습니다");
          } finally {
            setTemplateSaving(false);
          }
        }}
      />
    </div>
  );
}
