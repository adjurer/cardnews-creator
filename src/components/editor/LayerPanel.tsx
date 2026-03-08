import { useState, useCallback } from "react";
import { Eye, EyeOff, Lock, Unlock, GripVertical, Type, Image as ImageIcon, Tag, Quote, ListOrdered, MousePointer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Slide, ElementKey, ElementOverride, SlideVisibility } from "@/types/project";

const VIS_MAP: Partial<Record<ElementKey, keyof SlideVisibility>> = {
  category: "showCategory",
  subtitle: "showSubtitle",
  highlight: "showHighlight",
  body: "showBody",
  bullets: "showBullets",
  cta: "showCta",
  sourceLabel: "showSourceLabel",
};

interface Props {
  slide: Slide;
  selectedElement: ElementKey | null;
  onSelectElement: (key: ElementKey | null) => void;
  onUpdateOverride: (key: ElementKey, updates: Partial<ElementOverride>) => void;
  onBatchUpdateOverrides: (updates: Record<ElementKey, Partial<ElementOverride>>) => void;
  onToggleVisibility?: (updates: Partial<SlideVisibility>) => void;
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

export function LayerPanel({ slide, selectedElement, onSelectElement, onUpdateOverride, onBatchUpdateOverrides, onToggleVisibility }: Props) {
  const overrides = slide.elementOverrides || {};
  const vis = slide.visibility || {};
  const [dragKey, setDragKey] = useState<ElementKey | null>(null);
  const [dropLine, setDropLine] = useState<number | null>(null);

  // Show all elements that have content OR are always-present (title, image, logo)
  const visibleElements = ELEMENT_DEFS.filter(e => {
    const content = e.getContent(slide);
    return content !== undefined && content !== "";
  });

  const sorted = [...visibleElements].sort((a, b) => {
    const zA = overrides[a.key]?.zIndex ?? 0;
    const zB = overrides[b.key]?.zIndex ?? 0;
    return zB - zA;
  });

  // Check if element is hidden (via visibility OR override)
  const isElementHidden = (key: ElementKey): boolean => {
    const visKey = VIS_MAP[key];
    if (visKey && vis[visKey] === false) return true;
    return overrides[key]?.hidden === true;
  };

  const toggleElementVisibility = (key: ElementKey) => {
    const visKey = VIS_MAP[key];
    if (visKey && onToggleVisibility) {
      // Use visibility system for text elements
      const currentlyHidden = vis[visKey] === false;
      onToggleVisibility({ [visKey]: currentlyHidden ? true : false });
    } else {
      // Use override hidden for image/logo/title
      const ovr = overrides[key] || {};
      onUpdateOverride(key, { hidden: !ovr.hidden });
    }
  };

  const handleDragStart = useCallback((e: React.DragEvent, key: ElementKey) => {
    setDragKey(key);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDropLine(e.clientY < midY ? idx : idx + 1);
  }, []);

  const handleDrop = useCallback(() => {
    if (dragKey === null || dropLine === null) {
      setDragKey(null);
      setDropLine(null);
      return;
    }
    const fromIdx = sorted.findIndex(e => e.key === dragKey);
    let targetIdx = dropLine;
    if (fromIdx < targetIdx) targetIdx -= 1;
    if (fromIdx === targetIdx || fromIdx < 0) {
      setDragKey(null);
      setDropLine(null);
      return;
    }

    const newOrder = [...sorted];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(targetIdx, 0, moved);

    const batch: Record<string, Partial<ElementOverride>> = {};
    newOrder.forEach((el, i) => {
      batch[el.key] = { zIndex: (newOrder.length - 1 - i) * 10 };
    });
    onBatchUpdateOverrides(batch as Record<ElementKey, Partial<ElementOverride>>);

    setDragKey(null);
    setDropLine(null);
  }, [dragKey, dropLine, sorted, onBatchUpdateOverrides]);

  const handleDragEnd = useCallback(() => {
    setDragKey(null);
    setDropLine(null);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropLine(null);
  }, []);

  const DropIndicator = () => (
    <div className="h-[2px] bg-primary rounded-full mx-2 my-[-1px] relative z-10" />
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">레이어</span>
        <span className="text-[9px] text-muted-foreground">{sorted.length}개 요소</span>
      </div>
      <div onDragLeave={handleDragLeave}>
        {sorted.map((el, idx) => {
          const isSelected = selectedElement === el.key;
          const isHidden = isElementHidden(el.key);
          const isLocked = overrides[el.key]?.locked;
          const isDragging = dragKey === el.key;
          const Icon = el.icon;
          const showLineBefore = dropLine === idx && dragKey !== null && dragKey !== el.key;

          return (
            <div key={el.key}>
              {showLineBefore && <DropIndicator />}
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, el.key)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onClick={() => onSelectElement(isSelected ? null : el.key)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors group text-[11px]",
                  isSelected ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface hover:text-foreground",
                  isHidden && "opacity-40",
                  isDragging && "opacity-30",
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
                  onClick={(e) => { e.stopPropagation(); toggleElementVisibility(el.key); }}
                  className={cn("w-5 h-5 flex items-center justify-center rounded hover:bg-muted/50",
                    isHidden ? "text-destructive" : "text-muted-foreground/40 opacity-0 group-hover:opacity-100"
                  )}
                >
                  {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
              {idx === sorted.length - 1 && dropLine === sorted.length && dragKey !== null && <DropIndicator />}
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
