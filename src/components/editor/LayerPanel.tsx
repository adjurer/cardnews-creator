import { useState, useRef, useCallback } from "react";
import { Eye, EyeOff, Lock, Unlock, GripVertical, Type, Image as ImageIcon, Tag, Quote, ListOrdered, MousePointer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Slide, ElementKey, ElementOverride } from "@/types/project";

interface Props {
  slide: Slide;
  selectedElement: ElementKey | null;
  onSelectElement: (key: ElementKey | null) => void;
  onUpdateOverride: (key: ElementKey, updates: Partial<ElementOverride>) => void;
}

const ELEMENT_DEFS: { key: ElementKey; label: string; icon: any; getContent: (s: Slide) => string | undefined }[] = [
  { key: "logo", label: "로고", icon: ImageIcon, getContent: s => s.logo?.url ? "로고" : undefined },
  { key: "image", label: "이미지", icon: ImageIcon, getContent: s => s.image?.url ? "이미지" : undefined },
  { key: "category", label: "카테고리", icon: Tag, getContent: s => s.category },
  { key: "highlight", label: "하이라이트", icon: Tag, getContent: s => s.highlight },
  { key: "title", label: "제목", icon: Type, getContent: s => s.title },
  { key: "subtitle", label: "부제목", icon: Type, getContent: s => s.subtitle },
  { key: "body", label: "본문", icon: Type, getContent: s => s.body },
  { key: "bullets", label: "목록", icon: ListOrdered, getContent: s => s.bullets?.length ? `${s.bullets.length}개 항목` : undefined },
  { key: "cta", label: "CTA", icon: MousePointer, getContent: s => s.cta },
  { key: "sourceLabel", label: "출처", icon: Quote, getContent: s => s.sourceLabel },
];

export function LayerPanel({ slide, selectedElement, onSelectElement, onUpdateOverride }: Props) {
  const overrides = slide.elementOverrides || {};
  const [dragKey, setDragKey] = useState<ElementKey | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const visibleElements = ELEMENT_DEFS.filter(e => {
    const content = e.getContent(slide);
    return content !== undefined && content !== "";
  });

  // Sort by zIndex descending (higher = top of list)
  const sorted = [...visibleElements].sort((a, b) => {
    const zA = overrides[a.key]?.zIndex ?? 0;
    const zB = overrides[b.key]?.zIndex ?? 0;
    return zB - zA;
  });

  const handleDragStart = useCallback((key: ElementKey) => {
    setDragKey(key);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropIdx(idx);
  }, []);

  const handleDrop = useCallback((targetIdx: number) => {
    if (dragKey === null) return;
    const fromIdx = sorted.findIndex(e => e.key === dragKey);
    if (fromIdx === targetIdx || fromIdx < 0) {
      setDragKey(null);
      setDropIdx(null);
      return;
    }

    // Reorder the array
    const newOrder = [...sorted];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(targetIdx, 0, moved);

    // Assign new zIndex values: top of list gets highest
    newOrder.forEach((el, i) => {
      const newZ = (newOrder.length - 1 - i) * 10;
      onUpdateOverride(el.key, { zIndex: newZ });
    });

    setDragKey(null);
    setDropIdx(null);
  }, [dragKey, sorted, onUpdateOverride]);

  const handleDragEnd = useCallback(() => {
    setDragKey(null);
    setDropIdx(null);
  }, []);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">레이어</span>
        <span className="text-[9px] text-muted-foreground">{sorted.length}개 요소</span>
      </div>
      <div ref={listRef}>
        {sorted.map((el, idx) => {
          const ovr = overrides[el.key] || {};
          const isSelected = selectedElement === el.key;
          const isHidden = ovr.hidden;
          const isLocked = ovr.locked;
          const isDragging = dragKey === el.key;
          const isDropTarget = dropIdx === idx && dragKey !== el.key;
          const Icon = el.icon;

          return (
            <div
              key={el.key}
              draggable
              onDragStart={() => handleDragStart(el.key)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectElement(isSelected ? null : el.key)}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all group text-[11px] border border-transparent",
                isSelected ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface hover:text-foreground",
                isHidden && "opacity-40",
                isDragging && "opacity-30",
                isDropTarget && "border-primary/50 bg-primary/5"
              )}
            >
              <GripVertical className="w-3 h-3 shrink-0 opacity-40 group-hover:opacity-100 cursor-grab active:cursor-grabbing" />
              <Icon className="w-3 h-3 shrink-0" />
              <span className="flex-1 truncate font-medium">{el.label}</span>

              <button
                onClick={(e) => { e.stopPropagation(); onUpdateOverride(el.key, { locked: !isLocked }); }}
                className={cn("w-5 h-5 flex items-center justify-center rounded hover:bg-muted/50",
                  isLocked ? "text-warning" : "text-muted-foreground/40 opacity-0 group-hover:opacity-100"
                )}
              >
                {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateOverride(el.key, { hidden: !isHidden }); }}
                className={cn("w-5 h-5 flex items-center justify-center rounded hover:bg-muted/50",
                  isHidden ? "text-destructive" : "text-muted-foreground/40 opacity-0 group-hover:opacity-100"
                )}
              >
                {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center py-4">슬라이드에 요소가 없습니다</p>
      )}
    </div>
  );
}
