import { Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown, Type, Image as ImageIcon, Tag, Quote, ListOrdered, MousePointer } from "lucide-react";
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

  const visibleElements = ELEMENT_DEFS.filter(e => {
    const content = e.getContent(slide);
    return content !== undefined && content !== "";
  });

  // Sort by zIndex descending (higher zIndex = higher in list)
  const sorted = [...visibleElements].sort((a, b) => {
    const zA = overrides[a.key]?.zIndex ?? 0;
    const zB = overrides[b.key]?.zIndex ?? 0;
    return zB - zA;
  });

  const moveUp = (key: ElementKey) => {
    const idx = sorted.findIndex(e => e.key === key);
    if (idx <= 0) return;
    const currentZ = overrides[key]?.zIndex ?? 0;
    const aboveKey = sorted[idx - 1].key;
    const aboveZ = overrides[aboveKey]?.zIndex ?? 0;
    // Swap zIndex values; ensure they differ
    const newAboveZ = Math.min(currentZ, aboveZ - 1);
    const newCurrentZ = Math.max(aboveZ, currentZ + 1);
    onUpdateOverride(key, { zIndex: newCurrentZ });
    onUpdateOverride(aboveKey, { zIndex: newAboveZ });
  };

  const moveDown = (key: ElementKey) => {
    const idx = sorted.findIndex(e => e.key === key);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const currentZ = overrides[key]?.zIndex ?? 0;
    const belowKey = sorted[idx + 1].key;
    const belowZ = overrides[belowKey]?.zIndex ?? 0;
    const newBelowZ = Math.max(currentZ, belowZ + 1);
    const newCurrentZ = Math.min(belowZ, currentZ - 1);
    onUpdateOverride(key, { zIndex: newCurrentZ });
    onUpdateOverride(belowKey, { zIndex: newBelowZ });
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">레이어</span>
        <span className="text-[9px] text-muted-foreground">{sorted.length}개 요소</span>
      </div>
      {sorted.map((el, idx) => {
        const ovr = overrides[el.key] || {};
        const isSelected = selectedElement === el.key;
        const isHidden = ovr.hidden;
        const isLocked = ovr.locked;
        const Icon = el.icon;

        return (
          <div
            key={el.key}
            onClick={() => onSelectElement(isSelected ? null : el.key)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all group text-[11px]",
              isSelected ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface hover:text-foreground",
              isHidden && "opacity-40"
            )}
          >
            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); moveUp(el.key); }}
                disabled={idx === 0}
                className="w-4 h-3 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); moveDown(el.key); }}
                disabled={idx === sorted.length - 1}
                className="w-4 h-3 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
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

      {sorted.length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center py-4">슬라이드에 요소가 없습니다</p>
      )}
    </div>
  );
}
