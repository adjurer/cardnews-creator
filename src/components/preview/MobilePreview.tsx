import { SlideRenderer } from "./SlideRenderer";
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import type { Slide, ExportSize } from "@/types/project";

interface Props {
  slides: Slide[];
  currentIndex: number;
  onIndexChange: (i: number) => void;
  exportSize: ExportSize;
}

export function MobilePreview({ slides, currentIndex, onIndexChange, exportSize }: Props) {
  const slide = slides[currentIndex];
  if (!slide) return null;

  const [w, h] = exportSize.split("x").map(Number);
  const aspect = w / h;

  return (
    <div className="flex flex-col items-center w-full max-w-[280px]">
      {/* Phone frame */}
      <div className="w-full rounded-[24px] border-2 border-border bg-card overflow-hidden shadow-xl">
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-card">
          <span className="text-[10px] text-muted-foreground font-medium">9:41</span>
          <div className="flex gap-1">
            <div className="w-3.5 h-2 rounded-sm bg-muted-foreground/40" />
            <div className="w-1.5 h-2 rounded-sm bg-muted-foreground/40" />
          </div>
        </div>

        {/* Profile row */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <div className="w-7 h-7 rounded-full bg-surface" />
          <span className="text-[11px] font-medium text-foreground">cardnews_studio</span>
        </div>

        {/* Slide content */}
        <div className="relative" style={{ aspectRatio: `${w}/${h}` }}>
          <SlideRenderer slide={slide} width={w} height={h} />

          {/* Nav arrows */}
          {currentIndex > 0 && (
            <button onClick={() => onIndexChange(currentIndex - 1)}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background/60 flex items-center justify-center">
              <ChevronLeft className="w-3.5 h-3.5 text-foreground" />
            </button>
          )}
          {currentIndex < slides.length - 1 && (
            <button onClick={() => onIndexChange(currentIndex + 1)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background/60 flex items-center justify-center">
              <ChevronRight className="w-3.5 h-3.5 text-foreground" />
            </button>
          )}
        </div>

        {/* Social actions */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex gap-3">
            <Heart className="w-5 h-5 text-foreground" />
            <MessageCircle className="w-5 h-5 text-foreground" />
            <Send className="w-5 h-5 text-foreground" />
          </div>
          <Bookmark className="w-5 h-5 text-foreground" />
        </div>

        {/* Page dots */}
        <div className="flex justify-center gap-1 pb-3">
          {slides.map((_, i) => (
            <button key={i} onClick={() => onIndexChange(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? "bg-primary w-3" : "bg-muted-foreground/40"}`}
            />
          ))}
        </div>
      </div>

      {/* Slide number */}
      <span className="text-xs text-muted-foreground mt-3">{currentIndex + 1} / {slides.length}</span>
    </div>
  );
}
