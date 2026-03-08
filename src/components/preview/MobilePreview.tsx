import { useRef, useCallback } from "react";
import { SlideRenderer } from "./SlideRenderer";
import { CanvasOverlay } from "@/components/canvas/CanvasOverlay";
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Grid3X3, Shield, Ruler } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/useUiStore";
import type { Slide, ExportSize, ElementKey, ElementOverride } from "@/types/project";

interface Props {
  slides: Slide[];
  currentIndex: number;
  onIndexChange: (i: number) => void;
  exportSize: ExportSize;
  onElementSelect?: (key: ElementKey | null) => void;
  onUpdateElementOffset?: (key: ElementKey, dx: number, dy: number) => void;
}

export function MobilePreview({ slides, currentIndex, onIndexChange, exportSize, onElementSelect, onUpdateElementOffset }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedElement, setSelectedElement, showGrid, showSafeArea, showRuler, gridSize, toggleGrid, toggleSafeArea, toggleRuler } = useUiStore();

  const handleElementSelect = useCallback((key: ElementKey | null) => {
    setSelectedElement(key);
    onElementSelect?.(key);
  }, [setSelectedElement, onElementSelect]);

  const handleUpdateOffset = useCallback((key: ElementKey, dx: number, dy: number) => {
    onUpdateElementOffset?.(key, dx, dy);
  }, [onUpdateElementOffset]);

  const slide = slides[currentIndex];
  if (!slide) return null;

  const [w, h] = exportSize.split("x").map(Number);

  const handleElementSelect = useCallback((key: ElementKey | null) => {
    setSelectedElement(key);
    onElementSelect?.(key);
  }, [setSelectedElement, onElementSelect]);

  const handleUpdateOffset = useCallback((key: ElementKey, dx: number, dy: number) => {
    onUpdateElementOffset?.(key, dx, dy);
  }, [onUpdateElementOffset]);

  const lockedMap: Record<string, boolean> = {};
  if (slide.elementOverrides) {
    Object.entries(slide.elementOverrides).forEach(([k, v]) => {
      if (v?.locked) lockedMap[k] = true;
    });
  }

  return (
    <div className="flex flex-col items-center w-full max-w-[320px]">
      {/* Canvas controls */}
      <div className="flex items-center gap-1 mb-2 w-full justify-center">
        <button onClick={toggleGrid} className={cn("p-1.5 rounded-md text-[10px] transition-all", showGrid ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-surface")}>
          <Grid3X3 className="w-3.5 h-3.5" />
        </button>
        <button onClick={toggleSafeArea} className={cn("p-1.5 rounded-md text-[10px] transition-all", showSafeArea ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-surface")}>
          <Shield className="w-3.5 h-3.5" />
        </button>
        <button onClick={toggleRuler} className={cn("p-1.5 rounded-md text-[10px] transition-all", showRuler ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-surface")}>
          <Ruler className="w-3.5 h-3.5" />
        </button>
        {selectedElement && (
          <span className="text-[9px] text-primary font-semibold ml-2 bg-primary/10 px-2 py-0.5 rounded">{selectedElement}</span>
        )}
      </div>

      {/* Phone frame */}
      <div className="w-full rounded-[28px] border border-border/60 bg-card overflow-hidden shadow-2xl shadow-black/20">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 py-2 bg-card">
          <span className="text-[10px] text-muted-foreground font-medium">9:41</span>
          <div className="w-20 h-5 rounded-full bg-background/80" />
          <div className="flex gap-1 items-center">
            <div className="w-4 h-2.5 rounded-sm border border-muted-foreground/40" />
          </div>
        </div>

        {/* Profile row */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border border-border" />
          <div className="flex-1">
            <span className="text-[11px] font-semibold text-foreground">cardnews_studio</span>
          </div>
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Slide content with overlay */}
        <div ref={containerRef} className="relative" style={{ aspectRatio: `${w}/${h}` }}>
          {/* Ruler */}
          {showRuler && (
            <>
              <div className="absolute top-0 left-0 right-0 h-3 bg-surface/80 z-20 flex items-end pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="flex-1 border-r border-muted-foreground/20 relative">
                    {i % 5 === 0 && <span className="absolute bottom-0 left-0 text-[6px] text-muted-foreground/40">{i * 5}</span>}
                  </div>
                ))}
              </div>
              <div className="absolute top-0 left-0 bottom-0 w-3 bg-surface/80 z-20 flex flex-col pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="flex-1 border-b border-muted-foreground/20 relative">
                    {i % 5 === 0 && <span className="absolute left-0 top-0 text-[6px] text-muted-foreground/40 writing-mode-vertical" style={{ writingMode: "vertical-lr" }}>{i * 5}</span>}
                  </div>
                ))}
              </div>
            </>
          )}

          <SlideRenderer
            slide={slide}
            width={w}
            height={h}
            selectedElement={selectedElement}
            onElementClick={handleElementSelect}
          />

          <CanvasOverlay
            containerRef={containerRef as React.RefObject<HTMLDivElement>}
            selectedElement={selectedElement}
            onSelectElement={handleElementSelect}
            onUpdateOffset={handleUpdateOffset}
            showGrid={showGrid}
            showSafeArea={showSafeArea}
            gridSize={gridSize}
            locked={lockedMap}
          />
        </div>

        {/* Social row */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex gap-4">
            <Heart className="w-[22px] h-[22px] text-foreground" />
            <MessageCircle className="w-[22px] h-[22px] text-foreground" />
            <Send className="w-[22px] h-[22px] text-foreground" />
          </div>
          <div className="flex gap-[3px] items-center">
            {slides.map((_, i) => (
              <button key={i} onClick={() => onIndexChange(i)}
                className={`rounded-full transition-all ${i === currentIndex ? "w-[6px] h-[6px] bg-primary" : "w-[5px] h-[5px] bg-muted-foreground/30"}`}
              />
            ))}
          </div>
          <Bookmark className="w-[22px] h-[22px] text-foreground" />
        </div>

        <div className="px-3 pb-3">
          <p className="text-[11px] text-foreground"><span className="font-semibold">cardnews_studio</span> <span className="text-muted-foreground">카드뉴스를 확인해보세요</span></p>
        </div>
      </div>

      {/* Slide number */}
      <div className="flex items-center gap-2 mt-3">
        <button onClick={() => onIndexChange(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-muted-foreground tabular-nums">{currentIndex + 1} / {slides.length}</span>
        <button onClick={() => onIndexChange(Math.min(slides.length - 1, currentIndex + 1))} disabled={currentIndex === slides.length - 1}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
