import { Plus, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME_MAP } from "@/lib/themes";
import type { Slide, ThemePreset } from "@/types/project";

interface Props {
  slides: Slide[];
  currentIndex: number;
  onSelect: (i: number) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (from: number, to: number) => void;
  themePreset: ThemePreset;
}

export function SlideStrip({ slides, currentIndex, onSelect, onAdd, onDelete, onDuplicate }: Props) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card overflow-x-auto scrollbar-thin shrink-0">
      {slides.map((slide, i) => {
        const theme = THEME_MAP[slide.themePreset];
        const isActive = i === currentIndex;
        return (
          <div key={slide.id} className="relative group shrink-0">
            <button
              onClick={() => onSelect(i)}
              className={cn(
                "w-14 h-[70px] rounded-lg overflow-hidden border-2 transition-all flex flex-col items-center justify-center",
                isActive ? "border-primary shadow-md shadow-primary/20" : "border-border/50 hover:border-muted-foreground/40"
              )}
              style={{ background: theme.background }}
            >
              <span style={{ color: theme.primaryText, fontSize: "6px", fontWeight: 700, padding: "2px 4px", textAlign: "center", lineHeight: 1.2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as any }}>
                {slide.title}
              </span>
            </button>
            <span className={cn("absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] tabular-nums",
              isActive ? "text-primary font-semibold" : "text-muted-foreground"
            )}>{i + 1}</span>

            {/* Hover actions */}
            <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5">
              <button onClick={(e) => { e.stopPropagation(); onDuplicate(slide.id); }}
                className="w-4 h-4 rounded bg-surface/90 border border-border flex items-center justify-center hover:bg-muted">
                <Copy className="w-2.5 h-2.5 text-muted-foreground" />
              </button>
              {slides.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(slide.id); }}
                  className="w-4 h-4 rounded bg-surface/90 border border-border flex items-center justify-center hover:bg-destructive/20">
                  <Trash2 className="w-2.5 h-2.5 text-destructive" />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Add button */}
      <button onClick={onAdd}
        className="w-14 h-[70px] rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
