import { SlideRenderer } from "./SlideRenderer";
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
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

  return (
    <div className="flex flex-col items-center w-full max-w-[300px]">
      {/* Phone frame */}
      <div className="w-full rounded-[28px] border border-border/60 bg-card overflow-hidden shadow-2xl shadow-black/20">
        {/* Notch / status bar */}
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

        {/* Slide content */}
        <div className="relative" style={{ aspectRatio: `${w}/${h}` }}>
          <SlideRenderer slide={slide} width={w} height={h} />

          {/* Nav */}
          {currentIndex > 0 && (
            <button onClick={() => onIndexChange(currentIndex - 1)}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center hover:bg-background/90 transition-colors">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
          )}
          {currentIndex < slides.length - 1 && (
            <button onClick={() => onIndexChange(currentIndex + 1)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center hover:bg-background/90 transition-colors">
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          )}
        </div>

        {/* Social row */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex gap-4">
            <Heart className="w-[22px] h-[22px] text-foreground" />
            <MessageCircle className="w-[22px] h-[22px] text-foreground" />
            <Send className="w-[22px] h-[22px] text-foreground" />
          </div>

          {/* Page dots */}
          <div className="flex gap-[3px] items-center">
            {slides.map((_, i) => (
              <button key={i} onClick={() => onIndexChange(i)}
                className={`rounded-full transition-all ${i === currentIndex ? "w-[6px] h-[6px] bg-primary" : "w-[5px] h-[5px] bg-muted-foreground/30"}`}
              />
            ))}
          </div>

          <Bookmark className="w-[22px] h-[22px] text-foreground" />
        </div>

        {/* Bottom text */}
        <div className="px-3 pb-3">
          <p className="text-[11px] text-foreground"><span className="font-semibold">cardnews_studio</span> <span className="text-muted-foreground">카드뉴스를 확인해보세요</span></p>
        </div>
      </div>

      {/* Slide number below */}
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
