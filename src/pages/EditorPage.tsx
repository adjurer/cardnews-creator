import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectStore } from "@/store/useProjectStore";
import { useUiStore, MARGIN_VALUES } from "@/store/useUiStore";
import { useFontStore } from "@/store/useFontStore";
import { MobilePreview } from "@/components/preview/MobilePreview";
import { SlideForm } from "@/components/editor/SlideForm";
import { ExportDialog } from "@/components/export/ExportDialog";
import { SlideStrip } from "@/components/editor/SlideStrip";
import {
  ArrowLeft, Save, Download, Check, AlertCircle, Loader2, Sparkles,
  Monitor, Square, Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { debounce } from "@/lib/utils/helpers";
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
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);

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
    await new Promise(r => setTimeout(r, 1000));
    const slide = currentProject.slides[currentSlideIndex];
    updateSlide(slide.id, { title: slide.title + " (개선됨)" });
    toast.success("슬라이드가 개선되었습니다");
    setRegenerating(false);
  };

  const handleElementSelect = useCallback((key: ElementKey | null) => {
    setSelectedElement(key);
  }, [setSelectedElement]);

  const handleUpdateElementOffset = useCallback((key: ElementKey, dx: number, dy: number) => {
    if (!currentProject) return;
    const slide = currentProject.slides[currentSlideIndex];
    const current = slide.elementOverrides?.[key] || {};
    const newX = (current.offsetX || 0) + dx;
    const newY = (current.offsetY || 0) + dy;

    // Calculate max offset based on actual preview dimensions
    const [w, h] = currentProject.exportPreset.size.split("x").map(Number);
    const previewW = w * canvasScale;
    const previewH = h * canvasScale;
    const marginFraction = MARGIN_VALUES[marginGuide] / 100;

    // Allow movement within the slide area minus margin
    // Elements start at their natural CSS position, offset shifts from there
    // Limit to ~45% of preview size (minus margin) so elements stay visible
    const maxFractionX = marginGuide === "none" ? 0.45 : Math.max(0.1, 0.45 - marginFraction);
    const maxFractionY = marginGuide === "none" ? 0.45 : Math.max(0.1, 0.45 - marginFraction);
    const maxOffsetX = previewW * maxFractionX;
    const maxOffsetY = previewH * maxFractionY;

    const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newX));
    const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newY));
    updateSlide(slide.id, {
      elementOverrides: {
        ...slide.elementOverrides,
        [key]: { ...current, offsetX: clampedX, offsetY: clampedY },
      },
    });
  }, [currentProject, currentSlideIndex, updateSlide, marginGuide, canvasScale]);

  const handleResizeElement = useCallback((key: ElementKey, dw: number, dh: number, handle: string) => {
    if (!currentProject) return;
    const slide = currentProject.slides[currentSlideIndex];
    const typo = slide.typography || {};

    // dw/dh are already in content-space coordinates (scaled by CanvasOverlay)
    if (key === "image") {
      const img = slide.image || { mode: "upload" as const, url: "" };
      const currentScale = img.scale ?? 1;
      const delta = (handle.includes("e") || handle.includes("w")) ? dw * 0.002 : dh * 0.002;
      updateSlide(slide.id, { image: { ...img, scale: Math.max(0.3, Math.min(3, currentScale + delta)) } });
    } else if (key === "title" || key === "highlight" || key === "subtitle" || key === "category") {
      const currentSize = typo.titleSize ?? 28;
      // Use vertical delta for font size, ~1px font change per 2px content-space drag
      const delta = Math.round(dh * 0.5);
      if (delta !== 0) {
        const newSize = Math.max(12, Math.min(72, currentSize + delta));
        updateSlide(slide.id, { typography: { ...typo, titleSize: newSize } });
      }
    } else {
      const currentSize = typo.bodySize ?? 16;
      const delta = Math.round(dh * 0.5);
      if (delta !== 0) {
        const newSize = Math.max(8, Math.min(40, currentSize + delta));
        updateSlide(slide.id, { typography: { ...typo, bodySize: newSize } });
      }
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
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card shrink-0">
        <button onClick={() => navigate("/dashboard")} className="p-1.5 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-medium text-foreground truncate max-w-[200px]">{currentProject.title}</h2>

        <span className="text-[10px] text-muted-foreground ml-1">
          {saveStatus === "saved" && <span className="flex items-center gap-1 text-success"><Check className="w-3 h-3" />저장됨</span>}
          {saveStatus === "saving" && "저장 중..."}
          {saveStatus === "error" && <span className="text-destructive">저장 실패</span>}
        </span>

        {/* Artboard preset switcher */}
        <div className="flex items-center gap-0.5 ml-3 p-0.5 bg-surface rounded-lg">
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

        <div className="flex items-center gap-1 ml-auto">
          <button onClick={handleRegenerateSlide} disabled={regenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-surface hover:bg-muted text-foreground border border-border disabled:opacity-50">
            {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI 개선
          </button>
          <button onClick={() => { saveCurrentProject(); toast.success("저장되었습니다"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-surface hover:bg-muted text-foreground border border-border">
            <Save className="w-3.5 h-3.5" /> 저장
          </button>
          <button onClick={() => setExportDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground hover:opacity-90">
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

          <div className="flex-1 overflow-auto p-4 scrollbar-thin">
            <SlideForm
              slide={currentSlide}
              onUpdate={(updates) => updateSlide(currentSlide.id, updates)}
              projectTheme={currentProject.themePreset}
              selectedElement={selectedElement}
              onSelectElement={handleElementSelect}
            />
          </div>
        </div>

        {/* Right: Preview */}
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
