import { useState } from "react";
import { useStylePresetStore, type SavedStylePreset } from "@/store/useStylePresetStore";
import type { Slide, ThemePreset, SlideTypography, SlideColors, SlidePosition } from "@/types/project";
import { cn } from "@/lib/utils";
import { THEME_LABELS } from "@/lib/themes";
import { Save, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  slide: Slide;
  onApplyPreset: (updates: {
    themePreset: ThemePreset;
    typography?: Partial<SlideTypography>;
    colors?: Partial<SlideColors>;
    position?: Partial<SlidePosition>;
  }) => void;
}

export function StylePresetPanel({ slide, onApplyPreset }: Props) {
  const { presets, addPreset, deletePreset } = useStylePresetStore();
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState("");
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("프리셋 이름을 입력해주세요");
      return;
    }
    addPreset({
      name: name.trim(),
      themePreset: slide.themePreset,
      typography: slide.typography,
      colors: slide.colors,
      position: slide.position,
    });
    setName("");
    setShowSave(false);
    toast.success("스타일 프리셋이 저장되었습니다");
  };

  const handleApply = (preset: SavedStylePreset) => {
    onApplyPreset({
      themePreset: preset.themePreset,
      typography: preset.typography ? { ...preset.typography } : undefined,
      colors: preset.colors ? { ...preset.colors } : undefined,
      position: preset.position ? { ...preset.position } : undefined,
    });
    setAppliedId(preset.id);
    setTimeout(() => setAppliedId(null), 1500);
    toast.success(`"${preset.name}" 프리셋이 적용되었습니다`);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deletePreset(id);
    toast.success("프리셋이 삭제되었습니다");
  };

  return (
    <div className="space-y-2">
      {/* Saved presets list */}
      {presets.length > 0 && (
        <div className="space-y-1">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApply(preset)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all group",
                "bg-surface border border-border hover:border-primary/40 hover:bg-muted/50"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-foreground truncate">
                  {preset.name}
                </div>
                <div className="text-[9px] text-muted-foreground">
                  {THEME_LABELS[preset.themePreset]}
                </div>
              </div>
              {appliedId === preset.id ? (
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              ) : (
                <Trash2
                  className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive shrink-0 transition-all"
                  onClick={(e) => handleDelete(preset.id, e)}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Save new preset */}
      {showSave ? (
        <div className="flex gap-1.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="프리셋 이름"
            className="flex-1 bg-surface rounded-lg px-3 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border"
          />
          <button
            onClick={handleSave}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-primary text-primary-foreground hover:opacity-90"
          >
            저장
          </button>
          <button
            onClick={() => { setShowSave(false); setName(""); }}
            className="px-2 py-1.5 rounded-lg text-[10px] text-muted-foreground hover:text-foreground bg-surface border border-border"
          >
            취소
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowSave(true)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground bg-surface border border-dashed border-border hover:border-primary/40 transition-all"
        >
          <Save className="w-3 h-3" />
          현재 스타일을 프리셋으로 저장
        </button>
      )}
    </div>
  );
}
